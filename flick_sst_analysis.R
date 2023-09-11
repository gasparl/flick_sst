# neatStats usage example: pipeline from raw data to reportable statistics

library('neatStats')
library('ggplot2')
library('data.table')
library('ggpubr')
library('viridis')

setwd(path_neat('/../sst_results')) # set the result files' folder path as current working directory

do_plot = TRUE
epoch_minus = 100
epoch_plus = 900

vel_adjust = 5

remove_outliers <- function(df, column_name) {
    Q1 <- quantile(df[[column_name]], 0.25, na.rm = TRUE)
    Q3 <- quantile(df[[column_name]], 0.75, na.rm = TRUE)
    IQR <- Q3 - Q1
    
    lower_bound <- Q1 - 1.5 * IQR
    upper_bound <- Q3 + 1.5 * IQR
    
    df <- df[df[[column_name]] >= lower_bound & df[[column_name]] <= upper_bound,]
    return(df)
}

plot_epoch <-  function(rowx, movement_epoch, file_name) {
    data_types = c("trajectory", "x", "y", "velocity")
    
    movement_epoch <- movement_epoch[order(movement_epoch$time), ]
    combined_data <- data.frame()
    
    for (data_type in data_types) {
        if (data_type == "trajectory") {
            trajectory_plot = ggplot(data = movement_epoch, aes(x = x, y = y)) +
                geom_point() +
                labs(x = "X", y = "Y") +
                geom_path() +
                geom_vline(xintercept = c(-220, 220), linetype = "dashed", color = "green") +
                coord_cartesian(xlim = c(-250, 250), ylim = c(0, 300)) +
                theme_bw(base_size = 16)
        } else {
            temp_data = data.frame(time = movement_epoch$time, value = movement_epoch[[data_type]], type = data_type)
            
            # Scale the velocity to fit into the -250 to 250 range
            if (data_type == "velocity") {
                temp_data$value = (temp_data$value / vel_adjust) * 250
            }
            
            combined_data <- rbind(combined_data, temp_data)
        }
    }
    
    timeline_plot = ggplot(data = combined_data, aes(x = time, y = value, color = type, linetype = type)) +
        geom_line() +
        geom_point() +
        geom_hline(yintercept = c(-220, 220), linetype = "dashed", color = "green") +
        scale_color_manual(
            name = "Type",
            values = c("x" = "#440154FF", "y" = "#21908CFF", "velocity" = "#FDE725FF"),
            breaks = c("x", "y", "velocity"),
            labels = c("X", "Y", "Velocity")
        ) +
    scale_linetype_manual(
        values = c("x" = "solid", "y" = "solid", "velocity" = "dashed")
    ) +
        guides(
            color = guide_legend(override.aes = list(linetype = c("solid", "solid", "dashed"))),
            linetype = FALSE
        ) +
        scale_y_continuous(name = "coordinate", limits = c(-250, 250), sec.axis = sec_axis(~ . * vel_adjust / 250, name = "velocity")) +
        theme_bw(base_size = 16)+
        labs(
            title = paste0(
                's. #',
                file_name[1],
                ', trial #',
                rowx$trial_number,
                ', correct: ',
                rowx$direction
            ),
            x = "time (ms)"
        ) +
        scale_x_continuous(
            limits = c(rowx$disp_start-10, rowx$disp_start+800),
            labels = function(x)
                x - rowx$disp_start,
            breaks = seq(rowx$disp_start, max(movement_epoch$time), by = 500)
        )
    
    if (!is.na(rowx$disp_stop)) {
        timeline_plot = timeline_plot +
            geom_vline(
                xintercept = rowx$disp_stop,
                linetype = "dotted",
                color = "#cc0000"
            ) +
            geom_text(
                aes(
                    x = rowx$disp_stop,
                    label = "Stop",
                    y = 250 * 0.8
                ),
                nudge_x = 25,
                colour = "#cc0000",
                angle = 90
            )
    }
    
    combined_plot = ggarrange(plotlist = list(timeline_plot, trajectory_plot),
                              ncol = 1,
                              nrow = 2)
    
    ggsave(
        filename = paste0('./figs/combined_fig_', file_name[1], '_', rowx$trial_number, '.jpeg'),
        plot = combined_plot,
        units = "mm",
        width = 400,
        height = 400,
        dpi = 300
    )
}

plot_aggregate <- function(all_epochs_li, subj_num) {
    
    vel_adjust_agg = 2 
    # Add epoch_id and normalize time to each epoch data frame
    all_epochs_li <- lapply(seq_along(all_epochs_li), function(i) {
        epoch <- all_epochs_li[[i]]
        min_time <- min(epoch$time, na.rm = TRUE)
        epoch$time <- epoch$time - min_time
        epoch$epoch_id <- i
        return(epoch)
    })
    
    # Combine all epochs into one data frame
    all_epochs <- do.call(rbind, all_epochs_li)
    setDT(all_epochs)  # Convert to data.table
    
    # Handle the case of empty all_epochs
    if (nrow(all_epochs) == 0) {
        stop("All epochs are empty. Cannot proceed.")
    }
    
    # Define a consistent time sequence to interpolate to
    max_time <- max(all_epochs$time, na.rm = TRUE)
    time_seq <- seq(0, max_time, by = 10)
    
    # Resample each epoch to the common time sequence
    resampled_data <- rbindlist(lapply(all_epochs_li, function(epoch) {
        epoch_data <- data.frame(
            time = time_seq,
            x = approx(epoch$time, abs(epoch$x), time_seq, rule = 2)$y,
            y = approx(epoch$time, epoch$y, time_seq, rule = 2)$y,
            velocity = approx(epoch$time, epoch$velocity, time_seq, rule = 2)$y,
            epoch_id = rep(unique(epoch$epoch_id), length(time_seq))
        )
        return(epoch_data)
    }))
    
    # Calculate mean and standard error for x, y, and velocity
    summary_data <- resampled_data[, .(
        avg_x = mean(x, na.rm = TRUE),
        avg_y = mean(y, na.rm = TRUE),
        avg_velocity = mean(velocity, na.rm = TRUE),
        se_x = sd(x, na.rm = TRUE) / sqrt(.N),
        se_y = sd(y, na.rm = TRUE) / sqrt(.N),
        se_velocity = sd(velocity, na.rm = TRUE) / sqrt(.N)
    ), by = time]
    
    
    # Create the plot for x, y, and velocity
    timeline_plot <- ggplot() +
        geom_ribbon(data = summary_data, aes(x = time, ymin = avg_x - se_x, ymax = avg_x + se_x), fill = "blue", alpha = 0.2) +
        geom_line(data = summary_data, aes(x = time, y = avg_x, color = "X"), size = 1) +
        geom_ribbon(data = summary_data, aes(x = time, ymin = avg_y - se_y, ymax = avg_y + se_y), fill = "red", alpha = 0.2) +
        geom_line(data = summary_data, aes(x = time, y = avg_y, color = "Y"), size = 1) +
        geom_ribbon(data = summary_data, aes(x = time, ymin = (avg_velocity / vel_adjust_agg) * 250 - se_velocity, ymax = (avg_velocity / vel_adjust_agg) * 250 + se_velocity), fill = "green", alpha = 0.2) +
        geom_line(data = summary_data, aes(x = time, y = (avg_velocity / vel_adjust_agg) * 250, color = "Velocity"), size = 1) +
        scale_color_manual(values = c("X" = "blue", "Y" = "red", "Velocity" = "green")) +
        scale_y_continuous(name = "Distance",
                           sec.axis = sec_axis(~ . * vel_adjust_agg / 250, name = "Velocity")) +
        theme_bw(base_size = 16) +
        labs(color = "Metrics")
    
    # Plot the trajectory for each epoch
    trajectory_plot <- ggplot(data = all_epochs, aes(x = x, y = y, group = interaction(epoch_id))) +
        geom_vline(xintercept = c(-220, 220), linetype = "dashed", color = "green") +
        geom_path(aes(color = as.factor(epoch_id)), alpha = 0.4) +
        coord_cartesian(xlim = c(-250, 250), ylim = c(0, 300)) +
        theme_bw(base_size = 16) +
        theme(legend.position = "none")
    
    # Combine both plots into one
    combined_plot <- ggarrange(plotlist = list(timeline_plot, trajectory_plot), ncol = 1, nrow = 2)
    
    # Save the combined plot
    ggsave(paste0('./figs/aggregate_combined_fig_', subj_num, '.jpeg'), combined_plot, units = "mm", width = 400, height = 400, dpi = 300)
}


##


filenames = list.files(pattern = "^flick_sst_pilot.*\\.txt$") # get all result file names

# merge all data
data_merged = data.table()
all_epochs_list <- list()

for (file_name in enum(filenames)) {
    #  file_name = c(0, filenames[1])
    
    # print current file name - just to monitor the process
    cat(file_name, fill = TRUE)
    
    subject_data = data.table::fread(file_name[2],
                                     fill = TRUE)
    
    touch_data = data.table(jsonlite::fromJSON(subject_data[startsWith(subject_data$datetime_id, '[[')]$datetime_id))
    colnames(touch_data) = c("time", "x", "y", "type")
    setkey(touch_data, time)
    
    misc_info = jsonlite::fromJSON(subject_data[startsWith(subject_data$datetime_id, '{')]$datetime_id)
    
    subject_data = subject_data[!(
        startsWith(subject_data$datetime_id, '{') |
            startsWith(subject_data$datetime_id, '[[')
    ),]
    
    subject_data$valid = (is.numeric(subject_data$r_time) & subject_data$ended == 0 && subject_data$wrong_move == 0)

    subject_data$direction[subject_data$direction == '←'] = 'left'
    subject_data$direction[subject_data$direction == '→'] = 'right'
    
    touch_data$y = -touch_data$y
    
    # Calculate distance and time differences
    touch_data[, `:=`(
        dx = c(NA, diff(x)),
        dy = c(NA, diff(y)),
        dt = c(NA, diff(time))
    )]
    
    # Calculate the velocity
    touch_data[, velocity := sqrt(dx ^ 2 + dy ^ 2) / dt]
    
    touch_data <- remove_outliers(touch_data, "velocity")
    
    # Remove columns used for calculations
    touch_data[, c("dx", "dy", "dt") := NULL]
    
    for (i in seq_len(nrow(subject_data))) {
        rowx = subject_data[i]
        
        epoch_start = rowx$disp_start - epoch_minus
        epoch_end = rowx$disp_start + epoch_plus
        
        touch_epoch = touch_data[(touch_data$time >= epoch_start &
                                      touch_data$time <= epoch_end)]
        if (do_plot) {
            if (nrow(touch_epoch) > 3) {
                all_epochs_list[[length(all_epochs_list) + 1]] <- touch_epoch
                plot_epoch(rowx, touch_epoch, file_name)
                # plot(touch_plot)
                # message("trial: ", rowx$trial_number)
                
            } else {
                message("MISSED trial: ", rowx$trial_number)
            }
        }
    }
    
    plot_aggregate(all_epochs_list, file_name[0])
    
    rbind_loop(subjects_merged,
               misc_info)
}


# for (file_name in enum(filenames)) {
#     cat(sub(".txt", "", strsplit(file_name[2], "_")[[1]][8], fixed = TRUE), fill = TRUE)
# }
