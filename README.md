# Phoenix Grid

This Phoenix script is a custom implementation of Virtual Spaces on mac.
It creates virtual spaces without using the natives ones of MacOS.
This allows us to have **instant space switch** with **zero transition**.

#### Why
- Native mac spaces are slow to switch, animation is too long
- [Total-Space](https://totalspaces.binaryage.com/) is not supported anymore

#### No caveat
- **alt + tab** still works, it changes Virtual Spaces when switching app
- **App Exposé** and **Mission Control** works as expected, it shows only the current Virtual Space apps
- Fully configurable
- Does not need **System Integrity Protection** to be disabled
- Can be extended and customized by updating [phoenix-space-grid.js](phoenix-space-grid.js)

#### What is needed
- A Mac
- Git
- [Phoenix](https://github.com/kasper/phoenix/releases/) installed ( free )
- [Better Touch Tool](https://folivora.ai/) installed ( not free )
- Programming basics
- 4 fingers

> This is very beta and default settings are my own. Tweak it for your needs!

#### Usage
- This will create a 1 dimensional virtual spaces list.
- Each space will contain **top**, and **bottom** apps
- Switch space with 4 fingers swipe left / right
- Switch top app with 4 fingers swipe top
- Switch bottom app with 4 fingers swipe bottom

> This is not a real 2D grid on purpose, switching between apps is quicker like so

#### Todo
- [ ] Test with multiple screens setup
- [ ] Better code documentation
- [ ] Add config to place grid anywhere

---
## Setup

#### Install Phoenix
- [Download and install Phoenix](https://github.com/kasper/phoenix/releases/)
- [Download and install Better Touch Tool](https://folivora.ai/)

#### Install Phoenix Space Grid script
Run this command to download and install **phoenix-space-grid** with default config.
- This will **override** `~/.phoenix.js` file.
- Will be installed in `~/phoenix-space-grid`

```bash
git clone git@github.com:zouloux/phoenix-space-grid.git ~/phoenix-space-grid
cd ~/phoenix-space-grid
cp config.default.js config.js
rm ~/.phoenix.js
cp .phoenix.js ~/.phoenix.js
```

#### Better touch tool
To catch 4 finger swipes and forward them to Phoenix, install [those triggers](./exported_triggers.bttpreset).

#### Config your mac
- Disable all 4 fingers gestures in **System Settings > Trackpad > More gestures** 

#### Edit config
Now edit `~/phoenix-space-grid/config.js` and adapt to your needs, when finished, run `./restart-phoenix.sh`
You should receive a "Phoenix reloaded" notification.

> Please note that the first update can be slow if you have a lot of apps running.

#### Update

```bash
cd ~/phoenix-space-grid
git pull
./restart-phoenix.sh
```

---
## Dev

If you are brave enough to tweak this script.

#### Logs
When editing `~/phoenix-space-grid/phoenix-space-grid.js`
To check Phoenix logs, start `~/phoenix-space-grid/stream-logs.sh`.
It will only print outputs when using `log()` and `info()` functions.

#### Refreshing
If you update config or script, Phoenix will try to restart. Sometimes it create multiple instances of Modals, memory leak, and will eventually crash.
You can setup [this Raycast script](./restart-phoenix.sh) to restart Phoenix fully when working on config or script.

> If you do not have Raycast, simply run this script to restart Phoenix 

#### Other trials
I tried other workflow, see them in [old](./old).
- 2D grid ( like Total Space ) -> Too much time to go from a space to another, but worked well
- Radial alt-tab -> Very cool but never finished 
