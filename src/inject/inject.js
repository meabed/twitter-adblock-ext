//
var echo = function (msg) {
    console.log(msg);
}

var isMobile = false;
var isWeb = false;
if (document.location.host === 'twitter.com') {
    isWeb = true;
}
if (document.location.host === 'mobile.twitter.com') {
    isMobile = true;
}

chrome.extension.sendMessage({}, function (response) {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);

            // Options for the observer (which mutations to observe)
            var config = {
                attributes: false,
                childList: true,
                subtree: true
            };

            // Callback function to execute when mutations are observed
            var callback = function (mutationsList, observer) {
                // var svgPathsArr = section.getElementsByTagName('path');
                // for (svgPath of svgPathsArr) {
                //     var d = svgPath.getAttribute('d');
                //     if (d.startsWith('M20.75 2H3.25A2.25 2.25 0 0 0 1 4.25v15.5A2.25')) {
                //         console.log(d, svgPath)
                //         var article = svgPath.closest('article');
                //         if (article) {
                //             article.remove();
                //             console.log('remove promo article')
                //         }
                //     }
                // }
                for (var mutation of mutationsList) {
                    if (mutation.type == 'childList') {
                        if (mutation.addedNodes.length > 0) {
                            for (node of mutation.addedNodes) {
                                if (node.innerHTML && node.innerHTML.includes('d="M20.75 2H3.25A2.25 2.25 0 0 0 1 4.25v15.5A2.25')) {
                                    echo('hide promo node')
                                    node.setAttribute("style", "display:none;");
                                    // node.setAttribute("style", "border:8px red dotted;");
                                    // twitter break when you remove element
                                    // node.remove();
                                }
                            }
                        }
                    } else if (mutation.type == 'attributes') {
                        echo('The ' + mutation.attributeName + ' attribute was modified.');
                    }
                }
            };

            // Create an observer instance linked to the callback function
            var observer = new MutationObserver(callback);

            // when body changes
            // Start observing the target node for configured mutations
            // ----------------------------------------------------------
            injectTimeout = null;
            var injectObs = function () {
                echo('injectObs')
                // if mobile
                // if web div.stream
                var waitLen = 1;
                if (isWeb) {
                    var sectionList = document.querySelectorAll('div.stream') || [];
                }
                if (isMobile) {
                    var sectionList = document.getElementsByTagName('section') || [];
                    waitLen = 2;
                }
                clearTimeout(injectTimeout);
                len = sectionList.length;
                if (len === 0 || len < waitLen) {
                    echo('wait for sections to be visible')
                    injectTimeout = window.setTimeout(injectObs, 1000);
                } else {
                    for (section of sectionList) {
                        echo(section);
                        observer.observe(section, config);
                    }
                }
            }
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
                    if (mutation.type == 'childList') {
                        if (mutation.addedNodes.length > 0) {
                            for (node of mutation.addedNodes) {
                                if (isMobile && node.innerHTML && node.innerHTML.includes('data-testid="primaryColumn"')) {
                                    echo('inject mobile primaryColumn')
                                    injectObs();
                                }
                            }
                        }
                    }
                }
            }

            var obsConfig = {
                attributes: false,
                childList: true,
                subtree: true
            };

            // var container = document.body || document.documentElement;
            var container = undefined;
            if (isMobile) {
                // container = document.querySelectorAll('[data-testid="primaryColumn"]')[0];
                container = document.getElementById('react-root');
                var mobileDomObserver = new MutationObserver(mobileElCallBack);
                echo(container);
                if (container) {
                    echo('container found')
                    mobileDomObserver.observe(container, obsConfig);
                } else {
                    echo('container not found')
                }
            }

            if (isWeb) {
                //container = document.getElementById('page-container');
                container = document.getElementsByClassName('stream')[0];
                injectObs();
            }
        }
    }, 10);
});
