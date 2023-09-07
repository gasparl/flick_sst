// @ts-nocheck
/*jshint esversion: 6 */

// define global variables
let date_time, jscd_text, listenkey, text_to_show, disp_start, disp_start_noRAF, disp_stop,
    input_time, allstims, f_name, startButton, stimulusElem;
let trialnum = 0,
    startclicked = false,
    userid = "noid",
    phase = "practice",
    listen = false,
    full_touch_data = [];

document.addEventListener("DOMContentLoaded", function() {

    startButton = document.getElementById('button_id');
    stimulusElem = document.getElementById('stimulus_id');
    userid_check();
    // define a small information box for continually updated info about the ongoing trials
    let heads = ["os", "os_v", "browser", "browser_v", "screen", "GlRenderer", "Resolution", "Model"];
    let cols = [jscd.os, jscd.osVersion, jscd.browser, jscd.browserVersion, jscd.screen, MobileDevice.getGlRenderer(), MobileDevice.getResolution(), MobileDevice.getModels().join(' or ')];
    // let jscd_show = heads.map(function(hed, ind) {
    //     return ('<br>' + hed + ': <b>' + cols[ind] + '</b>');
    // });
    date_time = neat_date();
    heads.push("start");
    cols.push(Math.round(performance.now() * 100) / 100);
    jscd_text = 'client\t' + heads.join('/') + '\t' + cols.join('/');


    // TODO
    // if (!('ontouchmove' in window.document)) {
    //     cancel();
    //     return;
    // }

    // startpage
    document.getElementById('instructions_id').style.display = 'block';
    // default: intro_id | instructions_id | task_id | end_id

});


const cancel = function() {
    if (!userid.startsWith("GL")) {
        document.getElementById('pretest_id').style.display = 'none';
        document.getElementById('cancel_id').style.display = 'block';
        f_name = 'flick_sst_x_pilot.txt';
        full_data = jscd_text + '\t' + date_time + '\n';
        upload();
    }
};


function begin() {
    DT.loopOn();

    let reps = 5;
    if (phase == "main") {
        reps = 10;
    }
    allstims = new Array(reps).fill({
        item: "→",
        ssd: 0
    });
    for (let i = 0; i < reps; i++) {
        allstims.push({
            item: "←",
            ssd: 0
        });
    }
    if (phase == "main") {
        [100, 150, 200, 250, 300].forEach((ssd_it) => {
            allstims.push({
                item: "→",
                ssd: ssd_it
            });
            allstims.push({
                item: "←",
                ssd: ssd_it
            });
        });
    }
    allstims = shuffle(allstims);
    document.getElementById('instructions_id').style.display = 'none';
    document.getElementById('instructions2_id').style.display = 'none';
    document.getElementById('task_id').style.display = 'block';

    trial_start();
}

const warn_touch = function() {
    startButton.innerHTML = '❗';
    stimulusElem.innerHTML = 'Please touch the button to start the next trial.';
    startButton.classList.add('button_highlight');
    trial_start();
};

const highlight_remove = function() {
    startButton.innerHTML = '';
    stimulusElem.innerHTML = '';
    startButton.classList.remove('button_highlight');
};

// Helper function to check if a point is inside a circle
function isPointInCircle(point, rect) {
    const dx = point.clientX - (rect.left + rect.width / 2);
    const dy = point.clientY - (rect.top + rect.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= rect.width / 2;
}

let warning_TO;

function trial_start() {
    warning_TO = setTimeout(() => {
        if (startButton.classList.contains("button_highlight")) {
            warn_touch();
        }
    }, 3000);
    startButton.classList.add('button_highlight');
    button.ontouchmove = null;
    startButton.ontouchstart = function(event) {
        // Remember starting point
        const startTouch = event.touches[0];
        const buttonRect = startButton.getBoundingClientRect();
        let touchStartedInside = isPointInCircle(startTouch, buttonRect);

        // If touch started inside the button
        if (touchStartedInside) {
            console.log('Touch started inside the button.');
            highlight_remove();
            clearTimeout(warning_TO);

            setTimeout(() => stimulusElem.textContent = '↑', 300);

            // Detect if the touch moves out of the circle or ends
            startButton.ontouchmove = function(event) {
                const currentTouch = event.touches[0];
                const buttonRect = startButton.getBoundingClientRect();

                // Check if moved upwards and left from top boundary
                if (stimulusElem.textContent === '↑' && currentTouch.clientY < buttonRect.top &&
                    currentTouch.clientX >= buttonRect.left && currentTouch.clientX <= buttonRect.right) {
                    console.log('Touch moved upwards and left the button.');
                    runtrial();
                } else if (
                    currentTouch.clientY > buttonRect.bottom ||
                    currentTouch.clientX < buttonRect.left ||
                    currentTouch.clientX > buttonRect.right
                ) {
                    console.log('Touch moved in the wrong direction.');
                    warn_touch();
                }
            };
        }

        // Detect if the touch ends
        startButton.ontouchend = function(event) {
            console.log('Touch ended.');
            warn_touch();
        };

    };
}

const runtrial = function() {
    button.ontouchstart = null;
    button.ontouchmove = null;
    button.ontouchend = null;
    listen = false;
    trialnum++;
    disp_start = "NA";
    disp_stop = "NA";
    current_stim = allstims.shift(); // get next stimulus dictionary
    console.log(current_stim); // print info

    disp_start_noRAF = Math.round(performance.now() * 100) / 100;
    requestAnimationFrame(function(stamp) {
        stimulusElem.textContent = current_stim.item;
        disp_start = Math.round(stamp * 100) / 100; // the crucial (start) JS-timing
        if (current_stim.ssd > 0) {
            setTimeout(function() {
                requestAnimationFrame(function(stamp2) {
                    stimulusElem.textContent = 'x ' + stimulusElem.textContent + ' x';
                    disp_stop = stamp2;
                });

            }, current_stim.ssd - 8);
        }
        if (phase === "practice") {
            listen = true;
        } else {
            setTimeout(function() {
                store_trial();
            }, 800);
        }
    });

    startButton.ontouchmove = function(event) {

        evt.preventDefault();
        full_touch_data.push([evt.timeStamp, evt.changedTouches[0].screenX, evt.changedTouches[0].screenY, type]);

        const currentTouch = event.touches[0];

        const leftLineRect = document.getElementById('left_line').getBoundingClientRect();
        const rightLineRect = document.getElementById('right_line').getBoundingClientRect();

        // Detect if touch crosses the lines
        if (currentTouch.clientX <= leftLineRect.right && current_stim.item === '←') {
            console.log('Touch crossed the left line.');
            // Add your logic here
        } else if (currentTouch.clientX >= rightLineRect.left && current_stim.item === '→') {
            console.log('Touch crossed the right line.');
            // Add your logic here
        }
    };
};


const randomdigit = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

//*** storing data, etc. ***//

// column names for the data to be saved
let full_data = [
    "datetime_id",
    "phase",
    "trial_number",
    "type",
    "ssd",
    "disp_start",
    "disp_start_noRAF",
    "disp_stop",
    "time_now"
].join('\t') + '\n';

function store_trial() {
    stimulusElem.textContent = '';
    full_data += [
        date_time,
        phase,
        trialnum,
        current_stim.item,
        current_stim.ssd,
        disp_start,
        disp_start_noRAF,
        disp_stop,
        Math.round(performance.now() * 100) / 100
    ].join('\t') + '\n';
    if (allstims.length > 0) {
        trial_start();
    } else if (phase === "practice") {
        setTimeout(function() {
            document.getElementById('contain1').style.display = 'none';
            document.getElementById('contain2').style.display = 'none';
            phase = "main";
            document.getElementById('task_id').style.display = 'none';
            document.getElementById('instructions2_id').style.display = 'block';
        }, 500);
    } else {
        setTimeout(ending, 500);
    }

}

// change rectangle color to blue to indicate experiment ending
function ending() {
    full_touch_data = full_touch_data.map(elem => {
        elem[0] = Math.round(elem[0] * 100) / 100;
        return (elem);
    });
    document.getElementById('task_id').style.display = 'none';
    console.log('THE END');
    f_name = 'flick_sst_pilot1_' + jscd.os + '_' +
        jscd.browser + '_' + date_time + '_' + userid + '.txt';
    full_data += jscd_text + "\n" + JSON.stringify(full_touch_data);
    upload();
}


// function to download (save) results data as a text file
function dl_as_file() {
    filename_to_dl = f_name;
    data_to_dl = full_data;
    let blobx = new Blob([data_to_dl], {
        type: 'text/plain'
    });
    let elemx = window.document.createElement('a');
    elemx.href = window.URL.createObjectURL(blobx);
    elemx.download = filename_to_dl;
    document.body.appendChild(elemx);
    elemx.click();
    document.body.removeChild(elemx);
}

function userid_check() {
    window.params = new URLSearchParams(location.search);
    userid = params.get('PROLIFIC_PID');
    if (userid != null) {
        document.getElementById('pay_info').textContent = "Completed and valid participation will be rewarded with 0.40 GBP via Prolific.";
        if (userid.startsWith("GL")) {
            go();
        }
    } else {
        userid = "noid";
    }
}

// store data on server

function upload() {
    document.getElementById('end_id').innerHTML = "That's all, thank you! <h3>Please use the following Prolific completion link:</h3> [...] <br><br>(The data was successfully saved on the sever, you can close this page.)";
    document.getElementById('end_id').style.display = 'block';
    return;
}


function uploadOriginal() {
    fetch('https://homepage.univie.ac.at/gaspar.lukacs/flick_sst_results/store.php', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/plain'
        },
        body: JSON.stringify({
            fname_post: f_name,
            results_post: full_data
        })
    })
        .then(response => response.text())
        .then(echoed => {
            console.log(echoed);
            if (echoed.startsWith("http")) {
                document.getElementById('end_id').innerHTML = "That's all, thank you! <h3>Please use the following Prolific completion link:</h3> <a href='" + echoed + "' target='_blank'>" + echoed + "</a><br><br>(The data was successfully saved on the sever, you can close this page.)";
            }
            if (document.getElementById('cancel_id').style.display !== 'block') {
                document.getElementById('end_id').style.display = 'block';
            }
        })
        .catch((error) => {
            console.log('Request failed: ', error);
            if (document.getElementById('cancel_id').style.display !== 'block') {
                document.getElementById('end_id').style.display = 'block';
            }
        });
}
