// @ts-nocheck
/*jshint esversion: 6 */


document.addEventListener("DOMContentLoaded", () => {

    flick.singleButton = document.getElementById('flick-button-single');
    flick.leftButton = document.getElementById('flick-button-left');
    flick.rightButton = document.getElementById('flick-button-right');
    flick.stimulusElem = document.getElementById('flick-stimulus');

    // TODO
    // if (!('ontouchmove' in window.document)) {
    //     cancel();
    //     return;
    // }

});

const flick = {
    stimulusElem: undefined,
    singleButton: undefined,
    leftButton: undefined,
    rightButton: undefined,
    xCenter: undefined,
    leftLine: undefined,
    rightLine: undefined,
    warningTO: undefined,
    goTO: undefined,
    trialData: undefined,
    fullData: [],
    wrongMove: 0,
    wrongEnd: 0,
    startSign: null,
    ongoing: false,
    maxTrialDuration: Infinity,
    startTime: undefined,
    touches: {},

    warnTouch: () => {
        clearTimeout(flick.goTO);
        flick.singleButton.innerHTML = '❗';
        flick.stimulusElem.innerHTML = 'Please touch the button to start the trial.';
        flick.singleButton.classList.add('flick-button-highlight');
    },

    highlightRemove: () => {
        flick.singleButton.innerHTML = '';
        flick.stimulusElem.innerHTML = '';
        flick.singleButton.classList.remove('flick-button-highlight');
    },

    warnTouch2: () => {
        clearTimeout(flick.goTO);
        flick.stimulusElem.innerHTML = 'Please touch both buttons to start the trial.';
        [flick.leftButton, flick.rightButton].forEach(button => {
            button.innerHTML = '❗';
            button.classList.add('flick-button-highlight');
        });
    },

    highlightRemove2: (btn) => {
        btn.textContent = '';
        btn.classList.remove('flick-button-highlight');
        if (!flick.leftButton.classList.contains("flick-button-highlight") &&
            !flick.rightButton.classList.contains("flick-button-highlight")) {
            flick.stimulusElem.innerHTML = '';
        }
    },

    isPointInCircle: (point, rect) => {
        const dx = point.clientX - (rect.left + rect.width / 2);
        const dy = point.clientY - (rect.top + rect.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= rect.width / 2;
    },

    onCrossing: () => { },

    trialStart: (callOnStart, callOnCrossing) => {
        flick.onCrossing = callOnCrossing;
        flick.trialData = { left: [], right: [] };
        flick.getFramePos();
        flick.warningTO = setTimeout(() => {
            if (flick.leftButton.classList.contains("flick-button-highlight") ||
                flick.rightButton.classList.contains("flick-button-highlight")) {
                flick.warnTouch2();
            }
        }, 3000);
        flick.stimulusElem.textContent = '+';

        const btnList = misc.design === '1'
            ? [{ side: 'left', btn: flick.leftButton }, { side: 'right', btn: flick.rightButton }]
            : [{ side: 'left', btn: flick.leftButton }];
        btnList.forEach(respButtonObj => {
            const respButton = respButtonObj.btn;
            const respSide = respButtonObj.side;
            respButton.classList.add('flick-button-highlight');
            respButton.ontouchmove = null;
            respButton.ontouchend = null;

            respButton.ontouchstart = function(ev) {
                // Remember starting point
                ev.preventDefault();
                console.log('Touch started.');
                const startTouch = ev.touches[0];
                const buttonRect = respButton.getBoundingClientRect();
                const touchStartedInside = flick.isPointInCircle(startTouch, buttonRect);
                // If touch started inside the button
                if (touchStartedInside) {
                    // console.log('Touch started inside the button.');
                    flick.highlightRemove2(respButton);
                    touchId[respSide] = e.changedTouches[0].identifier;
                    flick.getCoords(e, 7, isLeft, respSide);
                    if (!flick.leftButton.classList.contains("flick-button-highlight") &&
                        !flick.rightButton.classList.contains("flick-button-highlight")) {
                        clearTimeout(flick.warningTO);
                        flick.goTO = setTimeout(() => {
                            flick.startTime = performance.now();
                            document.ontouchmove = null;
                            flick.getFramePos();
                            flick.getCoords(ev, 8, isLeft);
                            respButton.ontouchstart = null;
                            respButton.ontouchmove = null;
                            respButton.ontouchend = null;
                            document.ontouchmove = e => flick.getCoords(e, 1, isLeft);
                            callOnStart();
                        }, 100);
                    }

                    document.ontouchmove = function(event) {
                        startMove(event);
                    };
                }
            };
        });
    },

    startMove: (event) => {
        event.preventDefault();

        for (const touch of event.touches) {
            // Check if the touch matches either left or right identifier
            const side = (touch.identifier === touchId.left) ? 'left' :
                (touch.identifier === touchId.right) ? 'right' : null;

            if (side) {
                const touchStayedIn = flick.isPointInCircle(touch, flick[side + 'Button'].getBoundingClientRect());
                if (!touchStayedIn) {
                    console.log(`Touch moved out of ${side} button.`);
                    flick.warnTouch2();
                    touchId[side] = null;
                }
            }
        }

        if (!touchId.left && !touchId.right) {
            document.ontouchmove = null;
        }
    },

    getFramePos: () => {
        flick.leftLine = document.getElementById('flick-left-id').getBoundingClientRect().right;
        flick.rightLine = document.getElementById('flick-right-id').getBoundingClientRect().left;

        document.getElementById('flick-frame').getBoundingClientRect().top;
        const frameRect = document.getElementById("flick-frame").getBoundingClientRect();
        flick.xCenter = frameRect.left + (frameRect.width / 2);
        flick.yCenter = (frameRect.top + frameRect.bottom) / 2;
    },

    getCoords: (event, type, isLeft, side = null) => {
        event.preventDefault();

        const currentTouch = event.changedTouches[0];

        // store relative coordinates
        if ((performance.now() - flick.startTime) < (flick.maxTrialDuration + 100)) {
            // Calculate X coordinate relative to the vertical middle of the "flick-frame" element
            const relativeX = currentTouch.clientX - flick.xCenter;

            // Calculate Y coordinate relative to the horizontal top of the "flick-button" element
            const relativeY = flick.yCenter - currentTouch.clientY;
            if (side !== null) {
                flick.trialData[side].push([event.timeStamp, relativeX, relativeY, type]);
            } else {
                flick.trialData.push([event.timeStamp, relativeX, relativeY, type]);
            }
        }

        // Detect if touch crosses the lines
        if ((currentTouch.clientX <= flick.leftLine && isLeft) || (currentTouch.clientX >= flick.rightLine && (!isLeft) &&
            flick.stimulusElem.textContent !== ''
        )) {
            flick.singleButton.ontouchmove = null;
            flick.singleButton.ontouchstart = null;
            flick.singleButton.ontouchend = null;
            flick.stimulusElem.textContent = '';

            const lastTouchData = flick.trialData[flick.trialData.length - 2];
            const currentTouchData = flick.trialData[flick.trialData.length - 1];

            if (lastTouchData && currentTouchData) {
                const targetX = isLeft ? (flick.leftLine - flick.xCenter) : (flick.rightLine - flick.xCenter);
                crossingData = flick.calculateCrossingDetails(lastTouchData, currentTouchData, targetX);
                // Insert the interpolated crossing data right before the last element
                const interpolatedData = [crossingData.time, crossingData.x, crossingData.y, 9]; // type 9 for crossing data
                flick.trialData.splice(flick.trialData.length - 1, 0, interpolatedData);
            } else if (currentTouchData) {
                crossingData = { time: currentTouchData[0], x: currentTouchData[1], y: currentTouchData[2] };
            }
            flick.onCrossing(crossingData);
        }
    },

    calculateCrossingDetails: function(lastTouchData, currentTouchData, targetX) {
        const [lastTouchTime, lastTouchX, lastTouchY] = lastTouchData;
        const [currentTouchTime, currentTouchX, currentTouchY] = currentTouchData;

        const proportion = (targetX - lastTouchX) / (currentTouchX - lastTouchX);

        const interpolatedTime = lastTouchTime + proportion * (currentTouchTime - lastTouchTime);
        const interpolatedX = targetX;
        const interpolatedY = lastTouchY + proportion * (currentTouchY - lastTouchY);
        return { time: interpolatedTime, x: interpolatedX, y: interpolatedY };
    },

    roundTo2: function(number) {
        return Math.round(number * 100) / 100;
    },

    roundData: function(data) {
        return (data.map(elem => {
            elem[0] = flick.roundTo2(elem[0]);
            elem[1] = flick.roundTo2(elem[1]);
            elem[2] = flick.roundTo2(elem[2]);
            return (elem);
        }));
    }
};

Object.seal(flick);