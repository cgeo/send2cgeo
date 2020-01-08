# send2cgeo

Script for Mozilla Firefox and Google Chrome browser to [send geocaches directly from your browser to c:geo](http://www.cgeo.org/send2cgeo.html) on your phone.

## Version management

Changes must be done on the `master` branch. Once the changes are validated and ready to release, they can be merged to the `release` branch. The script version number needs to be raised after that merge to roll it out.

The script download link on the [c:geo homepage](http://cgeo.org) as well as the update mechanism for the installed script directly targets the raw script on the `release` branch, which means after merging the changes to `release` users will see the update on the website and script hosts (e.g. Greasemonkey) will detect and notify users to update.
