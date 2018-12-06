//
var echoEnabled = 0;
var productionBuild = 1;
var echo = function (msg) {
    if (echoEnabled === 1) {
        console.log(msg);
    }
};

var isMobile = false;
var isWeb = false;
if (document.location.host === 'twitter.com') {
    isWeb = true;
}
if (document.location.host === 'mobile.twitter.com') {
    isMobile = true;
}

var removeInsidePromo = function (el) {
    echo('removeInsidePromo', el);
    var svgPathsArr = el.getElementsByTagName('path');
    echo(svgPathsArr);
    for (var svgPath of svgPathsArr) {
        var d = svgPath.getAttribute('d');
        if (d.startsWith('M20.75 2H3.25A2.25 2.25 0 0 0 1 4.25v15.5A2.25')) {
            echo(d, svgPath);
            var article = svgPath.closest('article');
            if (article) {
                if (productionBuild === 1) {
                    article.setAttribute('style', 'display:none;');
                } else {
                    article.setAttribute('style', 'border:8px red dotted;');
                }
                echo('remove promo article');
            }
            var aTrend = svgPath.closest('a[data-testid="trend"]');
            if (aTrend) {
                if (productionBuild === 1) {
                    aTrend.setAttribute('style', 'display:none;');
                } else {
                    aTrend.setAttribute('style', 'border:8px red dotted;');
                }
                echo('remove promo aTrend');
            }
        }
    }

};

// Callback function to execute when mutations are observed
var callback = function (mutationsList, observer) {
    for (var mutation of mutationsList) {
        if (mutation.type === 'childList') {
            if (mutation.addedNodes.length > 0) {
                for (node of mutation.addedNodes) {
                    if (node.innerHTML && node.innerHTML.includes('d="M20.75 2H3.25A2.25 2.25 0 0 0 1 4.25v15.5A2.25')) {
                        echo('hide promo node');
                        if (productionBuild === 1) {
                            node.setAttribute('style', 'display:none;');
                        } else {
                            node.setAttribute('style', 'border:8px red dotted;');
                        }
                    }
                }
            }
        } else if (mutation.type === 'attributes') {
            echo('The ' + mutation.attributeName + ' attribute was modified.');
        }
    }
};


// Options for the observer (which mutations to observe)
var config = {
    attributes: false,
    childList: true,
    subtree: true
};

// Create an observer instance linked to the callback function
var observer = new MutationObserver(callback);

// when body changes
// Start observing the target node for configured mutations
// ----------------------------------------------------------
var injectTimeout = null;
var mobileSectionsBinded = 0;
var injectObs = function () {
    echo('injectObs');
    // if mobile
    // if web div.stream
    var waitLen = 1;
    var sectionList = [];
    if (isWeb) {
        sectionList = document.querySelectorAll('div.stream') || [];
    }
    if (isMobile) {
        sectionList = document.getElementsByTagName('section') || [];
        waitLen = 2;
    }
    clearTimeout(injectTimeout);
    var len = sectionList.length;
    mobileSectionsBinded = len;
    if (len === 0 || len < waitLen) {
        echo('wait for sections to be visible');
        injectTimeout = window.setTimeout(injectObs, 1000);
    } else {
        for (section of sectionList) {
            echo(section);
            removeInsidePromo(section);
            observer.observe(section, config);
        }
    }
};
// so we can handle body changes and browsing state changes
var mobileElCallBack = function (mutationsList, observer) {
    // check if mobile home or web home
    if (isMobile && document.location.pathname !== '/home') {
        return;
    }
    if (isWeb && document.location.pathname !== '/') {
        return;
    }

    for (var mutation of mutationsList) {
        if (mutation.type === 'childList') {
            if (mutation.addedNodes.length > 0) {
                for (node of mutation.addedNodes) {
                    if (isMobile && node.innerHTML && node.innerHTML.includes('data-testid="primaryColumn"')) {
                        echo('inject mobile primaryColumn');
                        injectObs();
                    }
                }
            }
        }
    }
};

var obsConfig = {
    attributes: false,
    childList: true,
    subtree: true
};
var mobileDomObserver = new MutationObserver(mobileElCallBack);


chrome.extension.sendMessage({}, function (response) {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === 'complete') {
            clearInterval(readyStateCheckInterval);


            // var container = document.body || document.documentElement;
            var container = undefined;
            if (isMobile) {
                // container = document.querySelectorAll('[data-testid="primaryColumn"]')[0];
                container = document.getElementById('react-root');
                echo(container);
                if (container) {
                    echo('container found');
                    mobileDomObserver.observe(container, obsConfig);
                    echo(mobileSectionsBinded);
                    if (mobileSectionsBinded === 0) { // cleanup never run because html page returned fast than script run
                        removeInsidePromo(container);
                    }
                } else {
                    echo('container not found');
                }
            }

            if (isWeb) {
                //container = document.getElementById('page-container');
                container = document.getElementsByClassName('stream')[0];
                injectObs();
            }
        }
    }, 20);
});
