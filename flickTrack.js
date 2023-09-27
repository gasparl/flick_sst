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
    trialData: undefined,
    fullData: { single: [], left: [], right: [] },
    maxTrialDuration: 5000,
    startTime: undefined,
    touchId: {},
    sideId: {},
    isSingle: false,

    clearListeners: () => {
        const elements = [document, flick.singleButton, flick.leftButton, flick.rightButton];
        const events = ['ontouchmove', 'ontouchend', 'ontouchstart', 'ontouchcancel'];
        elements.forEach(element => {
            events.forEach(event => {
                element[event] = null;
            });
        });
    },

    warnTouch: () => {
        clearTimeout(flick.goTO);
        Object.keys(flick.trialData).forEach(key => {
            if (!flick.touchId[key]) {
                flick[key + 'Button'].classList.add('flick-button-highlight');
                flick[key + 'Button'].innerHTML = '❗';
            }
        });
        document.getElementById('flick-warning').style.display = 'block';
        flick.stimulusElem.innerHTML = '';
    },

    highlightRemove1: () => {
        flick.singleButton.innerHTML = '';
        flick.stimulusElem.innerHTML = '+';
        document.getElementById('flick-warning').style.display = 'none';
        flick.singleButton.classList.remove('flick-button-highlight');
        flick.ready = true;
    },

    highlightRemove2: (btn) => {
        btn.textContent = '';
        document.getElementById('flick-warning').style.display = 'none';
        btn.classList.remove('flick-button-highlight');
        if (!flick.leftButton.classList.contains("flick-button-highlight") &&
            !flick.rightButton.classList.contains("flick-button-highlight")) {
            flick.ready = true;
            flick.stimulusElem.innerHTML = '+';
        }
    },

    isPointInCircle: (point, rect) => {
        const dx = point.clientX - (rect.left + rect.width / 2);
        const dy = point.clientY - (rect.top + rect.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= rect.width / 2;
    },

    onCrossing: () => { },

    trialStart: (isLeft, callOnStart, callOnCrossing) => {
        flick.clearListeners();
        flick.onCrossing = callOnCrossing;
        flick.ready = false;
        flick.trialData = flick.isSingle ? { single: [] } : { left: [], right: [] };
        flick.getFramePos();
        flick.warningTO = setTimeout(() => {
            if (!flick.ready) {
                flick.warnTouch();
            }
        }, 3000);
        flick.stimulusElem.textContent = '+';

        const btnList = flick.isSingle ? [{ side: 'single', btn: flick.singleButton }] :
            [{ side: 'left', btn: flick.leftButton }, { side: 'right', btn: flick.rightButton }];
        btnList.forEach(respButtonObj => {
            const respButton = respButtonObj.btn;
            const respSide = respButtonObj.side;
            if (!flick.touchId[respSide]) {
                respButton.classList.add('flick-button-highlight');
            }
            respButton.ontouchmove = null;
            respButton.ontouchend = null;

            respButton.ontouchstart = function(ev) {
                if (ev.cancelable) {
                    ev.preventDefault();
                }
                console.log('Touch started.');
                const startTouch = ev.targetTouches[0];
                const buttonRect = respButton.getBoundingClientRect();
                const touchStartedInside = flick.isPointInCircle(startTouch, buttonRect);
                // If touch started inside the button
                if (touchStartedInside) {
                    // console.log('Touch started inside the button.');
                    if (flick.isSingle) {
                        flick.highlightRemove1();
                    } else {
                        flick.highlightRemove2(respButton);
                    }
                    flick.touchId[respSide] = ev.changedTouches[0].identifier;
                    Object.keys(flick.sideId).forEach(key => {
                        if (flick.sideId[key] === respSide) {
                            delete flick.sideId[key];
                        }
                    });
                    flick.sideId[ev.changedTouches[0].identifier] = respSide;
                    flick.getCoords(ev, 7, isLeft, respSide);
                    if (flick.ready) {
                        clearTimeout(flick.warningTO);
                        flick.goTO = setTimeout(() => {
                            flick.startTime = performance.now();
                            flick.clearListeners();
                            flick.getFramePos();
                            document.ontouchmove = e => flick.getCoords(e, 1, isLeft);
                            document.ontouchend = e => flick.getCoords(e, 8, isLeft);
                            document.ontouchcancel = e => flick.getCoords(e, 9, isLeft);
                            callOnStart();
                        }, 500);
                    }

                    document.ontouchmove = flick.startMove;
                    document.ontouchend = flick.startEnd;
                    document.ontouchcancel = flick.startEnd;

                }
            };
        });
    },

    startMove: (event) => {
        if (event.cancelable) {
            event.preventDefault();
        }
        for (const currentTouch of event.changedTouches) {
            // Check if the touch matches either left or right identifier
            const side = flick.sideId[currentTouch.identifier] || null;
            if (side) {
                const touchStayedIn = flick.isPointInCircle(currentTouch, flick[side + 'Button'].getBoundingClientRect());
                if (!touchStayedIn) {
                    console.log(`Touch moved out of ${side} button.`);
                    flick.touchId[side] = null;
                    flick.warnTouch();
                } else {
                    const relativeX = currentTouch.clientX - flick.xCenter;
                    const relativeY = flick.yCenter - currentTouch.clientY;
                    flick.trialData[side].push([event.timeStamp, relativeX, relativeY, 0]);
                }
            }
        }
    },

    startEnd: (event) => {
        if (event.cancelable) {
            event.preventDefault();
        }
        for (const currentTouch of event.changedTouches) {
            const side = flick.sideId[currentTouch.identifier] || null;
            if (side) {
                console.log(`Touch of ${side} button ended.`);
                flick.touchId[side] = null;
                flick.warnTouch();
            }
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