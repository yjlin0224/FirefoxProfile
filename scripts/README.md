# scripts

Everything here runs through `task` (see the repo's `Taskfile.yaml`); the `node`/`python`
commands below are what the tasks run.

## Layout

| Path | What |
| --- | --- |
| `deploy.mjs`, `watch.mjs`, `diff.mjs`, `reload.mjs` | Deploy the repo's `profile/` to the profile in `.env` and live-reload it |
| `rdp-eval.mjs`, `find-port.mjs` | Run JavaScript in the profile's Firefox; find its Browser Toolbox port |
| `mods-update.mjs`, `mods.json` | Re-download the vendored third-party mods in `profile/chrome/UserChromes/` |
| `wallpaper-open.mjs` | Open a saved wallpaper by number (or all of them in a folder): copies it to `out/wallpapers/` with the extension its bytes call for, since the library's files have none |
| `wallpaper-position.mjs` | List the new tab's saved wallpapers, or set one's position by renaming its file (Firefox closed): Firefox sets the position pref from the file name whenever a wallpaper is applied and at every startup |
| `about-preferences.mjs` | Write `reference/about-preferences.{defaults,current}.js`: about:preferences page by page, each setting with the prefs it writes and their default/current values, plus the pref-holding dialogs buttons open (structure read by `browser/about-preferences.js`) |
| `userjs-check.mjs` | Check `user.js` offline (syntax, duplicates, spacing) and against the running Firefox (type, current value, default) |
| `lib/` | Shared: `.env` and paths (`config.mjs`), the RDP client and port finder (`rdp.mjs`), deploy (`sync.mjs`), live reload (`reload.mjs`, `apply.mjs`), the new tab's wallpaper library (`wallpapers.mjs`) |
| `browser/` | Scripts that run **inside Firefox** (parent process, chrome privileges): measurements and `reload.js` |
| `host/` | Scripts that run on Windows: real screen captures, pixel dumps, real mouse clicks |
| `out/` | Their output (images, logs). Not committed |

## Talking to Firefox

The scripts run JavaScript in Firefox over the Remote Debugging Protocol (RDP) of the
Browser Toolbox.

1. `devtools.chrome.enabled` and `devtools.debugger.remote-enabled` = `true` (in `user.js`).
2. Open the Browser Toolbox (Ctrl+Shift+Alt+I) in the profile's Firefox. Its server port
   changes every time; the scripts find it by asking every port Firefox listens on for its
   profile folder (`lib/rdp.mjs`). To pin one: `FIREFOX_RDP_PORT` in `.env`, or `PORT=1234`
   on a task.
3. Each new connection asks for confirmation unless `devtools.debugger.prompt-connection`
   = `false`. Turning that off lets any local program take over the browser while the toolbox
   is open: turn it back on and close the toolbox when done. (While it asks, the scripts time
   out with a hint.)

`task eval -- <script or expression>` runs in the parent process. Options:
`--tab <url substring>` runs in that tab (page privileges); `--pid <os pid>` runs in a content
process with chrome privileges (`pid` = `browser.browsingContext.currentWindowGlobal.domProcess.osPid`;
there, `BrowsingContext` and `InspectorUtils` come from `Cu.getGlobalForObject(Services)`).
`__OUT_DIR__` in a script becomes the absolute path of `out/`.

## Live reload

`task watch` deploys on every save in `profile/` and reloads what changed:

- `userChrome.css` and its `@import`s: re-parsed from disk in the parent process
  (`browser/reload.js`), then a throwaway user sheet is registered to restyle.
- `userContent.css`: every process keeps its own parsed copy, so the new text is pushed into
  the parent and every content process (the new tab page, DevTools, web pages…).
- `user.js`: only read at startup; restart Firefox.

Added, changed **and removed** rules all take effect without restarting Firefox.

## Measurements (read-only)

`task eval -- <name>.js`:

| Script | Checks |
| --- | --- |
| `toolbar-ruler.js` | Image of the toolbar with every gap between button backgrounds labelled → `out/toolbar-ruler.png` |
| `pinned-ruler.js` | Image of the toolbar over the pinned tabs with alignment guides → `out/pinned-ruler.png` |
| `pinned-verify.js` | Pinned circles: size, x positions vs the toolbar icons, gaps, top vs the page area |
| `tabs-rows.js` | Walks the tab strip top to bottom: every background, its clickable area and the gaps (scrolls the list to the top and bottom, then back) |
| `hit-test.js` | Where the click target switches between two neighbouring tabs (Firefox's own hit testing), in every window |
| `window-mode.js` | Window geometry and windowed/maximized toolbar offsets |
| `split-panes2.js` | Split view pages: margins, gap, glow (needs a split view selected) |
| `about-preferences.js` | about:preferences' panes, groups and settings with the prefs each writes, labels and pref values, as JSON (for `task prefs:dump`; opens and closes a temporary background tab, and opens and cancels the dialogs listed in its `DIALOG_BUTTONS` there) |

## Measurements that change state temporarily (all restore it)

| Script | Does |
| --- | --- |
| `bottom-verify.js` | Collapses and re-expands the sidebar; checks the bottom buttons in both states |
| `density-test.js` | Switches `browser.uidensity` to compact and touch, measures, switches back |
| `hover-mode-audit.js` | In expand-on-hover mode: fakes the pointer over the sidebar (MousePosTracker) to measure the hover-expanded state, with images |
| `split-test.js` | Opens two `about:blank` tabs as a split view, measures it expanded and collapsed, closes them |
| `overflow-repro.js` | Switches to always-show and toggles the sidebar repeatedly, checking the 7th bottom button never turns into "more tools" |

## Real mouse clicks

`task click-test`: `browser/click-setup.js` picks two neighbouring tabs and writes the
physical screen points across their boundary to `out/click-points.json`;
`host/click-test.py` really clicks each point (Windows `SetCursorPos` / `mouse_event`) and asks
Firefox which tab got selected. Don't touch the mouse while it runs; it puts the cursor and
the selected tab back afterwards.

## Screen captures

Firefox's own snapshots (`drawSnapshot`) miss popups, the window frame and the Mica
backdrop, and don't draw `backdrop-filter`. `task capture -- <cssX> <cssY> <cssW> <cssH>
<devicePixelRatio> <out.png>` grabs the real screen (CSS coordinates are screen coordinates,
e.g. `mozInnerScreenX + x`); it captures whatever window is on top there.
`powershell -File host/dump-pixels.ps1 <png> <originX> <originY>` prints the luminance of
every pixel to read exact edges.
