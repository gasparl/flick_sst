/*jshint esversion: 6 */

const DT = {
    // loop decides whether the RAF loop should continue, see below
    loop: false,
    // loopFunction actually defined below, because of self-reference
    loopFunction: function loopFunction() {
        if (DT.loop) {
            requestAnimationFrame(DT.loopFunction);
        }
    },
    // sets the RAF loop on by setting loop true and initiating the loop function
    // (optionally prints warning info to console)
    loopOn: function(warn = true) {
        if (warn) {
            console.warn('loopOn()');
        }
        this.loop = true;
        this.loopFunction();
    },
    // sets the RAF loop off by setting loop false
    // (optionally prints warning info to console)
    loopOff: function(warn = true) {
        if (warn) {
            console.warn('loopOff()');
        }
        this.loop = false;
    }
};
