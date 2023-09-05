// @ts-nocheck
/*jshint esversion: 6 */

/**
 * JavaScript Client Detection
 * (C) viazenetti GmbH (Christian Ludwig)
 */

(function (window) {
    {
        var unknown = '-';

        // screen
        var screenSize = '';
        if (screen.width) {
            width = (screen.width) ? screen.width : '';
            height = (screen.height) ? screen.height : '';
            screenSize += '' + width + " x " + height;
        }

        // browser
        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;
        var browser = navigator.appName;
        var version = '' + parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;

        // Opera
        if ((verOffset = nAgt.indexOf('Opera')) != -1) {
            browser = 'Opera';
            version = nAgt.substring(verOffset + 6);
            if ((verOffset = nAgt.indexOf('Version')) != -1) {
                version = nAgt.substring(verOffset + 8);
            }
        }
        // Opera Next
        if ((verOffset = nAgt.indexOf('OPR')) != -1) {
            browser = 'Opera';
            version = nAgt.substring(verOffset + 4);
        }
        // Legacy Edge
        else if ((verOffset = nAgt.indexOf('Edge')) != -1) {
            browser = 'Microsoft Legacy Edge';
            version = nAgt.substring(verOffset + 5);
        }
        // Edge (Chromium)
        else if ((verOffset = nAgt.indexOf('Edg')) != -1) {
            browser = 'Microsoft Edge';
            version = nAgt.substring(verOffset + 4);
        }
        // MSIE
        else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
            browser = 'Microsoft Internet Explorer';
            version = nAgt.substring(verOffset + 5);
        }
        // Chrome
        else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
            browser = 'Chrome';
            version = nAgt.substring(verOffset + 7);
        }
        // Safari
        else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
            browser = 'Safari';
            version = nAgt.substring(verOffset + 7);
            if ((verOffset = nAgt.indexOf('Version')) != -1) {
                version = nAgt.substring(verOffset + 8);
            }
        }
        // Firefox
        else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
            browser = 'Firefox';
            version = nAgt.substring(verOffset + 8);
        }
        // MSIE 11+
        else if (nAgt.indexOf('Trident/') != -1) {
            browser = 'Microsoft Internet Explorer';
            version = nAgt.substring(nAgt.indexOf('rv:') + 3);
        }
        // Other browsers
        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
            browser = nAgt.substring(nameOffset, verOffset);
            version = nAgt.substring(verOffset + 1);
            if (browser.toLowerCase() == browser.toUpperCase()) {
                browser = navigator.appName;
            }
        }
        // trim the version string
        if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
        if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
        if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);

        majorVersion = parseInt('' + version, 10);
        if (isNaN(majorVersion)) {
            version = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }

        // mobile version
        var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

        // system
        var os = unknown;
        var clientStrings = [
            {s:'Windows 10', r:/(Windows 10.0|Windows NT 10.0)/},
            {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
            {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
            {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
            {s:'Windows Vista', r:/Windows NT 6.0/},
            {s:'Windows Server 2003', r:/Windows NT 5.2/},
            {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
            {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
            {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
            {s:'Windows 98', r:/(Windows 98|Win98)/},
            {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
            {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
            {s:'Windows CE', r:/Windows CE/},
            {s:'Windows 3.11', r:/Win16/},
            {s:'Android', r:/Android/},
            {s:'Open BSD', r:/OpenBSD/},
            {s:'Sun OS', r:/SunOS/},
            {s:'Chrome OS', r:/CrOS/},
            {s:'Linux', r:/(Linux|X11(?!.*CrOS))/},
            {s:'iOS', r:/(iPhone|iPad|iPod)/},
            {s:'Mac OS X', r:/Mac OS X/},
            {s:'Mac OS', r:/(Mac OS|MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
            {s:'QNX', r:/QNX/},
            {s:'UNIX', r:/UNIX/},
            {s:'BeOS', r:/BeOS/},
            {s:'OS/2', r:/OS\/2/},
            {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
        ];
        for (var id in clientStrings) {
            var cs = clientStrings[id];
            if (cs.r.test(nAgt)) {
                os = cs.s;
                break;
            }
        }

        var osVersion = unknown;

        if (/Windows/.test(os)) {
            osVersion = /Windows (.*)/.exec(os)[1];
            os = 'Windows';
        }

        switch (os) {
            case 'Mac OS':
            case 'Mac OS X':
            case 'Android':
                osVersion = /(?:Android|Mac OS|Mac OS X|MacPPC|MacIntel|Mac_PowerPC|Macintosh) ([\.\_\d]+)/.exec(nAgt)[1];
                break;

            case 'iOS':
                osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                break;
        }

    }

    window.jscd = {
        screen: screenSize,
        browser: browser,
        browserVersion: version,
        browserMajorVersion: majorVersion,
        mobile: mobile,
        os: os,
        osVersion: osVersion
    };
}(this));



// from https://github.com/joyqi/mobile-device-js

(function () {
    var canvas, gl, glRenderer, models,
        devices = [
            ['a7', '640x1136', ['iPhone 5', 'iPhone 5s']],
            ['a7', '1536x2048', ['iPad Air', 'iPad Mini 2', 'iPad Mini 3']],
            ['a8', '640x1136', ['iPod touch (6th gen)']],
            ['a8', '750x1334', ['iPhone 6']],
            ['a8', '1242x2208', ['iPhone 6 Plus']],
            ['a8', '1536x2048', ['iPad Air 2', 'iPad Mini 4']],
            ['a9', '640x1136', ['iPhone SE']],
            ['a9', '750x1334', ['iPhone 6s']],
            ['a9', '1242x2208', ['iPhone 6s Plus']],
            ['a9x', '1536x2048', ['iPad Pro (1st gen 9.7-inch)']],
            ['a9x', '2048x2732', ['iPad Pro (1st gen 12.9-inch)']],
            ['a10', '750x1334', ['iPhone 7']],
            ['a10', '1242x2208', ['iPhone 7 Plus']],
            ['a10x', '1668x2224', ['iPad Pro (2th gen 10.5-inch)']],
            ['a10x', '2048x2732', ['iPad Pro (2th gen 12.9-inch)']],
            ['a11', '750x1334', ['iPhone 8']],
            ['a11', '1242x2208', ['iPhone 8 Plus']],
            ['a11', '1125x2436', ['iPhone X']],
            ['a12', '828x1792', ['iPhone Xr']],
            ['a12', '1125x2436', ['iPhone Xs']],
            ['a12', '1242x2688', ['iPhone Xs Max']],
            ['a12x', '1668x2388', ['iPad Pro (3rd gen 11-inch)']],
            ['a12x', '2048x2732', ['iPad Pro (3rd gen 12.9-inch)']]
        ];

    function getCanvas() {
        if (canvas == null) {
            canvas = document.createElement('canvas');
        }

        return canvas;
    }

    function getGl() {
        if (gl == null) {
            gl = getCanvas().getContext('experimental-webgl');
        }

        return gl;
    }

    function getResolution() {
        var ratio = window.devicePixelRatio || 1;
        return (Math.min(screen.width, screen.height) * ratio)
            + 'x' + (Math.max(screen.width, screen.height) * ratio);
    }

    function getGlRenderer() {
        if (glRenderer == null) {
            debugInfo = getGl().getExtension('WEBGL_debug_renderer_info');
            glRenderer = debugInfo == null ? 'unknown' : getGl().getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }

        return glRenderer;
    }

    function getModels() {
        if (models == null) {
            var gpu = getGlRenderer(),
                matches = gpu.match(/^apple\s+([_a-z0-9-]+)\s+gpu$/i),
                res = getResolution();

            models = ['unknown'];

            if (matches) {
                for (var i = 0; i < devices.length; i ++) {
                    var device = devices[i];

                    if (matches[1].toLowerCase() == device[0]
                        && res == device[1]) {
                        models = device[2];
                        break;
                    }
                }
            }
        }

        return models;
    }

    if (window.MobileDevice == undefined) {
        window.MobileDevice = {};
    }

    window.MobileDevice.getGlRenderer = getGlRenderer;
    window.MobileDevice.getModels = getModels;
    window.MobileDevice.getResolution = getResolution;

    window.MobileDevice.is = function (match) {
        var currentModels = getModels();
        match = match.toLowerCase().replace(/\s+$/, '') + ' ';

        for (var i = 0; i < currentModels.length; i ++) {
            var model = currentModels[i].toLowerCase() + ' ';

            if (0 === model.indexOf(math)) {
                return true;
            }
        }

        return false;
    };
})();
