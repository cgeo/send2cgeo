# send2cgeo

**send2cgeo** is a Tampermonkey/Greasemonkey script for geocaching.com and opencaching.de, which allows you to send geocaches directly from your browser to [c:geo](https://www.cgeo.org/) on your phone.
For more information, please visit the [send2cgeo website](https://www.cgeo.org/send2cgeo.html).
## Installation
- Install the [Tampermonkey Add-On](https://www.tampermonkey.net/) or a different user script manager in your browser
- After that, click [here](https://github.com/cgeo/send2cgeo/raw/release/send2cgeo.user.js) to install send2cgeo inside your user script manager (e.g. Tampermonkey)
- Finally, you have to [pair your browser with your phone](https://www.cgeo.org/send2cgeo.html#registering-browser-and-device) and you're ready! 
- If you need any further help, it's the best to visit the [send2cgeo installation guide](https://www.cgeo.org/send2cgeo#how-to-install-send2cgeo) on our website


## Version management

Changes must be done on the `master` branch. Once the changes are validated and ready to release, they can be merged to the `release` branch. The script version number needs to be derived from the actual date of release and set accordingly in the scripts `@version` tag before that merge (it needs to be larger than the existing version number on `release`) to trigger a rollout automatically.

The script download link on the [c:geo homepage](https://www.cgeo.org) as well as the update mechanism for the installed script directly targets the raw script on the `release` branch, which means after merging the changes to `release`, together with the required version number increase, users will see the update on the website and script hosts (e.g. Tampermonkey) will detect and notify users to update.
