// ==UserScript==
// @name           Send to c:geo
// @namespace      http://send2.cgeo.org/
// @description    Add button "Send to c:geo" to geocaching.com and opencaching.de
// @author         c:geo team and contributors
// @require        http://code.jquery.com/jquery-3.4.1.min.js
// @include        /^https?://www\.geocaching\.com/play/(search|map)/
// @include        /^https?://www\.geocaching\.com/play/owner/(published|unpublished|archived)/
// @include        /^https?://www\.geocaching\.com/play/owner/(published|unpublished|archived)/events/
// @include        /^https?://www\.geocaching\.com/seek/(cache_details\.|nearest\.|)/
// @include        /^https?://www\.geocaching\.com/my/(recentlyviewedcaches|default)\./
// @include        /^https?://www\.geocaching\.com/(map/|geocache/)/
// @include        /^https?://www\.geocaching\.com/plan/lists/
// @include        /^https?://www\.geocaching\.com/account/dashboard/
// @include        /^https?://www\.opencaching\.de/(viewcache|myhome).php/
// @icon           https://www.cgeo.org/send2cgeo.png
// @downloadURL    https://github.com/cgeo/send2cgeo/raw/release/send2cgeo.user.js
// @updateURL      https://github.com/cgeo/send2cgeo/raw/release/send2cgeo.user.js
// @supportURL     https://github.com/cgeo/send2cgeo/issues
// @version        2020.08.26
// @grant          GM_setValue
// @grant          GM_getValue
// ==/UserScript==

// Function that handles the actual sending
// The window.s2geo() functions have to be insert into the pagehead, so that they be called with onclick="window.s2geo"
var s2cgScript = document.createElement('script');
s2cgScript.type = 'text/javascript';
s2cgScript.innerHTML = 'window.s2geo = function(GCCode) {'
    // show the box and the "please wait" text
    + (isUseWithoutThirdPartyCookies()
        ? "    var sendCache = window.open('https://send2.cgeo.org/add.html?cache=' + GCCode, 'send' + GCCode, 'width=200,height=100,top=10,left=10,menubar=no,status=no');"
        + '    window.setTimeout('
        + '        function() {'
        + '            sendCache.close();'
        + '        },'
        + '        3000'
        + '    )'
        : '$("#send2cgeo, #send2cgeo div").fadeIn();'
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
    )
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

function isUseWithoutThirdPartyCookies() {
    return GM_getValue('useWithoutThirdPartyCookies', false);
}

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
            if (premium.children[0].getAttribute('data-event-label') == 'Upgrade CTA') {
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
            + '<img height="50" src="https://www.cgeo.org/send2cgeo.png" '
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

    // Remove element if it already exists
    function removeIfAlreadyExists(name, elemToRemove) {
        if ($(name)[0]) {
            $(elemToRemove).remove();
        }
    }

    // Send List
    function sendList(whatSend) {
        removeIfAlreadyExists('#s2cgeo-process', $('#s2cgeo-process'));
        var alreadySend = 0;
        $('.section-controls').after('<div id="s2cgeo-process"></div>');
        // Send selected
        if (whatSend == 'selected') {
            var caches = $.find('.geocache-table tbody tr');
            $(caches).each(
                function() {
                    if ($(this).find('.gc-checkbox').hasClass('checked')) {
                        var text = $(this).find('.geocache-code').text().split('|');
                        var GCCode = text[1].trim();
                        $(this).attr('s2cgeo-send', GCCode);
                    }
                }
            );
        }

        // Sending
        var cachesToSend = $('[s2cgeo-send]');
        function sendCache(i) {
            var GCCode = $(cachesToSend[i]).attr('s2cgeo-send');
            if (isUseWithoutThirdPartyCookies()) {
                var padding = i%10 * 30 + 10;
                let sendCache = window.open('https://send2.cgeo.org/add.html?cache=' + GCCode, 'send' + GCCode, 'width=200,height=100,top=' + padding +',left=' + padding + ',menubar=no,status=no');
                window.setTimeout(
                    function() {
                        sendCache.close();
                    },
                    900
                );
            } else {
                $(cachesToSend[i]).find('.s2cgeo').html('<iframe name="' + GCCode + '" src=\"https://send2.cgeo.org/add.html?cache=' + GCCode + '\" width="80" height="55">');
            }
            alreadySend++;
            $('#s2cgeo-process').html(alreadySend + '/' + cachesToSend.length + ' caches sent');
            if (i+1 < cachesToSend.length) {
                window.setTimeout(
                    function () {
                        sendCache(i+1);
                    },
                    100
                )
            }
        }
        sendCache(0)
    }

    // This function add the send2cgeo buttons on geocaching.com
    // Because jQuery is not supported by some pages, the window.s2geo() function does not work.
    // The following function is a workaround to solve this problem.
    function buildButton(GCCode, anchor, height, imgClass='') {
        // Add s2cg button.
        var html = '<a id="s2cg-' + GCCode + '" href="javascript:void(0);" title="Send to c:geo">'
            + '<img class="' + imgClass + '" src="https://www.cgeo.org/send2cgeo.png" height="' + height + '"/>'
            + '</a>';

        $(anchor).append(html);

        $('#s2cg-' + GCCode).on('click', function() {
            if (isUseWithoutThirdPartyCookies()) {
                var sendCache = window.open('https://send2.cgeo.org/add.html?cache=' + GCCode, 'send' + GCCode, 'width=200,height=100,top=10,left=10,menubar=no,status=no');
                window.setTimeout(
                    function() {
                        sendCache.close();
                    },
                    3000
                );
            } else {
                // show the box and the "please wait" text
                $("#send2cgeo, #send2cgeo div").fadeIn();
                // hide iframe for now and wait for page to be loaded
                $("#send2cgeo iframe")
                    .hide()
                    .off("load")
                    .attr("src", "https://send2.cgeo.org/add.html?cache=" + GCCode)
                    .on("load",
                        function() {
                            // hide "please wait text" and show iframe
                            $("#send2cgeo div").hide();
                            // hide box after 3 seconds
                            $(this).css("display", "block").parent().delay(3000).fadeOut();
                        }
                    );
            }
        });
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

// This function add the send2cgeo buttons on geocaching.com
    // Send to c:geo on browsemap (old map)
    if (document.location.href.match(/\.com\/map/)) {
        var template = $("#cacheDetailsTemplate").html();
        var html = '<a href="javascript:void(0);" onclick="window.s2geo(\'{{=gc}}\'); return false;">'
            + '<img height="16px" src="https://www.cgeo.org/send2cgeo.png" />'
            + '<span>Send to c:geo</span></a>';

        var searchpos = template.indexOf('/images/icons/16/write_log.png');
        var pos = template.indexOf('</a>', searchpos) + 4;

        template = template.substring(0, pos) + html + template.substring(pos, template.length);
        $("#cacheDetailsTemplate").html(template);
    }

    // Send to c:geo on seachmap (new map)
    if (document.location.href.match(/\.com\/play\/map/)) {
        function addButton() {
            if (document.querySelector('.cache-preview-action-menu')) {
                var GCCode = $('.cache-metadata-code').html();
                // Break when a button with the GCCode already exist
                if (document.getElementById('s2cg-' + GCCode)) {
                    return;
                }
                // Remove button when the GCCode has change
                removeIfAlreadyExists('.cache-preview-action-menu ul li.s2cg', $('li.s2cg'));
                $('.cache-preview-action-menu ul').append('<li class="s2cg"></li>');
                buildButton(GCCode, $('li.s2cg'), '25px', 'action-icon');
                $('li.s2cg a').append('<span>Send to c:geo</span>');
            }
        }

        // observer callback for checking existence of sidebar
        var cb_body = function(mutationsList, observer) {
            if ($('div#sidebar')[0] && !$('.s2cg_sidebar_observer')[0]) {
                $('div#sidebar').addClass('s2cg_sidebar_observer');
                // start observing sidebar for switches between search list and cache details view
                var target_sidebar = $('div#sidebar')[0];
                var config_sidebar = {
                    childList: true,
                    subtree: true
                };
                observer_sidebar.observe(target_sidebar, config_sidebar);
            }
        }

        // observer callback when sidebar switches between search list and cache details view
        var cb_sidebar = function(mutationsList, observer) {
            observer_sidebar.disconnect();

            addButton()

            var target_sidebar = $('div#sidebar')[0];
            var config_sidebar = {
                childList: true,
                subtree: true
            };
            observer_sidebar.observe(target_sidebar, config_sidebar);
        }

        // create observer instances linked to callback functions
        var observer_body    = new MutationObserver(cb_body);
        var observer_sidebar = new MutationObserver(cb_sidebar); // ATTENTION: the order matters here
        
        var target_body = $('body')[0];
        var config_body = {
            childList: true,
            attributes: true
        };
        observer_body.observe(target_body, config_body);
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
            $('head').append('<style type="text/css">tr[data-premium] td + td {padding: 0 !important;}</style>');
        }

        var caches = $(".cache-details");
        caches.each(addSend2cgeoColumn);
    }

    // Send to c:geo on cache detail page
    if (document.location.href.match(/\.com\/(seek\/cache_details\.aspx|geocache\/)/)) {
        var GCCode = $("#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode").html();

        var html2 = '<dt><a href="javascript:void(0);" onclick="window.s2geo(\'' + GCCode + '\'); return false;" style="display:flex;">'
            + '<img src="https://www.cgeo.org/send2cgeo.png" title="Send to c:geo" height="16px" />'
            + '<span>Send to c:geo</span></a></dt>';

        $("#Download dd:last").append(html2);
    }

    // Send to c:geo on recentlyviewed and nearest list
    if (document.location.href.match(/\.com\/seek\/nearest\.aspx/) || document.location.href.match(/\.com\/my\/recentlyviewedcaches\.aspx/)) {
        $('.BorderTop th').first().after('<th><img src="https://www.cgeo.org/send2cgeo.png" title="Send to c:geo" height="20px" /></th>');
        $('.Data.BorderTop').each(
            function() {
                var text = $(this).find(".Merge").last().find("span.small").first().text().split("|");
                var GCCode = text[text.length - 2].trim();
                var html = '<td><a href="javascript:void(0);" onclick="window.s2geo(\'' + GCCode + '\'); return false;">'
                    + '    <img src="https://www.cgeo.org/send2cgeo.png" title="Send to c:geo" height="20px" />'
                    + '</a></td>';
                $(this).find('td').first().after(html);
            }
        );
    }

    // Send to c:geo on new List / new BML
    if (document.location.href.match(/\.com\/plan\/lists\/BM/)) {
        // observer callback
        let cb = function() {
            // add buttons if table has been loaded
            if ($('div.footer-pagination-container').length > 0) {
                addButtons();
            }
        }

        // observe body for changes of child nodes
        let target = $('body')[0];
        let config = {
            childList: true,
            subtree: true
        };
        let observer = new MutationObserver(cb);
        observer.observe(target, config);

        function addButtons() {
            // stop observing during adding the buttons
            observer.disconnect();

            if ($('.multi-select-action-bar')[0]) {
                removeIfAlreadyExists('#s2cgeo-selected', $('#s2cgeo-selected'));
                $('.multi-select-action-bar-count-section').after('<a id="s2cgeo-selected" href="javascript:void(0);">'
                    + '    <img src="https://www.cgeo.org/send2cgeo.png" title="Send to c:geo" height="45px" style="margin-right:8px" />'
                    + '</a>');
                $('#s2cgeo-selected').on('click', function() {
                    sendList('selected');
                });
            }

            removeIfAlreadyExists('.header-s2cgeo', $('.header-s2cgeo'));
            $('.geocache-table thead th.header-geocache-name').before('<th class="header-s2cgeo"><img src="https://www.cgeo.org/send2cgeo.png" title="Send to c:geo" height="20px" /></th>');

            $('.geocache-table tbody tr').each(
                function() {
                    if ($(this).find('iframe')[0]) {
                        return;
                    }
                    if (!$(this).find('.geocache-code')[0]) { // return if there is a comment for the cache
                        if (!$(this).find('.s2cg')[0]) {
                            $(this).find('.cache-description').before('<td class="s2cg"></td>');
                        }
                        return;
                    }
                    var text = $(this).find('.geocache-code').text().split('|');
                    var GCCode = text[1].trim();

                    removeIfAlreadyExists('#s2cg-' + GCCode, $('#s2cg-' + GCCode).parent());

                    $(this).find('td.cell-geocache-name').before('<td class="s2cgeo"></td>');
                    buildButton(GCCode, $(this).find('td.s2cgeo'), '20px');
                }
            );
            // continue observing
            observer.observe(target, config);
        }
    }

    if (document.location.href.match(/\.com\/play\/owner/)) {
        // observer callback
        let cb = function() {
            // add buttons if table has been loaded
            if ($('.section-controls').length > 0) {
                addButtons();
            }
        }

        // observe body for changes of child nodes
        let target = $('body')[0];
        let config = {
            childList: true,
            subtree: true
        };
        let observer = new MutationObserver(cb);
        observer.observe(target, config);

        function addButtons() {
            // stop observing during adding the buttons
            observer.disconnect();

            removeIfAlreadyExists('.header-s2cgeo', $('.header-s2cgeo'));
            $('.geocache-table thead th.header-name').before('<th class="header-s2cgeo"><img src="https://www.cgeo.org/send2cgeo.png" title="Send to c:geo" height="20px" /></th>');

            $('.geocache-table tbody tr').each(
                function() {
                    var text = $(this).find('.geocache-details').text().split('|');
                    text = text[0].trim();
                    var GCCode = text.substr(0, text.length-3).trim();

                    removeIfAlreadyExists('#s2cg-' + GCCode, $('#s2cg-' + GCCode).parent());

                    $(this).find('td.name-display').before('<td class="s2cgeo"></td>');
                    buildButton(GCCode, $(this).find('td.s2cgeo'), '20px');
                }
            );

            // continue observing
            observer.observe(target, config);
        }
    }

// This function add the send2cgeo buttons on opencaching.de
    // Send to c:geo on viewcache
    if(document.location.href.match(/\.de\/viewcache\.php/)) {
        var oc = document.getElementsByClassName('exportlist')[0].parentNode.parentNode;
        var occode = document.title;
        occode = occode.substring(0, occode.indexOf(" ", 0));

        var html = '<img src="https://www.cgeo.org/send2cgeo.png" height="16px" />'
            + '<a href="javascript:void(0);" onclick="window.s2geo(\'' + occode + '\'); return false;" >&nbsp;'
            + '<input class="exportbutton" type="button" value="An c:geo senden" title="Send to c:geo" /></a> '
            + '</p>';

        oc.innerHTML = oc.innerHTML.replace('</p>', html);
    }

// This will add settings
    function save_settings() {
        GM_setValue('useWithoutThirdPartyCookies', $('#useWithoutThirdPartyCookies').is(':checked'));
    }

    function buildToggle(id, label, info='') {
        return '<div class="s2cg_toggle">'
             + '    <label>' + label
             + '        <input type="checkbox" id="' + id + '"' + (GM_getValue(id, false) ? ' checked' : '') + '><span class="slider"></span>'
             + '    </label>'
             + (info != ''
                ? '    <label for="' + id + '_info" class="s2cg_infoBtn"> ?</label>'
                + '    <input type="checkbox" id="' + id + '_info" class="s2cg_info">'
                + '    <div class="s2cg_info">' + info + '</div>'
                : '')
             + '</div>'
    }

    // Long info text
    var thirdPartyCookiesInfo = 'Chrome blocks third-party cookies by default, because they <b>can be</b> malicious. '
                              + 'You can also block third-party cookies in other browsers.<br>"Send to c:geo" uses '
                              + 'cookies on geocaching.com and opencaching.de and is therefore a third-party cookie.'
                              + '<br>With this option, the cookies are not set via the geocaching.com and opencaching.de '
                              + 'pages, but in a pop-up window so that you can continue to use "Send to c:geo".<br>'
                              + '<b>Attention: Sending multiple Caches does not work on the search page </b>'
                              + '(https://www.geocaching.com/play/search)';

    var settingsHTML = '<div id="send2cgeo_settings" style="display:none;">'
                     + '    <div id="s2cg_settings_content">'
                     + '        <div id="s2cg_settings_header">'
                     + '            <h1>Send to c:geo settings</h1>'
                     + '        </div>'
                     // Add options
                     + buildToggle('useWithoutThirdPartyCookies', 'Use Send to c:geo without third-party cookies', thirdPartyCookiesInfo)
                     // Save-Button
                     + '            <input type="button" id="send2cgeo_settings_submit" value="Save">'
                     + '    </div>'
                     + '</div>';

    var settingsCSS = '#send2cgeo_settings {'
                    + '    position: fixed;'
                    + '    background: rgba(31, 31, 31, .7);'
                    + '    top: 0;'
                    + '    left: 0;'
                    + '    width: 100%;'
                    + '    height: 100%;'
                    + '    z-index: 1111;'
                    + '    color: #fff;'
                    + '}'

                    + '#s2cg_settings_content {'
                    + '    position: absolute;'
                    + '    top: 50%;'
                    + '    left: 50%;'
                    + '    width: 60%;'
                    + '    -webkit-transform: translate(-50%, -50%);'
                    + '    -ms-transform: translate(-50%, -50%);'
                    + '    transform: translate(-50%, -50%);'
                    + '    background: rgba(31, 31, 31, 1);'
                    + '    padding: 1em;'
                    + '    border-radius: 1em;'
                    + '}'

                    + '#s2cg_settings_content p, .s2cg_toggle label, #send2cgeo_settings_submit {'
                    + '    font-size: ' + (document.location.href.match(/\.de\/myhome\.php/) ? '1.5' : '1') + 'em !important;'
                    + '}'

                    + '#send2cgeo_settings_submit {'
                    + '    margin-top: 1em;'
                    + '    color: rgba(31, 31, 31, 1);'
                    + '    border-radius: 5px;'
                    + '    cursor: pointer;'
                    + '    padding: 0 8px;'
                    + '}'

                    + '.s2cg_toggle {'
                    + '    padding-left: 1em;'
                    + '}'

                    + '.s2cg_toggle label {'
                    + '    position: relative;'
                    + '    display: inline-block;'
                    + '    text-transform: none;'
                    + '}'

                    + '.s2cg_toggle input {'
                    + '    display: none;'
                    + '}'

                    + '.s2cg_toggle .slider {'
                    + '    position: absolute;'
                    + '    cursor: pointer;'
                    + '    margin-left: .5em;'
                    + '    width: 2em;'
                    + '    height: 1em;'
                    + '    background: #c32e04; /* red */'
                    + '    transition: all .3s ease-in-out;'
                    + '    border-radius: 1em;'
                    + '}'

                    + '.s2cg_toggle .slider:before {'
                    + '    position: absolute;'
                    + '    content: "";'
                    + '    height: .6em;'
                    + '    width: .6em;'
                    + '    left: .2em;'
                    + '    bottom: .2em;'
                    + '    background: white;'
                    + '    border-radius: 50%;'
                    + '    transition: all .3s ease-in-out;'
                    + '}'

                    + '.s2cg_toggle input:checked + .slider {'
                    + '    background: #5a9900; /* green */'
                    + '}'

                    + '.s2cg_toggle input:checked + .slider:before {'
                    + '    -webkit-transform: translateX(1em);'
                    + '    -ms-transform: translateX(1em);'
                    + '    transform: translateX(1em);'
                    + '}'

                    + '.s2cg_info {'
                    + '    display: none;'
                    + '}'

                    + 'input.s2cg_info:checked + div.s2cg_info {'
                    + '    display: block;'
                    + '}'

                    + 'div.s2cg_info {'
                    + '    margin: 0 0 1em 1.5em;'
                    + '}'

                    + '.s2cg_infoBtn {'
                    + '    cursor:pointer;'
                    + '    margin-left:3em;'
                    + '    border:2px solid #fff;'
                    + '    border-radius:50%;'
                    + '    width: 1.5em;'
                    + '    height: 1.5em;'
                    + '    padding-left: .3em;'
                    + '    font-weight: bold;'
                    + '    box-sizing: border-box;'
                    + '}'

                    + '.s2cg_infoBtn:hover {'
                    + '    background: #9f9f9f;'
                    + '}';

    if (document.location.href.match(/\.com\/account\/dashboard/) || document.location.href.match(/\.com\/my\/default.aspx/) || document.location.href.match(/\.de\/myhome\.php/)) {
        $('head').append('<style>' + settingsCSS + '</style>');
        $('body').append(settingsHTML);
        // geocaching.com
        // new Dashboard
        if (document.location.href.match(/\.com\/account\/dashboard/)) {
            $('.bio-meta').append('<a id="s2cg_openSettings" href="javascript:void(0)" style="display:block;">Send to c:geo settings</a>');
        }
        // new Dashboard
        if (document.location.href.match(/\.com\/my\/default.aspx/)) {
            $('#ctl00_ContentBody_WidgetMiniProfile1_memberProfileLink').parent().append(' | <a id="s2cg_openSettings" href="javascript:void(0)">Send to c:geo settings</a>');
        }
        // opencaching.de
        if (document.location.href.match(/\.de\/myhome\.php/)) {
        $('.content2-pagetitle').after('<div class="content2-container bg-blue02" style="margin-top:20px;">'
                                       + '    <p class="content-title-noshade-size3">'
                                       + '        <img src="https://www.cgeo.org/send2cgeo.png" style="margin-right:10px;" height="22px" />'
                                       + '        Send to c:geo <span class="content-title-link"><a id="s2cg_openSettings" href="javascript:void(0)">Settings</a></span>'
                                       + '    </p>'
                                       + '</div>');
        }
        // Open and Save settings
        $('#s2cg_openSettings').on('click', function() {
            $('#send2cgeo_settings').css('display', 'unset');
        });
        $('#send2cgeo_settings_submit').on('click', function() {
            save_settings();
            $('#send2cgeo_settings').css('display', 'none');
        });
    }
}

start(this);
