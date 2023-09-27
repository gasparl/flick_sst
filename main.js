// @ts-nocheck
/*jshint esversion: 6 */

// define global variables
let allstims, f_name;
let start_div = "intro_id", // default: intro_id | instructions_id | task_id | end_id
    trialnum = 0,
    startclicked = false,
    phase = "practice";
const time_limit = 800;


const misc = {
    userid: "noid",
    demo: false // whether this is a demonstration
};

document.addEventListener("DOMContentLoaded", function() {

    userid_check();

    misc.os = jscd.os;
    misc.os_v = jscd.osVersion;
    misc.browser = jscd.browser;
    misc.browser_v = jscd.browserVersion;
    misc.screen = jscd.screen;
    misc.GlRenderer = MobileDevice.getGlRenderer();
    misc.Resolution = MobileDevice.getResolution();
    misc.Model = MobileDevice.getModels().join(' or ');
    misc.date_time = neat_date();

    // startpage
    document.getElementById(start_div).style.display = 'block';

    flick.maxTrialDuration = time_limit;
});


const cancel = function() {
    // TODO
    if (!misc.userid.startsWith("GL")) {
        document.getElementById('pretest_id').style.display = 'none';
        document.getElementById('cancel_id').style.display = 'block';
        f_name = 'flick_x_pilot.txt';
        full_data = jscd_text + '\t' + misc.date_time + '\n';
        upload();
    }
};

const consent = function() {
    misc.consented = flick.roundTo2(performance.now());
    misc.design = get_radio('design'); // 1 or 2
    misc.task = get_radio('task'); // sst or flank
    flick.isSingle = misc.design === '1';

    document.getElementById('intro_id').style.display = 'none';
    window.scrollTo(0, 0);

    keep_state();
    DT.loopOn();
    orientationWarning(true);

    if (misc.design === '1') {
        for (let button of document.querySelectorAll('.flick-button-left, .flick-button-right')) {
            button.style.display = 'none';
        }
    } else {
        for (let button of document.querySelectorAll('.flick-button-single')) {
            button.style.display = 'none';
        }
        for (let text of document.querySelectorAll('.finger_2')) {
            text.style.display = 'block';
        }
        for (let text of document.querySelectorAll('.finger_1')) {
            text.style.display = 'none';
        }
    }
    if (misc.task === 'sst') {
        for (let stim of document.querySelectorAll('.stop-class')) {
            stim.style.display = 'block';
        }
    }

    document.getElementById('instructions1').style.display = 'block';
};

const begin = function() {
    fullscreen_on();
    allstims = stim[misc.task]();
    allstims = shuffle(allstims);
    document.getElementById('instructions1').style.display = 'none';
    document.getElementById('instructions2_' + misc.task).style.display = 'none';
    document.getElementById('task_id').style.display = 'block';
    next_trial();
};

const stim = {
    flank: () => {
        const config = {
            practiceReps: 3,
            mainReps: 15,
            congruentTypes: ["→→→→→", "←←←←←"],
            incongruentTypes: ["→→←→←", "←←→←←"],
            neutralTypes: ["--→--", "--←--"]
        };
        let allstims = [];
        const { practiceReps, mainReps, congruentTypes, incongruentTypes, neutralTypes } = config;

        let reps = (phase === "main") ? mainReps : practiceReps;

        // Generate congruent stimuli
        for (let i = 0; i < reps; i++) {
            congruentTypes.forEach((type) => {
                allstims.push({
                    item: type,
                    condition: "congruent"
                });
            });
        }

        // Generate incongruent stimuli
        for (let i = 0; i < reps; i++) {
            incongruentTypes.forEach((type) => {
                allstims.push({
                    item: type,
                    condition: "incongruent"
                });
            });
        }

        // // Generate neutral stimuli
        // for (let i = 0; i < reps; i++) {
        //     neutralTypes.forEach((type) => {
        //         allstims.push({
        //             item: type,
        //             condition: "neutral"
        //         });
        //     });
        // }

        allstims.map((stim) => {
            const centralArrow = stim.item[Math.floor(stim.item.length / 2)];
            if (phase === "practice") {
                stim.item = centralArrow;
            }
            // Determine the correct response based on the direction of the central arrow.
            stim.direction = centralArrow === '→' ? "right" : "left";
        });

        // Handle extra logic for different phases
        if (phase === "main") {
            // Any extra stimuli/logic for the main phase
        }
        return allstims;
    },
    sst: () => {
        const config = {
            practiceReps: 3,
            mainReps: 15,
            ssdValues: [100, 150, 200, 250, 300],
            ssdReps: 2
        };

        let allstims = [];
        const { practiceReps, mainReps, ssdValues, ssdReps } = config;

        let reps = (phase === "main") ? mainReps : practiceReps;

        // Add initial stimuli
        allstims = new Array(reps).fill({
            item: "→",
            ssd: 0
        });
        for (let i = 0; i < reps; i++) {
            allstims.push({
                item: "←",
                ssd: 0,
                condition: "go"
            });
        }

        // For main phase, add additional stimuli based on SSD values
        if (phase === "main") {
            for (let i = 0; i < ssdReps; i++) {
                ssdValues.forEach((ssd_it) => {
                    allstims.push({
                        item: "→",
                        ssd: ssd_it,
                        condition: "stop"
                    });
                    allstims.push({
                        item: "←",
                        ssd: ssd_it,
                        condition: "stop"
                    });
                });
            }
        }

        allstims.map((stim) => {
            stim.direction = stim.item === "→" ? "right" : "left";
        });

        return allstims;
    }
};

const next_trial = function() {
    current_stim = allstims.shift(); // get next stimulus dictionary
    console.log(current_stim); // print info

    flick.trialStart(
        current_stim.direction === 'left',
        run_trial,
        callOnCrossing
    );
};

const run_trial = () => {
    trialnum++;
    trialInfo = {};
    trialInfo.start_noRAF = flick.roundTo2(performance.now());
    requestAnimationFrame(stamp => {
        stimulusElem.textContent = current_stim.item;
        trialInfo.start = flick.roundTo2(stamp); // the crucial (start) JS-timing
        if (current_stim.ssd && current_stim.ssd > 0) {
            setTimeout(() => {
                requestAnimationFrame(stamp2 => {
                    document.getElementById("stop-signal").style.display = "block";
                    trialInfo.stopSignal = stamp2;
                });

            }, current_stim.ssd - 8);
        }
        if (phase !== "practice") {
            setTimeout(() => {
                store_trial();
            }, time_limit);
        }
    });
};


const callOnCrossing = (crossInfo) => {
    trialInfo.cross_time = crossInfo.time;
    if (phase === "practice") {
        store_trial();
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
    "item",
    "direction",
    "ssd",
    "trialInfo.cross_time",
    "start",
    "start_noRAF",
    "stopSignal",
    "time_now"
].join('\t') + '\n';

function store_trial() {
    flick.fullData.push(...flick.trialData);
    stimulusElem.textContent = '';
    document.getElementById("stop-signal").style.display = "none";
    full_data += [
        misc.date_time,
        phase,
        trialnum,
        current_stim.item,
        current_stim.direction,
        current_stim.ssd,
        trialInfo.cross_time,
        trialInfo.start,
        trialInfo.start_noRAF,
        trialInfo.stopSignal,
        flick.roundTo2(performance.now())
    ].join('\t') + '\n';
    if (allstims.length > 0) {
        next_trial();
    } else if (phase === "practice") {
        setTimeout(function() {
            phase = "main";
            document.getElementById('task_id').style.display = 'none';
            document.getElementById('instructions2_' + misc.task).style.display = 'block';
        }, 500);
    } else {
        ending();
    }
}

// change rectangle color to blue to indicate experiment ending
function ending() {
    setTimeout(() => {
        document.getElementById('task_id').style.display = 'none';
        document.getElementById('end_id').style.display = 'block';
    }, 1000);
    orientationWarning(false);
    flick.fullData = flick.roundData(flick.fullData);
    f_name = 'flick_pilot_' + misc.task + '_' + jscd.os + '_' +
        jscd.browser + '_' + misc.date_time + '_' + misc.userid + '.txt';
    document.getElementById("subj_id").innerText = misc.date_time + '_' + misc.userid;

    misc.full_duration = parseFloat(((performance.now() - misc.consented) / 1000 / 60).toFixed(1));

    full_data += JSON.stringify(misc) + "\n" + JSON.stringify(flick.fullData);
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
    misc.userid = params.get('PROLIFIC_PID');
    if (misc.userid != null) {
        document.getElementById('pay_info').textContent = "Completed and valid participation will be rewarded with 0.40 GBP via Prolific.";
        if (misc.userid.startsWith("GL")) {
            go();
        }
    } else {
        misc.userid = "noid";
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
