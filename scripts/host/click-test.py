# Real OS-level clicks across the boundary of two tabs; after each click ask Firefox (RDP)
# which tab got selected. Restores the cursor position and the originally selected tab.
# Run `task eval -- click-setup.js` first (it writes scripts/out/click-points.json).
# Usage: python -I scripts/host/click-test.py   (or `task click-test`)
import ctypes, json, os, subprocess, sys, time
from ctypes import wintypes

SCRIPTS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(SCRIPTS, "out")
user32 = ctypes.windll.user32
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(2)  # per-monitor DPI aware: physical pixels
except Exception:
    user32.SetProcessDPIAware()

def rdp(script, text=False):
    args = ["node", os.path.join(SCRIPTS, "rdp-eval.mjs"), script]
    return subprocess.run(args, capture_output=True, text=True, timeout=60).stdout.strip()

info = json.load(open(os.path.join(OUT, "click-points.json"), encoding="utf-8"))
pt = wintypes.POINT(); user32.GetCursorPos(ctypes.byref(pt))
orig = (pt.x, pt.y)
MOUSEEVENTF_LEFTDOWN, MOUSEEVENTF_LEFTUP = 0x0002, 0x0004
rows = []
try:
    for p in info["points"]:
        user32.SetCursorPos(p["px"], p["py"])
        time.sleep(0.12)
        user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
        time.sleep(0.04)
        user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
        time.sleep(0.25)
        sel = rdp("click-query.js")
        who = "A" if sel == str(info["aIndex"]) else "B" if sel == str(info["bIndex"]) else f"other({sel})"
        rows.append((p["css"], p["rel"], who))
finally:
    user32.SetCursorPos(*orig)
    restore = os.path.join(OUT, "click-restore.js")
    open(restore, "w").write(
        "(() => { const { PrivateBrowsingUtils } = ChromeUtils.importESModule('resource://gre/modules/PrivateBrowsingUtils.sys.mjs');"
        " const w = [...Services.wm.getEnumerator('navigator:browser')].find((x) => !PrivateBrowsingUtils.isWindowPrivate(x));"
        f" w.gBrowser.selectedTab = w.gBrowser.tabs[{info['oldIndex']}]; return 'restored ' + w.gBrowser.tabs.indexOf(w.gBrowser.selectedTab); }})()")
    print(rdp(restore))
print(f"A bg y={info['aBg']}  B bg y={info['bBg']}  (CSS px; each click hits the middle of a 0.5px row)")
for css, rel, who in rows:
    print(f"  y={css:7.1f}  {rel:14s} -> {who}")
