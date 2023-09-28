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
    phase: '',
    ready: false,
    stimulusElem: undefined,
    singleButton: undefined,
    leftButton: undefined,
    rightButton: undefined,
    xCenter: undefined,
    yCenter: undefined,
    leftLine: undefined,
    rightLine: undefined,
    warningTO: undefined,
    goTO: undefined,
    trialData: {},
    fullData: { single: [], left: [], right: [] },
    maxTrialDuration: 5000,
    startTime: undefined,
    touchId: {},
    sideId: {},
    isSingle: false,
    isLeft: undefined,

    clearListeners: () => {
        ['ontouchmove', 'ontouchend', 'ontouchstart', 'ontouchcancel'].forEach(event => {
            document[event] = null;
        });
    },

    warnTouch: (btn) => {
        clearTimeout(flick.goTO);
        btn.classList.add('flick-button-highlight');
        document.getElementById('flick-warning').style.display = 'block';
        flick.stimulusElem.textContent = '';
    },

    highlightRemove: (btn) => {
        clearTimeout(flick.warningTO);
        if (flick.isSingle) {
            flick.singleButton.textContent = '';
            flick.stimulusElem.textContent = '+';
            document.getElementById('flick-warning').style.display = 'none';
            flick.singleButton.classList.remove('flick-button-highlight');
            flick.ready = true;
        }
        else {
            btn.textContent = '';
            document.getElementById('flick-warning').style.display = 'none';
            btn.classList.remove('flick-button-highlight');
            if (!flick.leftButton.classList.contains("flick-button-highlight") &&
                !flick.rightButton.classList.contains("flick-button-highlight")) {
                flick.ready = true;
                flick.stimulusElem.textContent = '+';
            }
        }
    },

    isPointInCircle: (point, rect) => {
        const dx = point.clientX - (rect.left + rect.width / 2);
        const dy = point.clientY - (rect.top + rect.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= rect.width / 2;
    },

    onStart: () => { },
    onCrossing: () => { },

    touchHandle: (event) => {
        if (event.cancelable) {
            event.preventDefault();
        }
        for (const currentTouch of event.changedTouches) {

            // check if identifier is assigned to a side
            const side = flick.sideId[currentTouch.identifier] || null;

            // if yes, store the change
            if (side) {
                if (flick.phase === 'ongoing') {
                    const relativeX = currentTouch.clientX - flick.xCenter;
                    const relativeY = flick.yCenter - currentTouch.clientY;
                    // event type: 0 for start, 1 for move, 2 for end, 3 for cancel
                    const touchType = event.type === 'touchmove' ? 1 : (event.type === 'touchstart' ? 0 : (event.type === 'touchend' ? 2 : 3));
                    flick.trialData[side].push([event.timeStamp, relativeX, relativeY, touchType]);
                }
                if (touchType === 2 || touchType === 3) {
                    flick.touchId[side] = null;
                    flick.sideId[currentTouch.identifier] = null;
                    if (flick.phase === 'start') {
                        flick.warnTouch();
                    }
                } else if (flick.phase === 'start') {
                    // check if the touch is in the corresponding button
                    const respButton = flick[side + 'Button'];
                    const isInButton = flick.isPointInCircle(currentTouch, respButton.getBoundingClientRect());
                    // if not, highlight the button
                    if (!isInButton) {
                        flick.warnTouch(respButton);
                    } else {
                        flick.highlightRemove(respButton);
                    }
                }
            } else {
                // if not, check if the touch is in a button
                Object.keys(trialData).forEach(respSide => {
                    const respButton = flick[respSide + 'Button'];
                    if (event.type === 'touchstart' || event.type === 'touchmove') {
                        const isInButton = flick.isPointInCircle(currentTouch, respButton.getBoundingClientRect());
                        if (isInButton) {
                            flick.touchId[respSide] = currentTouch.identifier;
                            Object.keys(flick.sideId).forEach(key => {
                                if (flick.sideId[key] === respSide) {
                                    delete flick.sideId[key];
                                }
                            });
                            flick.sideId[currentTouch.identifier] = respSide;
                            if (flick.phase === 'ongoing') {
                                const relativeX = currentTouch.clientX - flick.xCenter;
                                const relativeY = flick.yCenter - currentTouch.clientY;
                                const touchType = event.type === 'touchstart' ? 0 : 1;
                                flick.trialData[side].push([event.timeStamp, relativeX, relativeY, touchType]);
                            }
                        }
                    }
                });
            }
        }
    },

    sessionStart: (callOnStart, callOnCrossing) => {
        flick.onStart = callOnStart;
        flick.onCrossing = callOnCrossing;
        document.ontouchstart = flick.touchHandle;
        document.ontouchmove = flick.touchHandle;
        document.ontouchend = flick.touchHandle;
        document.ontouchcancel = flick.touchHandle;
        Object.keys(trialData).forEach(respSide => {
            flick[respSide + 'Button'].classList.add('flick-button-highlight');
        });
    },

    trialStart: (isLeft, callOnStart = null, callOnCrossing = null) => {
        flick.isLeft = isLeft;
        flick.clearListeners();
        if (typeof callOnStart === 'function') {
            flick.onStart = callOnStart;
        }
        if (typeof callOnCrossing === 'function') {
            flick.onCrossing = callOnCrossing;
        }
        flick.trialData = flick.isSingle ? { single: [] } : { left: [], right: [] };
        flick.getFramePos();
        flick.warningTO = setTimeout(() => {
            if (flick.phase === 'start' && !flick.ready) {
                flick.warnTouch();
            }
        }, 5000);
        flick.stimulusElem.textContent = '+';
        setGoTO();
    },

    setGoTO: () => {
        if (flick.ready) {
            clearTimeout(flick.warningTO);
            flick.goTO = setTimeout(() => {
                flick.startTime = performance.now();
                flick.phase = 'ongoing';
                flick.clearListeners();
                flick.getFramePos();
                flick.onStart();
            }, 400);
        }
    },

    getFramePos: () => {
        flick.leftLine = document.getElementById('flick-left-line').getBoundingClientRect().right;
        flick.rightLine = document.getElementById('flick-right-line').getBoundingClientRect().left;

        const frameRect = document.getElementById("flick-frame").getBoundingClientRect();
        flick.xCenter = frameRect.left + (frameRect.width / 2);
        flick.yCenter = (frameRect.top + frameRect.bottom) / 2;
    },

    getCoords: (event, type, isLeft) => {
        if (event.cancelable) {
            event.preventDefault();
        }
        for (const currentTouch of event.changedTouches) {
            const side = flick.sideId[currentTouch.identifier] || null;

            // store relative coordinates
            if (side && (performance.now() - flick.startTime) < (flick.maxTrialDuration + 100)) {
                // Calculate X coordinate relative to the vertical middle of the "flick-frame" element
                const relativeX = currentTouch.clientX - flick.xCenter;
                // Calculate Y coordinate relative to the horizontal top of the "flick-button" element
                const relativeY = flick.yCenter - currentTouch.clientY;
                flick.trialData[side].push([event.timeStamp, relativeX, relativeY, type]);
            }

            // Detect if touch crosses the lines
            if ((currentTouch.clientX <= flick.leftLine && isLeft) ||
                (currentTouch.clientX >= flick.rightLine && (!isLeft))) {
                flick.clearListeners();
                flick.stimulusElem.textContent = '';
                let crossingData = {};
                if (side) {
                    const lastTouchData = flick.trialData[side][flick.trialData[side].length - 2];
                    const currentTouchData = flick.trialData[side][flick.trialData[side].length - 1];

                    if (lastTouchData && currentTouchData) {
                        const targetX = isLeft ? (flick.leftLine - flick.xCenter) : (flick.rightLine - flick.xCenter);
                        crossingData = flick.calculateCrossingDetails(lastTouchData, currentTouchData, targetX);
                        // Insert the interpolated crossing data right before the last element
                        const interpolatedData = [crossingData.time, crossingData.x, crossingData.y, 9]; // type 9 for crossing data
                        flick.trialData[side].splice(flick.trialData[side].length - 1, 0, interpolatedData);
                    } else if (currentTouchData) {
                        crossingData = { time: currentTouchData[0], x: currentTouchData[1], y: currentTouchData[2] };
                    }
                }
                flick.onCrossing(crossingData);
            }

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

    roundData: function(dataObj) {
        // Loop over each key in the data object
        Object.keys(dataObj).forEach(key => {
            // Map over each array and round each element
            dataObj[key] = dataObj[key].map(elem => {
                return [
                    flick.roundTo2(elem[0]),
                    flick.roundTo2(elem[1]),
                    flick.roundTo2(elem[2])
                ];
            });
        });
        return dataObj;
    }

};

Object.seal(flick);