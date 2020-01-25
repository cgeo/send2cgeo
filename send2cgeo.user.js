// ==UserScript==
// @name           Send to c:geo
// @namespace      http://send2.cgeo.org/
// @description    Add button "Send to c:geo" to geocaching.com
// @author         c:geo team and contributors
// @grant          none
// @require        http://code.jquery.com/jquery-3.4.1.min.js
// @include        https://www.geocaching.com/play/search*
// @include        https://www.geocaching.com/play/search/*
// @include        http://www.geocaching.com/seek/cache_details*
// @include        https://www.geocaching.com/seek/cache_details*
// @include        https://www.geocaching.com/map/*
// @include        https://www.geocaching.com/play/map*
// @include        https://www.geocaching.com/play/map/*
// @include        http://www.geocaching.com/geocache/*
// @include        https://www.geocaching.com/geocache/*
// @include        http://www.geocaching.com/my/recentlyviewedcaches*
// @include        https://www.geocaching.com/my/recentlyviewedcaches*
// @include        http://www.geocaching.com/seek/nearest*
// @include        https://www.geocaching.com/seek/nearest*
// @icon           https://send2.cgeo.org/send2cgeo.png
// @downloadURL    https://github.com/cgeo/send2cgeo/raw/release/send2cgeo.user.js
// @updateURL      https://github.com/cgeo/send2cgeo/raw/release/send2cgeo.user.js
// @supportURL     https://github.com/cgeo/send2cgeo/issues
// @version        0.47
// ==/UserScript==

// Inserts javascript that will be called by the s2cgeo button. The closure
// look strange, but avoids having to escape the code. Almost everything
// is put into that script element so that geocaching.com's jQuery may be
// accessed.

/* global s2geomulti */

var s = document.createElement('script');

s.type = 'text/javascript';
s.textContent = '(' + function() {
    // function that handles the actual sending //////////////////////////////////

    window.s2geo = function(code) {
        // show the box and the "please wait" text
        $("#send2cgeo, #send2cgeo div").fadeIn();
        // hide iframe for now and wait for page to be loaded
        $("#send2cgeo iframe")
            .hide()
            .off('load')
            .attr('src', 'https://send2.cgeo.org/add.html?cache=' + code)
            .on('load',
                function() {
                    // hide "please wait text" and show iframe
                    $("#send2cgeo div").hide();
                    // hide box after 3 seconds
                    $(this).css('display', 'block').parent().delay(3000).fadeOut();
                }
            );
    };

    function s2cgeoProgressReport(message, append) {
        if (append) {
            $("#send2cgeo_controls_div").append(message);
        } else {
            $("#send2cgeo_controls_div").html(message);
        }
    }

    function s2geomultiLoadMore(requestedCnt, alreadySent, skipFound, moreClicked) {
        if (!moreClicked) {
            s2cgeoProgressReport("Waiting to load more caches from web site, sent " + alreadySent + " caches.", false);
            var loadMoreBtn = $("#loadmore");
            loadMoreBtn.click();
            moreClicked=true;
        }
        s2cgeoProgressReport(".", true);
        setTimeout(
            function() {
                s2geomulti(requestedCnt, skipFound, moreClicked);
            },
            2000
        );
    }

    function s2geomultiProcessLine(toAddIframe, skipFound, requestedCnt, alreadySent) {
        if (skipFound) {
            if (toAddIframe.parent().parent().find("use[xlink\\:href*=#icon-found]").length === 0) {
                var code = toAddIframe.attr("send2cgeo_gccode");
                toAddIframe.html("<iframe width=120 height=80 src=\"https://send2.cgeo.org/add.html?cache=" + code + "\">");
                toAddIframe.attr("send2cgeo_sent", "1");
                s2cgeoProgressReport((alreadySent + 1) + " ", alreadySent !== 0);
            } else {
                var trToDel = toAddIframe.parent().parent();
                trToDel.remove();
                s2cgeoProgressReport(".", alreadySent !== 0);
            }
        }
        setTimeout(
            function() {
                s2geomulti(requestedCnt, skipFound, false);
            },
            100
        );
    }

    window.s2geomulti = function(requestedCnt, skipFound, moreClicked) {
        if (typeof(skipFound) == "undefined" ) {
            skipFound = $("#send2cgeo_skip_found").is(":checked");
        }
        var alreadySent = $("[send2cgeo_sent]").length;
        if (alreadySent < requestedCnt) {
            var toAddIframe = $("[send2cgeo_gccode]").not("[send2cgeo_sent]").first();
            if (toAddIframe.length) {
                s2geomultiProcessLine(toAddIframe, skipFound, requestedCnt, alreadySent);
            } else {
                s2geomultiLoadMore(requestedCnt, alreadySent, skipFound, moreClicked);
            }
        } else {
            s2cgeoProgressReport("Finished after sending " + alreadySent + " caches.");
        }
    };

    $("#searchResultsTable").before(
        "<div id='send2cgeo_controls_div'><a href=\"#\" onclick=\"window.s2geomulti(50); return false;\">Send2cgeo: 50</a> "
            + "<a href=\"#\" onclick=\"window.s2geomulti(100); return false;\">100</a> "
            + "<a href=\"#\" onclick=\"window.s2geomulti(200); return false;\">200</a> "
            + "<a href=\"#\" onclick=\"window.s2geomulti(500); return false;\">500</a> "
            + "<label><input checked='true' style='display:block' type='checkbox' id='send2cgeo_skip_found' name='send2cgeo_skipt_found'><span class=\"label\">Skip found caches</span></label></div>"
    );

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

    window.waitForKeyElements(".cache-details", addSend2cgeoColumn, false);

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

    // react depending on the detected site //////////////////////////////////////
    var map = document.getElementById('cacheDetailsTemplate');
    if (map !== null) {
        // geocaching.com map view
        var html = 'Log Visit</span></a>'
            + '<a class="lnk ui-block-b" '
            + 'href="https://send2.cgeo.org/add.html?cache={{=gc}}" '
            + "onclick=\"window.s2geo(\'{{=gc}}\'); return false;\" "
            + 'class="lnk">'
            + '<img src="/images/sendtogps/sendtogps_icon.png" '
            + 'align="absmiddle" border="0"> '
            + '<span>Send to c:geo</span>';

        map.innerHTML = map.innerHTML.replace('Log Visit</span>', html);

    } else if (document.location.href.match(/\.com\/play\/map/)) {
        // Use Code from GClh.
        // Build mutation observer for body.
        function buildObserverBodySearchMap() {
            var observerBodySearchMap = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    // Insert s2cgeo.
                    if (document.querySelector('.cache-preview-action-menu')) {
                        var GCCode = $('.cache-metadata-code').html();
                        // Break when a button with the GCCode alrady exist.
                        if (document.getElementById('s2cg-' + GCCode)) {
                            return;
                        }
                        // Remove button when the GCCode has change.
                        if (document.querySelector('.cache-preview-action-menu ul .c2cg')) {
                            $('.cache-preview-action-menu ul .c2cg').remove();
                        }
                        // Add c2cg button.
                        var html = '<li class="c2cg"><a style="cursor:pointer;" id="s2cg-' + GCCode + '" onclick="window.s2geo(\''+GCCode+'\'); return false;"><img class="action-icon" src="https://send2.cgeo.org/send2cgeo.png" /><span>Send to c:geo</span></a></li>';
                        $('.more-info-li').before(html);
                    }
                });
            });
            var target = document.querySelector('body');
            var config = {attributes: true, childList: true, characterData: true};
            observerBodySearchMap.observe(target, config);
        }
        // Check if mutation observer for body can be build.
        function checkForBuildObserverBodySearchMap(waitCount) {
            if ($('body')[0]) {
                if ($('.s2cg_buildObserverBodySearchMap')[0]) return;
                $('body').addClass('s2cg_buildObserverBodySearchMap');
                buildObserverBodySearchMap();
            } else {waitCount++; if (waitCount <= 200) setTimeout(function(){checkForBuildObserverBodySearchMap(waitCount);}, 50);}
        }
        checkForBuildObserverBodySearchMap(0);
    } else if(document.getElementById('searchResultsTable') !== null) {
        // geocaching.com new search

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

    } else if (document.getElementById('ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode') !== null) {
        // geocaching.com cache detail page
        var GCCode = $("#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode").html();

        var html2 = '<dt class="label">'
            + '<a id="ctl00_ContentBody_lnkGpxDownload" onclick="window.s2geo(\'' + GCCode
            + '\'); return false;"><span id="ctl00_ContentBody_uxDownloadLabel">Send to c:geo</span></a>'
            + '</dt>'

        $("#Download dd:last").append(html2);

    } else {
        // geocaching.com recentlyviewed
        $('img[src="/images/icons/16/send_to_gps.png"]').each(
            function() {
                $(this).attr('alt', "Send to c:geo").attr('title', "Send to c:geo");
            }
        );
        $('a[title="Send to GPS"]').each(
            function() {
                var text = $(this).parent().parent().find(".Merge").last().find(".small").first().text().split("|");
                var GCCode = text[text.length - 2].trim();
                this.href="javascript:window.s2geo('" + GCCode + "')";
                this.title = "Send to c:geo";
            }
        );
    }

} + ')();';

// Inject Script. Can't use jQuery yet, because the page is not
// accessible from Tampermonkey
document.getElementsByTagName('head')[0].appendChild(s);
