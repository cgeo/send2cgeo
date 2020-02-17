// ==UserScript==
// @name           Send to c:geo
// @namespace      http://send2.cgeo.org/
// @description    Add button "Send to c:geo" to geocaching.com
// @author         c:geo team and contributors
// @require        http://code.jquery.com/jquery-3.4.1.min.js
// @include        /^https?://www\.geocaching\.com/play/(search|map)/
// @include        /^https?://www\.geocaching\.com/seek/(cache_details\.|nearest\.|)/
// @include        /^https?://www\.geocaching\.com/my/recentlyviewedcaches\./
// @include        /^https?://www\.geocaching\.com/(map/|geocache/)/
// @icon           https://send2.cgeo.org/send2cgeo.png
// @downloadURL    https://github.com/cgeo/send2cgeo/raw/release/send2cgeo.user.js
// @updateURL      https://github.com/cgeo/send2cgeo/raw/release/send2cgeo.user.js
// @supportURL     https://github.com/cgeo/send2cgeo/issues
// @version        0.48
// ==/UserScript==

// Function that handles the actual sending
// The window.s2geo() functions have to be insert into the pagehead, so that they be called with onclick="window.s2geo"
var s2cgScript = document.createElement('script');
s2cgScript.type = 'text/javascript';
s2cgScript.innerHTML = 'window.s2geo = function(GCCode) {'
    // show the box and the "please wait" text
    + '$("#send2cgeo, #send2cgeo div").fadeIn();'
    // hide iframe for now and wait for page to be loaded
    + '$("#send2cgeo iframe")'
    + '   .hide()'
    + '   .off("load")'
    + '   .attr("src", "https://send2.cgeo.org/add.html?cache=" + GCCode)'
    + '   .on("load",'
    + '       function() {'
                  // hide "please wait text" and show iframe
    + '           $("#send2cgeo div").hide();'
                  // hide box after 3 seconds
    + '           $(this).css("display", "block").parent().delay(3000).fadeOut();'
    + '       }'
    + '   );'
    + '};';

document.getElementsByTagName('head')[0].appendChild(s2cgScript);

var s2geomultiScript = document.createElement('script');
s2geomultiScript.type = 'text/javascript';
s2geomultiScript.innerHTML = ''
    + 'window.s2geomulti = function(requestedCnt, skipFound, moreClicked) {'
    + '    if (typeof(skipFound) == "undefined" ) {'
    + '        skipFound = $("#send2cgeo_skip_found").is(":checked");'
    + '    }'
    + '    var alreadySent = $("[send2cgeo_sent]").length;'
    + '    if (alreadySent < requestedCnt) {'
    + '        var toAddIframe = $("[send2cgeo_gccode]").not("[send2cgeo_sent]").first();'
    + '        if (toAddIframe.length) {'
    + '            s2geomultiProcessLine(toAddIframe, skipFound, requestedCnt, alreadySent);'
    + '        } else {'
    + '            s2geomultiLoadMore(requestedCnt, alreadySent, skipFound, moreClicked);'
    + '        }'
    + '    } else {'
    + '        s2cgeoProgressReport("Finished after sending " + alreadySent + " caches.");'
    + '    }'
    + '};'

    + 'function s2cgeoProgressReport(message, append) {'
    + '    if (append) {'
    + '        $("#send2cgeo_controls_div").append(message);'
    + '    } else {'
    + '        $("#send2cgeo_controls_div").html(message);'
    + '    }'
    + '}'

    + 'function s2geomultiLoadMore(requestedCnt, alreadySent, skipFound, moreClicked) {'
    + '    if (!moreClicked) {'
    + '        s2cgeoProgressReport("Waiting to load more caches from web site, sent " + alreadySent + " caches.", false);'
    + '        var loadMoreBtn = $("#loadmore");'
    + '        loadMoreBtn.click();'
    + '        moreClicked = true;'
    + '    }'
    + '    s2cgeoProgressReport(".", true);'
    + '    setTimeout('
    + '        function() {'
    + '            s2geomulti(requestedCnt, skipFound, moreClicked);'
    + '        },'
    + '        2000'
    + '    );'
    + '}'

    + 'function s2geomultiProcessLine(toAddIframe, skipFound, requestedCnt, alreadySent) {'
    + '    if (skipFound) {'
    + '        if (toAddIframe.parent().parent().find(\'use[xlink\\\\:href*="#icon-found"]\').length === 0) {'
    + '             var GCCode = toAddIframe.attr("send2cgeo_gccode");'
    + '             toAddIframe.html("<iframe width=120 height=80 src=\'https://send2.cgeo.org/add.html?cache="+GCCode+"\'>");'
    + '             toAddIframe.attr("send2cgeo_sent","1");'
    + '             s2cgeoProgressReport((alreadySent+1)+" ",alreadySent!==0);'
    + '        } else {'
    + '            var trToDel = toAddIframe.parent().parent();'
    + '            trToDel.remove();'
    + '            s2cgeoProgressReport(".",alreadySent!==0);'
    + '        }'
    + '    }'
    + '    setTimeout('
    + '        function() {'
    + '            s2geomulti(requestedCnt, skipFound, false);'
    + '        },'
    + '        100'
    + '    );'
    + '};';

document.getElementsByTagName('head')[0].appendChild(s2geomultiScript);

// This solves the problems with jquery
var quitOnAdFrames = function() {
    var quitOnAdFramesDeref = new jQuery.Deferred();
    if (window.name) {
        if (window.name.substring(0, 18) !== 'google_ads_iframe_') {
            quitOnAdFramesDeref.resolve();
        } else {
            quitOnAdFramesDeref.reject();
        }
    } else {
        quitOnAdFramesDeref.resolve();
    }
    return quitOnAdFramesDeref.promise();
};

var jqueryInit = function(c) {
    if (typeof c.$ === "undefined") {
        c.$ = c.$ || unsafeWindow.$ || window.$ || null;
    }
    if (typeof c.jQuery === "undefined") {
        c.jQuery = c.jQuery || unsafeWindow.jQuery || window.jQuery || null;
    }
    var jqueryInitDeref = new jQuery.Deferred();
    jqueryInitDeref.resolve();
    return jqueryInitDeref.promise();
};

var start = function(c) {
    quitOnAdFrames()
        .then(function() {
            return jqueryInit(c);
        })
        .done(function() {
            s2cgGCMain();
        });
};

// This function add the send2cgeo buttons on geocaching.com
function s2cgGCMain() {
    // check for premium membership (parts of the page content are different)
    function premiumCheck() {
        var premium;
        if (document.getElementsByClassName('li-membership').length) {
            premium = document.getElementsByClassName('li-membership')[0];
        } else if (document.getElementsByClassName('li-upgrade').length) {
            premium = document.getElementsByClassName('li-upgrade')[0];
        } else {
            premium = true;
        }

        // premium has either an empty <li class="li-upgrade">
        // or none of li-membership / li-upgrade present
        if (premium !== true && premium.children.length) {
            // in case GC.com changes the content,
            // it still has to contain only "Upgrade" string
            if (premium.children[0].innerHTML == 'Upgrade') {
                premium = false;
            }
        } else {
            premium = true;
        }
        return premium;
    }

    // this adds a column with send2cgeo button in search results table
    function addSend2cgeoColumn(field) {
        var GCCode = $(field).text();
        GCCode = GCCode.slice(GCCode.indexOf("|") + 1).trim();
        if (document.getElementById('s2cg-' + GCCode)) {
            return;
        }

        var html = '<td class="mobile-show" >'
            + '<a id="s2cg-' + GCCode + '" href="https://send2.cgeo.org/add.html?cache=' + GCCode + '" '
            + "onclick='window.s2geo(\"" + GCCode + "\"); return false;' send2cgeo_gccode='" + GCCode + "'>"
            + '<img height="50" src="https://send2.cgeo.org/send2cgeo.png" '
            + 'border="0"> '
            + '</a></td>';

        $(field).parent().parent().before(html);
    }

    // waits for new elements (by ajax calls) injected into the DOM and calls a certain
    // method for certain elements
    // (here: used in search results - these are loaded lazyly when scrolling down)
    window.waitForKeyElements = function(selectorTxt, actionFunction, bWaitOnce, iframeSelector) {
        var targetNodes, btargetsFound;

        if (typeof iframeSelector == "undefined") {
            targetNodes = $(selectorTxt);
        } else {
            targetNodes = $(iframeSelector).contents().find (selectorTxt);
        }
        if (targetNodes && targetNodes.length > 0) {
            btargetsFound = true;
            // Found target node(s). Go through each and act if they are new
            targetNodes.each(
                function () {
                    var jThis = $(this);
                    var alreadyFound = jThis.data('alreadyFound') || false;

                    if (!alreadyFound) {
                        // Call the payload function
                        var cancelFound = actionFunction(jThis);
                        if (cancelFound) {
                            btargetsFound = false;
                        } else {
                            jThis.data('alreadyFound', true);
                        }
                    }
                }
            );
        } else {
            btargetsFound = false;
        }

        // Get the timer-control variable for this selector
        var controlObj = waitForKeyElements.controlObj || {};
        var controlKey = selectorTxt.replace (/[^\w]/g, "_");
        var timeControl = controlObj[controlKey];

        // Now set or clear the timer as appropriate
        if (btargetsFound && bWaitOnce && timeControl) {
            // The only condition where we need to clear the timer
            clearInterval(timeControl);
            delete controlObj[controlKey]
        } else {
            // Set a timer, if needed
            if (! timeControl) {
                timeControl = setInterval(
                    function () {
                        waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector);
                    },
                    300
                );
                controlObj[controlKey] = timeControl;
            }
        }
        waitForKeyElements.controlObj = controlObj;
    }

    // Defines the elements to insert into the page //////////////////////////////
    var boxWidth = 20,
        boxHeight = 7;

    var boxStyle = 'display:none; background:#1D1D1D; z-index:1010; left:50%; '
        + 'box-shadow:0 0 0.5em #000; padding:0; border:0; '
        + 'position:fixed; top:0.5em;  text-align:center; '
        + 'margin-left:-' + (boxWidth/2) + 'em; line-height:' + boxHeight + 'em; '
        + 'width:' + boxWidth + 'em; height:' + boxHeight + 'em; color: #fff';
    var waitStyle = 'width: ' + boxWidth + 'em; color: #fff';
    var iframeStyle = 'border:0; width:' + boxWidth + 'em; height: ' + boxHeight + 'em';

    $("body").append('<div id="send2cgeo" style="' + boxStyle + '">'
        + '<div style="' + waitStyle + '">Please wait&hellip;</div>'
        + '<iframe style="' + iframeStyle + '"></iframe>'
        + '</div>');

    // Send to c:geo on browsemap (old map)
    if (document.location.href.match(/\.com\/map/)) {
        var map = document.getElementById('cacheDetailsTemplate');
        var html = 'Log Visit</span></a>'
            + '<a class="lnk ui-block-b" '
            + 'href="https://send2.cgeo.org/add.html?cache={{=gc}}" '
            + "onclick=\"window.s2geo(\'{{=gc}}\'); return false;\" "
            + 'class="lnk">'
            + '<img src="/images/sendtogps/sendtogps_icon.png" '
            + 'align="absmiddle" border="0"> '
            + '<span>Send to c:geo</span>';

        map.innerHTML = map.innerHTML.replace('Log Visit</span>', html);
    }

    // Send to c:geo on seachmap (new map)
    if (document.location.href.match(/\.com\/play\/map/)) {
        // Build mutation observer for body
        function buildObserverBodySearchMap() {
            var observerBodySearchMap = new MutationObserver(function (mutations) {
                mutations.forEach(function(mutation) {
                    // Insert s2cgeo
                    if (document.querySelector('.cache-preview-action-menu')) {
                        var GCCode = $('.cache-metadata-code').html();
                        // Break when a button with the GCCode alrady exist
                        if (document.getElementById('s2cg-' + GCCode)) {
                            return;
                        }
                        // Remove button when the GCCode has change
                        if (document.querySelector('.cache-preview-action-menu ul .s2cg')) {
                            $('.s2cg').remove();
                        }
                        // Add s2cg button.
                        var html = '<li class="s2cg"><a id="s2cg-' + GCCode + '" href="javascript:void(0);" title="Send to c:geo">'
                            + '<img class="action-icon" src="https://send2.cgeo.org/send2cgeo.png" />'
                            + '<span>Send to c:geo</span>'
                            + '</a></li>'
                        $('.more-info-li').before(html);

                        // Because jQuery is not supported by the Search Map, the window.s2geo() function does not work.
                        // The following function is a workaround to solve this problem.
                        $('#s2cg-' + GCCode).bind('click', function() {
                            // show the box and the "please wait" text
                            $("#send2cgeo, #send2cgeo div").fadeIn();
                            // hide iframe for now and wait for page to be loaded
                            $("#send2cgeo iframe")
                                .hide()
                                .off('load')
                                .attr('src', 'https://send2.cgeo.org/add.html?cache=' + GCCode)
                                .on('load',
                                    function() {
                                        // hide "please wait text" and show iframe
                                        $("#send2cgeo div").hide();
                                        // hide box after 3 seconds
                                        $(this).css('display', 'block').parent().delay(3000).fadeOut();
                                    }
                                );
                        });
                    }
                });
            });
            var target = document.querySelector('body');
            var config = {
                attributes: true,
                childList: true,
                characterData: true,
            };
            observerBodySearchMap.observe(target, config);
        }

        // Check if mutation observer for body can be build
        function checkForBuildObserverBodySearchMap(waitCount) {
            if ($('body')[0]) {
                if ($('.s2cg_buildObserverBodySearchMap')[0]) {
                    return;
                }
                $('body').addClass('s2cg_buildObserverBodySearchMap');
                buildObserverBodySearchMap();
            } else {
                waitCount++;
                if (waitCount <= 200) {
                    setTimeout(
                        function() {
                            checkForBuildObserverBodySearchMap(waitCount);
                        },
                        50,
                    );
                }
            }
        }
        checkForBuildObserverBodySearchMap(0);

    }

    // Send to c:geo on new seachpage
    if (document.location.href.match(/\.com\/play\/search/)) {

        window.waitForKeyElements(".cache-details", addSend2cgeoColumn, false);

        $("#searchResultsTable").before(
            "<div id='send2cgeo_controls_div'><a href=\"#\" onclick=\"window.s2geomulti(50); return false;\">Send2cgeo: 50</a> "
                + "<a href=\"#\" onclick=\"window.s2geomulti(100); return false;\">100</a> "
                + "<a href=\"#\" onclick=\"window.s2geomulti(200); return false;\">200</a> "
                + "<a href=\"#\" onclick=\"window.s2geomulti(500); return false;\">500</a> "
                + "<label><input checked='true' style='display:block' type='checkbox' id='send2cgeo_skip_found' name='send2cgeo_skipt_found'><span class=\"label\">Skip found caches</span></label></div>"
        );

        // Send2cgeo column header for func addSend2cgeoColumn
        var S2CGHeader = '<th class="mobile-show"><a class="outbound-link">Send to c:geo</a></th>';
        if (premiumCheck()) {
            $("#searchResultsTable th").first().after(S2CGHeader);
            $("#searchResultsTable col").first().after('<col></col>');
        } else {
            $("#searchResultsTable th").first().before(S2CGHeader);
            $("#searchResultsTable col").first().before('<col></col>');
        }

        var caches = $(".cache-details");
        caches.each(addSend2cgeoColumn);
    }

    // Send to c:geo on cache detail page
    if (document.location.href.match(/\.com\/(seek\/cache_details\.aspx|geocache\/)/)) {
        var GCCode = $("#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode").html();

        var html2 = '<dt class="label">'
            + '<a id="ctl00_ContentBody_lnkGpxDownload" onclick="window.s2geo(\'' + GCCode
            + '\'); return false;"><span id="ctl00_ContentBody_uxDownloadLabel">Send to c:geo</span></a>'
            + '</dt>'

        $("#Download dd:last").append(html2);

    }

    // Send to c:geo on recentlyviewed and nearest list
    if (document.location.href.match(/\.com\/seek\/nearest\.aspx/) || document.location.href.match(/\.com\/my\/recentlyviewedcaches\.aspx/)) {
        $('.BorderTop th').first().after('<th><img src="https://send2.cgeo.org/send2cgeo.png" title="Send to c:geo" height="20px" /></th>')
        $('.Data.BorderTop').each(
            function() {
                var text = $(this).find(".Merge").last().find(".small").first().text().split("|");
                var GCCode = text[text.length - 2].trim();
                var html = '<td><a href="javascript:void(0);" onclick="window.s2geo(\'' + GCCode + '\'); return false;">'
                    + '    <img src="https://send2.cgeo.org/send2cgeo.png" title="Send to c:geo" height="20px" />'
                    + '</a></td>';
                $(this).find('td').first().after(html);
            }
        );
    }
}

start(this);
