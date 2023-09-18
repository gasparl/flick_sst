# neatStats usage example: pipeline from raw data to reportable statistics

library('neatStats')
library('ggplot2')
library('data.table')
library('ggpubr')
library('viridis')

setwd(path_neat('/../flick_results')) # set the result files' folder path as current working directory


filenames = list.files(pattern = "^flick_pilot.*\\.txt$") # get all result file names

do_plot = TRUE
do_plot_epoch = TRUE
epoch_minus = 100
epoch_plus = 1200

vel_adjust = 10
vel_adjust_agg = 5

remove_outliers <- function(df, column_name) {
    df[df[[column_name]] > vel_adjust, column_name] <- vel_adjust
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
                xlim(-250, 250) +
                ylim(0, 300) +
                theme_bw(base_size = 26)
        } else {
            temp_data = data.frame(time = movement_epoch$time, value = movement_epoch[[data_type]], type = data_type)
            
            # Scale the velocity to fit into the -250 to 250 range
            if (data_type == "velocity") {
                temp_data$value = (temp_data$value / vel_adjust) * 250
            }
            
            combined_data <- rbind(combined_data, temp_data)
        }
    }
    
    if (!is.na(rowx$r_x) && !is.na(rowx$r_y)) {
        trajectory_plot = trajectory_plot +
            geom_point(aes(x = rowx$r_x, y = rowx$r_y), color = "green", shape = 19, size = 5)
    } else {
        trajectory_plot = trajectory_plot +
            geom_point(aes(x = tail(movement_epoch$x, 1), y = tail(movement_epoch$y, 1)), color = "red", shape = 15, size = 5)
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
        theme_bw(base_size = 26)+
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
            limits = c(rowx$trialInfo.start-10, rowx$trialInfo.start+800),
            labels = function(x)
                x - rowx$trialInfo.start,
            breaks = seq(rowx$trialInfo.start, max(movement_epoch$time), by = 500)
        )
    
    if (!is.na(rowx$trialInfo.stopSignal)) {
        timeline_plot = timeline_plot +
            geom_vline(
                xintercept = rowx$trialInfo.stopSignal,
                linetype = "dotted",
                color = "#cc0000"
            ) +
            geom_text(
                aes(
                    x = rowx$trialInfo.stopSignal,
                    label = "Stop",
                    y = -250 * 0.65
                ),
                nudge_x = 25,
                colour = "#cc0000",
                angle = 90,
                size = 10
            )
    }
    
    if (!is.na(rowx$r_time) && !is.na(rowx$r_x) && !is.na(rowx$r_y)) {
        timeline_plot = timeline_plot +
            geom_point(aes(x = rowx$r_time, y = rowx$r_x), color = "green", shape = 19, size = 5) +
            geom_vline(xintercept = rowx$r_time, color = "green", linetype = "dotted")
    } else {
        last_time = tail(movement_epoch$time, 1)
        timeline_plot = timeline_plot +
            geom_point(aes(x = last_time, y =  tail(movement_epoch$x, 1)), color = "red", shape = 15, size = 5) +
            geom_vline(xintercept = last_time, color = "red", linetype = "dotted")
    }
    
    combined_plot = ggarrange(plotlist = list(timeline_plot, trajectory_plot),
                              ncol = 1,
                              nrow = 2)
    
    ggsave(
        filename = paste0('./figs/trial_fig_', file_name[1], '_', rowx$trial_number, '.jpeg'),
        plot = combined_plot,
        units = "mm",
        width = 400,
        height = 400,
        dpi = 300
    )
}


plot_aggregate <- function(all_epochs_li, subj_num) {
    # Extract touch_epoch and rowx from all_epochs_li
    touch_epochs_li <- lapply(all_epochs_li, function(item) item$touch_epoch)
    rowx_li <- lapply(all_epochs_li, function(item) item$rowx)
    
    # Add epoch_id and normalize time to each epoch data frame
    touch_epochs_li <- lapply(seq_along(touch_epochs_li), function(i) {
        epoch <- touch_epochs_li[[i]]
        min_time <- min(epoch$time, na.rm = TRUE)
        epoch$time <- epoch$time - min_time
        epoch$epoch_id <- i
        return(epoch)
    })
    
    # Combine all epochs into one data frame
    all_epochs <- do.call(rbind, touch_epochs_li)
    setDT(all_epochs)  # Convert to data.table
    
    # Handle the case of empty all_epochs
    if (nrow(all_epochs) == 0) {
        stop("All epochs are empty. Cannot proceed.")
    }
    
    # Define a consistent time sequence to interpolate to
    max_time <- max(all_epochs$time, na.rm = TRUE)
    time_seq <- seq(0, max_time, by = 10)
    
    # Resample each epoch to the common time sequence
    resampled_data <- rbindlist(lapply(touch_epochs_li, function(epoch) {
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
        geom_ribbon(data = summary_data, aes(x = time, ymin = (avg_velocity / vel_adjust_agg) * 250 - (se_velocity / vel_adjust_agg) * 250, ymax = (avg_velocity / vel_adjust_agg) * 250 + (se_velocity / vel_adjust_agg) * 250), fill = "green", alpha = 0.2) +
        geom_line(data = summary_data, aes(x = time, y = (avg_velocity / vel_adjust_agg) * 250, color = "Velocity"), size = 1) +
        scale_color_manual(values = c("X" = "blue", "Y" = "red", "Velocity" = "green")) +
        scale_y_continuous(name = "Distance (pixels)",
                           sec.axis = sec_axis(~ . * vel_adjust_agg / 250, name = "Velocity (pixel/ms)")) +
        theme_bw(base_size = 26) +
        xlab("Time (ms)") +
        labs(color = "Metrics")
    
    # Plot the trajectory for each epoch
    trajectory_plot <- ggplot(data = all_epochs, aes(x = x, y = y, group = interaction(epoch_id))) +
        geom_vline(xintercept = c(-220, 220), linetype = "dashed", color = "green") +
        geom_path(aes(color = as.factor(epoch_id)), alpha = 0.7) +
        xlim(-250, 250) +
        ylim(0, 300) +
        theme_bw(base_size = 26) +
        theme(legend.position = "none")
    
    # Add endpoint indicators
    for (i in seq_along(rowx_li)) {
        if (!is.na(rowx_li[[i]]$r_y)) {
            trajectory_plot <- trajectory_plot + 
                annotate("point", x = rowx_li[[i]]$r_x, y = rowx_li[[i]]$r_y, color = "green", shape = 19, size = 2)  # Green diamond
        } else {
            last_point <- tail(touch_epochs_li[[i]], 1)
            trajectory_plot <- trajectory_plot + 
                annotate("point", x = last_point$x, y = last_point$y, color = "red", shape = 15, size = 2)  # Red X
        }
    }

    # Combine both plots into one
    combined_plot <- ggarrange(plotlist = list(timeline_plot, trajectory_plot), ncol = 1, nrow = 2)
    
    # Save the combined plot
    ggsave(paste0('./figs/aggregate_fig_', subj_num, '.jpeg'), combined_plot, units = "mm", width = 400, height = 400, dpi = 300)
}

##

# merge all data
data_merged = data.table()

for (file_name in enum(filenames)) {
    #  file_name = c(0, filenames[1])
    all_epochs_list <- list()
    
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
    #subject_data = subject_data[trial_number == 23]
    for (i in seq_len(nrow(subject_data))) {
        rowx = subject_data[i]
        # rowx = subject_data[7]
        
        epoch_start = rowx$trialInfo.start - epoch_minus #-5000
        epoch_end = rowx$trialInfo.start + epoch_plus #+5000
        touch_epoch = touch_data[(touch_data$time >= epoch_start &
                                      touch_data$time <= epoch_end)]
        
        if (do_plot) {
            if (nrow(touch_epoch) > 3) {
                if (is.na(rowx$trialInfo.stopSignal)) {
                    all_epochs_list[[length(all_epochs_list) + 1]] <- list(touch_epoch = touch_epoch, rowx = rowx)
                }
                if (do_plot_epoch) {
                    plot_epoch(rowx, touch_epoch, file_name)
                }
                # plot(touch_plot)
                # message("trial: ", rowx$trial_number)
            } else {
                message("MISSED trial: ", rowx$trial_number)
            }
        }
    }
    
    plot_aggregate(all_epochs_list, file_name[1])
    
    rbind_loop(subjects_merged,
               misc_info)
}


# for (file_name in enum(filenames)) {
#     cat(sub(".txt", "", strsplit(file_name[2], "_")[[1]][8], fixed = TRUE), fill = TRUE)
# }
