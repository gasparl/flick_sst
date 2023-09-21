// @ts-nocheck
/*jshint esversion: 6 */

let startButton, stimulusElem;

document.addEventListener("DOMContentLoaded", () => {

    startButton = document.getElementById('flick-button');
    stimulusElem = document.getElementById('flick-stimulus');

    // TODO
    // if (!('ontouchmove' in window.document)) {
    //     cancel();
    //     return;
    // }

});

const flick = {
    frameMiddle: undefined,
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

    warnTouch: () => {
        clearTimeout(flick.goTO);
        startButton.innerHTML = '❗';
        stimulusElem.innerHTML = 'Please touch the button to start the next trial.';
        startButton.classList.add('flick-button-highlight');
    },

    highlightRemove: () => {
        startButton.innerHTML = '';
        stimulusElem.innerHTML = '';
        startButton.classList.remove('flick-button-highlight');
    },

    isPointInCircle: (point, rect) => {
        const dx = point.clientX - (rect.left + rect.width / 2);
        const dy = point.clientY - (rect.top + rect.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= rect.width / 2;
    },

    onCrossing: () => { },

    trialStart: (isLeft, allowedSides = { top: true, bottom: true, left: true, right: true }, callOnStart, callOnCrossing) => {
        flick.onCrossing = callOnCrossing;
        flick.trialData = [];
        flick.getFramePos();
        flick.warningTO = setTimeout(() => {
            if (startButton.classList.contains("flick-button-highlight")) {
                flick.warnTouch();
            }
        }, 3000);
        startButton.classList.add('flick-button-highlight');
        startButton.ontouchmove = null;
        startButton.ontouchend = null;
        flick.ongoing = false;
        startButton.ontouchstart = function(ev) {
            // Remember starting point
            ev.preventDefault();
            console.log('Touch started.');
            const startTouch = ev.touches[0];
            const buttonRect = startButton.getBoundingClientRect();
            let touchStartedInside = flick.isPointInCircle(startTouch, buttonRect);

            // If touch started inside the button
            if (touchStartedInside) {
                console.log('Touch started inside the button.');
                flick.highlightRemove();
                clearTimeout(flick.warningTO);
                if (flick.startSign !== null) {
                    flick.goTO = setTimeout(() => {
                        flick.startTime = performance.now();
                        stimulusElem.textContent = flick.startSign;
                        flick.ongoing = true;
                        // recatch position, just to be sure (e.g., if fullscreen was entered)
                        flick.getFramePos();
                    }, 50);
                }

                // Detect if the touch moves out of the circle or ends
                startButton.ontouchmove = function(event) {
                    event.preventDefault();

                    const { clientX, clientY } = event.touches[0];
                    const { top, bottom, left, right } = startButton.getBoundingClientRect();

                    const isOngoing = flick.ongoing;

                    const isOutsideTop = clientY < top;
                    const isOutsideBottom = clientY > bottom;
                    const isOutsideLeft = clientX < left;
                    const isOutsideRight = clientX > right;

                    if (isOngoing) {
                        const isCrossTop = allowedSides.top && isOutsideTop;
                        const isCrossBottom = allowedSides.bottom && isOutsideBottom;
                        const isCrossLeft = allowedSides.left && isOutsideLeft;
                        const isCrossRight = allowedSides.right && isOutsideRight;

                        if (isCrossTop || isCrossBottom || isCrossLeft || isCrossRight) {
                            callOnStart();
                            flick.getCoords(event, 8, isLeft);
                            startButton.ontouchstart = e => flick.getCoords(e, 0, isLeft);
                            startButton.ontouchmove = e => flick.getCoords(e, 1, isLeft);
                            startButton.ontouchend = e => flick.getCoords(e, 2, isLeft);
                            // console.log('Touch moved and left the button.');
                            return;
                        }
                    }

                    if (isOutsideTop || isOutsideBottom || isOutsideLeft || isOutsideRight) {
                        console.log('Touch moved in the wrong direction.');
                        flick.warnTouch();
                        flick.wrongMove++;
                        flick.trialStart(isLeft, allowedSides, callOnStart, callOnCrossing);
                    }
                };

                // Detect if the touch ends
                startButton.ontouchend = function(event) {
                    event.preventDefault();
                    console.log('Touch ended.');
                    flick.warnTouch();
                    flick.wrongEnd++;
                    flick.trialStart(isLeft, allowedSides, callOnStart, callOnCrossing);
                };
            }
        };
    },

    getFramePos: () => {
        flick.leftLine = document.getElementById('flick-left-id').getBoundingClientRect().right;
        flick.rightLine = document.getElementById('flick-right-id').getBoundingClientRect().left;
        startButtonRectTop = document.getElementById('flick-button').getBoundingClientRect().top;

        const frameRect = document.getElementById("flick-frame").getBoundingClientRect();
        flick.frameMiddle = frameRect.left + (frameRect.width / 2);
    },

    getCoords: (event, type, isLeft) => {
        event.preventDefault();

        const currentTouch = event.changedTouches[0];

        // store relative coordinates
        if ((performance.now() - flick.startTime) < (flick.maxTrialDuration + 100)) {
            // Calculate X coordinate relative to the vertical middle of the "flick-frame" element
            const relativeX = currentTouch.clientX - flick.frameMiddle;

            // Calculate Y coordinate relative to the horizontal top of the "flick-button" element
            const relativeY = startButtonRectTop - currentTouch.clientY;

            flick.trialData.push([event.timeStamp, relativeX, relativeY, type]);
        }

        // Detect if touch crosses the lines
        if ((currentTouch.clientX <= flick.leftLine && isLeft) || (currentTouch.clientX >= flick.rightLine && (!isLeft)

            // for top corner designs
            && (['0', '1'].includes(misc.design) || relativeY >= 50)

        )) {
            startButton.ontouchmove = null;
            startButton.ontouchstart = null;
            startButton.ontouchend = null;
            stimulusElem.textContent = '';

            const lastTouchData = flick.trialData[flick.trialData.length - 2];
            const currentTouchData = flick.trialData[flick.trialData.length - 1];

            if (lastTouchData && currentTouchData) {
                const targetX = isLeft ? (flick.leftLine - flick.frameMiddle) : (flick.rightLine - flick.frameMiddle);
                crossingData = flick.calculateCrossingDetails(lastTouchData, currentTouchData, targetX);
                // Insert the interpolated crossing data right before the last element
                const interpolatedData = [crossingData.time, crossingData.x, crossingData.y, 9]; // type 9 for crossing data
                flick.trialData.splice(flick.trialData.length - 1, 0, interpolatedData);
            } else {
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