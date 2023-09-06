// @ts-nocheck
/*jshint esversion: 6 */

// define global variables
let date_time, jscd_text, listenkey, text_to_show, disp_start, disp_stop,
    input_time, allstims, f_name;
let trialnum = 0,
    startclicked = false,
    userid = "noid",
    phase = "practice",
    listen = false;

document.addEventListener("DOMContentLoaded", function() {
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

    // startpage
    document.getElementById('instructions_id').style.display = 'block';
    // default: intro_id | instructions_id | task_id | end_id

    document.getElementById('frame_demo').addEventListener('touchstart', function(evt) {
        evt.preventDefault();
        fullscreen_on();
    });
});

function begin() {
    document.getElementById('lighten').style.display = 'none';
    DT.loopOn();
    ['btn_id_left', 'btn_id_right'].forEach((id) => {
        document.getElementById(id).innerHTML = '<br>Touch here!';
        document.getElementById(id).style.backgroundColor = "red";
    });
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
    next_trial();
}

function next_trial() {
    setTimeout(function() {
        if (document.getElementById('btn_id_left').style.backgroundColor == "red" ||
            document.getElementById('btn_id_right').style.backgroundColor == "red") {
            //console.log('Failed trial (no touch).');
            next_trial();
            return;
            // commented out for demo
            // } else if (document.getElementById('btn_id_left').classList.contains("pressd") || document.getElementById('btn_id_right').classList.contains("pressd")) {
            //     document.getElementById('lighten').style.display = 'block';
            //     //console.log('Failed trial (press in progress).');
            //     next_trial();
            //     return;
        } else {
            document.getElementById('lighten').style.display = 'none';
        }

        setTimeout(runtrial, randomdigit(400, 900));

    }, 100);
}

const runtrial = function() {
    listen = false;
    document.getElementById('stimulus_id').textContent = '+';
    trialnum++;
    disp_start = "NA";
    disp_stop = "NA";
    current_stim = allstims.shift(); // get next stimulus dictionary
    console.log(current_stim); // print info

    requestAnimationFrame(function(stamp) {
        document.getElementById('stimulus_id').textContent = current_stim.item;
        disp_start = stamp; // the crucial (start) JS-timing
        if (current_stim.ssd > 0) {
            setTimeout(function() {
                requestAnimationFrame(function(stamp2) {
                    document.getElementById('stop_id').textContent = 'STOP!';
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
    "disp_stop",
    "time_now"
].join('\t') + '\n';

function store_trial() {
    document.getElementById('stimulus_id').textContent = '+';
    document.getElementById('stop_id').textContent = '';
    full_data += [
        date_time,
        phase,
        trialnum,
        current_stim.item,
        current_stim.ssd,
        disp_start,
        disp_stop,
        Math.round(performance.now() * 100) / 100
    ].join('\t') + '\n';
    if (allstims.length > 0) {
        next_trial();
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
    full_touch_data.left = full_touch_data.left.map(elem => {
        elem[0] = Math.round(elem[0] * 100) / 100;
        return (elem);
    });
    full_touch_data.right = full_touch_data.right.map(elem => {
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

// get readable current date and time
function neat_date() {
    let m = new Date();
    return m.getFullYear() + "_" +
        ("0" + (m.getMonth() + 1)).slice(-2) + "" +
        ("0" + m.getDate()).slice(-2) + "_" +
        ("0" + m.getHours()).slice(-2) + "" +
        ("0" + m.getMinutes()).slice(-2);
}

// order randomization function
function shuffle(arr) {
    let array = JSON.parse(JSON.stringify(arr));
    let newarr = [];
    let currentIndex = array.length,
        temporaryValue,
        randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        newarr[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return newarr;
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
