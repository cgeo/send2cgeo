// ==UserScript==
// @name           Send to c:geo
// @namespace      http://send2.cgeo.org/
// @description    Add button "Send to c:geo" to geocaching.com
// @author         c:geo team and contributors
// @grant          none
// @include        https://www.geocaching.com/play/search*
// @include        https://www.geocaching.com/play/search/*
// @include        http://www.geocaching.com/seek/cache_details*
// @include        https://www.geocaching.com/seek/cache_details*
// @include        https://www.geocaching.com/map/*
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
// @version        0.39
// ==/UserScript==

// Inserts javascript that will be called by the s2cgeo button. The closure
// look strange, but avoids having to escape the code. Almost everything
// is put into that script element so that geocaching.com's jQuery may be
// accessed.

var s       = document.createElement('script');

s.type      = 'text/javascript';
s.textContent =  '(' + function() {
  // function that handles the actual sending //////////////////////////////////

  window.s2geo = function(code) {
    // show the box and the "please wait" text
    $('#send2cgeo, #send2cgeo div').fadeIn();
    // hide iframe for now and wait for page to be loaded
    $('#send2cgeo iframe')
      .hide()
      .unbind('load')
      .attr('src', 'https://send2.cgeo.org/add.html?cache='+code)
      .load(function() {
        // hide "please wait text" and show iframe
        $('#send2cgeo div').hide();
        // hide box after 3 seconds
        $(this).css('display', 'block').parent().delay(3000).fadeOut();
      });
  };

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
        if (premium != true && premium.children.length) {
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
        GCCode = GCCode.slice( GCCode.indexOf("|") + 1 ).trim();

        var html = '<td class="mobile-show" >'
            + '<a href="https://send2.cgeo.org/add.html?cache=' + GCCode + '" '
            + 'onclick="window.s2geo(\'' + GCCode + '\'); return false;">'
            + '<img height="50" src="https://send2.cgeo.org/send2cgeo.png" '
            + 'border="0"> '
            + '</a></td>';

        // check for premium (different columns)
        if (premiumCheck()) {
            $(field).parent().parent().before(html);
        } else {
            $(field).parent().parent().after(html);
        }
  }

  // waits for new elements (by ajax calls) injected into the DOM and calls a certain
  // method for certain elements
  // (here: used in search results - these are loaded lazyly when scrolling down)
  window.waitForKeyElements = function(selectorTxt, actionFunction, bWaitOnce, iframeSelector) {
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes = $(selectorTxt);
    else
        targetNodes = $(iframeSelector).contents().find (selectorTxt);

    if (targetNodes  &&  targetNodes.length > 0) {
        btargetsFound   = true;
        /*--- Found target node(s).  Go through each and act if they
            are new.
        */
        targetNodes.each ( function () {
            var jThis        = $(this);
            var alreadyFound = jThis.data ('alreadyFound')  ||  false;

            if (!alreadyFound) {
                //--- Call the payload function.
                var cancelFound     = actionFunction (jThis);
                if (cancelFound)
                    btargetsFound   = false;
                else
                    jThis.data ('alreadyFound', true);
            }
        } );
    }
    else {
        btargetsFound   = false;
    }

    //--- Get the timer-control variable for this selector.
    var controlObj      = waitForKeyElements.controlObj  ||  {};
    var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
    var timeControl     = controlObj [controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval (timeControl);
        delete controlObj [controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if ( ! timeControl) {
            timeControl = setInterval ( function () {
                    waitForKeyElements (selectorTxt, actionFunction,
                        bWaitOnce, iframeSelector);
                },
                300
            );
            controlObj [controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj   = controlObj;
  }

  window.waitForKeyElements(".cache-details", addSend2cgeoColumn, false);

  // Defines the elements to insert into the page //////////////////////////////
  var boxWidth = 20,
      boxHeight = 7;

  var boxStyle = 'display:none; background:#1D1D1D; z-index:1000; left:50%;'
               + 'box-shadow:0 0 0.5em #000; padding:0; border:0; '
               + 'position:fixed; top:0.5em;  text-align:center; '
               + 'margin-left:-'+(boxWidth/2)+'em; line-height:'+boxHeight+'em;'
               + 'width:'+boxWidth+'em; height:'+boxHeight+'em; color: #fff';
  var waitStyle = 'width: '+boxWidth+'em; color: #fff';
  var iframeStyle = 'border:0; width:'+boxWidth+'em; height: '+boxHeight+'em';

  $('body').append('<div id="send2cgeo" style="'+boxStyle+'">'
    + '<div style="'+waitStyle+'">Please wait&hellip;</div>'
    + '<iframe style="'+iframeStyle+'"></iframe>'
    + '</div>');


  // Append to send2cgeo links/buttons /////////////////////////////////////////
  var map = document.getElementById('cacheDetailsTemplate');

  if(map !== null) {
    // geocaching.com map view
    var html = 'Log Visit</span></a>'
             + '<a class="lnk ui-block-b" '
             + 'href="https://send2.cgeo.org/add.html?cache={{=gc}}" '
             + 'onclick="window.s2geo(\'{{=gc}}\'); return false;" '
             + 'class="lnk">'
             + '<img src="/images/sendtogps/sendtogps_icon.png" '
             + 'align="absmiddle" border="0"> '
             + '<span>Send to c:geo</span>';

    map.innerHTML = map.innerHTML.replace('Log Visit</span>', html);
  } else if(document.getElementById('searchResultsTable') != null){
    // geocaching.com new search

    // Send 2 cgeo column header for func addSend2cgeoColumn
    var S2CGHeader = '<th class="mobile-show"><a class="outbound-link">Send to c:geo</a></th>';
    if (premiumCheck()) {
      $("#searchResultsTable th:nth-child(2)").after(S2CGHeader);
      $("#searchResultsTable col:nth-child(2)").after('<col></col>');
    } else {
      $("#searchResultsTable th").first().after(S2CGHeader);
      $("#searchResultsTable col").first().after('<col></col>');
    }

    var caches = $(".cache-details");
    caches.each(addSend2cgeoColumn);

  } else if(document.getElementById('ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode') != null){
    // geocaching.com cache detail page
    var GCCode = $('#ctl00_ContentBody_CoordInfoLinkControl1_uxCoordInfoCode')
                  .html();

    var html = '<input type="button" '
             + 'value="Send to c:geo" '
             + 'onclick="window.s2geo(\''+GCCode+'\'); '
             + 'return false;" '
             + '/>';

    $('#Download p:last').append(html);
    $('#Download dd:last').append(html);
  } else {
    // geocaching.com recentlyviewed
    $('img[src="/images/icons/16/send_to_gps.png"]').each(function(){
      $(this).attr('alt', "Send to c:geo").attr('title', "Send to c:geo");
    });
    $('a[title="Send to GPS"]').each(function(){
      var text = $(this).parent().parent().find(".Merge").last().find(".small").first().text().split("|");
      var GCCode = text[text.length - 2].trim();
      this.href="javascript:window.s2geo('"+GCCode+"')";
      this.title = "Send to c:geo";
    });

  }
} + ')();';

// Inject Script. Can't use jQuery yet, because the page is not
// accessible from Tampermonkey
document.getElementsByTagName("head")[0].appendChild(s);
