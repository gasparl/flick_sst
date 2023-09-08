// @ts-nocheck
/*jshint esversion: 6 */

// define global variables
let date_time, jscd_text, text_to_show, disp_start, disp_start_noRAF, disp_stop, faulty,
    input_time, allstims, f_name, startButton, stimulusElem, trial_touch_data;
let start_div = "intro_id", // default: intro_id | instructions_id | task_id | end_id
    trialnum = 0,
    startclicked = false,
    userid = "noid",
    phase = "practice",
    full_touch_data = [],
    demo = false;
const time_limit = 800;

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
    document.getElementById(start_div).style.display = 'block';
});


const cancel = function() {
    // TODO
    if (!userid.startsWith("GL")) {
        document.getElementById('pretest_id').style.display = 'none';
        document.getElementById('cancel_id').style.display = 'block';
        f_name = 'flick_sst_x_pilot.txt';
        full_data = jscd_text + '\t' + date_time + '\n';
        upload();
    }
};


function begin() {
    fullscreen_on();
    keep_state();
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

    faulty = { ended: 0, wrong_move: 0 };
    trial_start();
}

const warn_touch = function() {
    clearTimeout(go_TO);
    startButton.innerHTML = '❗';
    stimulusElem.innerHTML = 'Please touch the button to start the next trial.';
    startButton.classList.add('button_highlight');
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

const getFramePos = function() {
    leftLineRect = document.getElementById('left_id').getBoundingClientRect();
    rightLineRect = document.getElementById('right_id').getBoundingClientRect();
    frameRect = document.getElementById("frame_id").getBoundingClientRect();
};

let warning_TO, go_TO;

function trial_start() {
    trial_touch_data = [];
    getFramePos();
    warning_TO = setTimeout(() => {
        if (startButton.classList.contains("button_highlight")) {
            warn_touch();
        }
    }, 3000);
    startButton.classList.add('button_highlight');
    startButton.ontouchmove = null;
    startButton.ontouchend = null;
    startButton.ontouchstart = function(ev) {
        // Remember starting point
        ev.preventDefault();
        console.log('Touch started.');
        const startTouch = ev.touches[0];
        const buttonRect = startButton.getBoundingClientRect();
        let touchStartedInside = isPointInCircle(startTouch, buttonRect);

        // If touch started inside the button
        if (touchStartedInside) {
            console.log('Touch started inside the button.');
            highlight_remove();
            clearTimeout(warning_TO);

            go_TO = setTimeout(() => stimulusElem.textContent = '↑', 300);

            // Detect if the touch moves out of the circle or ends
            startButton.ontouchmove = function(event) {
                event.preventDefault();
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
                    faulty.wrong_move++;
                    trial_start();
                }
            };

            // Detect if the touch ends
            startButton.ontouchend = function(event) {
                event.preventDefault();
                console.log('Touch ended.');
                warn_touch();
                faulty.ended++;
                trial_start();
            };
        }
    };
}

const runtrial = function() {
    startButton.ontouchstart = null;
    startButton.ontouchmove = null;
    startButton.ontouchend = null;
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
        if (phase !== "practice") {
            setTimeout(function() {
                store_trial();
            }, time_limit);
        }
    });
    startButton.ontouchmove = (event) => get_coords(event, 1);
    startButton.ontouchstart = (event) => get_coords(event, 0);
    startButton.ontouchend = (event) => get_coords(event, 2);
};

let frameRect, leftLineRect, rightLineRect;

const get_coords = function(event, type) {
    event.preventDefault();

    if (event.changedTouches.length === 0) {
        console.warn('No changed touches available');
        return;
    }

    const currentTouch = event.changedTouches[0];

    // store relative coordinates
    if ((performance.now() - disp_start) < time_limit) {
        // Calculate coordinates relative to the "frame_id" element
        const relativeX = currentTouch.clientX - frameRect.left;
        // Subtract from the height to get Y-coordinate relative to bottom-left corner
        const relativeY = frameRect.height - (currentTouch.clientY - frameRect.top);
        trial_touch_data.push([event.timeStamp, relativeX, relativeY, type]);
    }

    // Detect if touch crosses the lines
    if ((currentTouch.clientX <= leftLineRect.right && current_stim.item === '←') || (currentTouch.clientX >= rightLineRect.left && current_stim.item === '→')) {
        fullscreen_on();
        stimulusElem.textContent = '';
        startButton.ontouchmove = null;
        startButton.ontouchstart = null;
        startButton.ontouchend = null;
        if (phase === "practice") {
            store_trial();
        }
    }
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
    "ended",
    "wrong_move",
    "time_now"
].join('\t') + '\n';

function store_trial() {
    full_touch_data.push(...trial_touch_data);
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
        faulty.ended,
        faulty.wrong_move,
        Math.round(performance.now() * 100) / 100
    ].join('\t') + '\n';
    faulty = { ended: 0, wrong_move: 0 };
    if (allstims.length > 0) {
        trial_start();
    } else if (phase === "practice") {
        setTimeout(function() {
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
    document.getElementById('end_id').style.display = 'block';
    f_name = 'flick_sst_pilot1_' + jscd.os + '_' +
        jscd.browser + '_' + date_time + '_' + userid + '.txt';
    document.getElementById("subj_id").innerText = date_time + '_' + userid;
    full_data += jscd_text + "\n" + JSON.stringify(full_touch_data);
    upload();
    document.ontouchstart = () => {
        fullscreen_off();
        document.ontouchstart = null;
    };
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

    if (params.get('demo') !== null) {
        misc.demo = true;
        // (this variable is then used everywhere else to decide whether the app 
        // should act as in case of a demo version)
    }


    const page = params.get('p');
    if (document.getElementById(page) && document.getElementById(page).classList.contains('page')) {
        start_div = page;
    }
}

// store data on server
const upload = function() {
    document.getElementById("retry_button").disabled = true;
    document.getElementById('pass_id').innerHTML += spinner_content;
    document.documentElement.style.cursor = 'wait';
    fetch('./store.php', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/plain'
        },
        body: JSON.stringify({
            fname_post: f_name, // name of the file to be saved at the server
            results_post: full_data // data (text content) of the file
        })
    })
        .then(response => response.text())
        .then(echoed => {
            // in case of successful server connection [n27]
            console.log(echoed);
            document.documentElement.style.cursor = 'auto';
            if (echoed.startsWith("http")) {
                // in case of message indicating successful file saving [n29]
                // (here "http" indicates the reception of a completion link)
                document.getElementById('save_fail').style.display = 'none';
                document.getElementById('save_success').style.display = 'block';

                // disable warning in case of page unload
                window.onbeforeunload = null;

                document.getElementById('pass_id').innerHTML = '<a href="' + echoed + '" target="_blank">' + echoed + '</a>';
            } else {
                // in case there was some issue with file saving
                upload_fail();
                document.getElementById('pass_id').innerHTML = echoed;
            }
        })
        .catch((error) => {
            // in case of server error [n28]
            console.log('Request failed: ', error);
            document.documentElement.style.cursor = 'auto';
            upload_fail();
            document.getElementById('pass_id').innerHTML = 'Server connection failed! ' + error;
        });
};

// if the data was not saved successfully [n28]
const upload_fail = function() {
    document.getElementById("retry_button").disabled = false;
    document.getElementById('retry_spin').innerHTML = '';
    document.getElementById('save_fail').style.display = 'block';
    document.getElementById('save_success').style.color = '#008000';
};
