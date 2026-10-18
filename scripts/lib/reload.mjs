// Live reload of the deployed stylesheets in the running Firefox, without a restart.
// Both read the profile's copy (deploy first).
import fs from 'node:fs'
import path from 'node:path'
import { browserScriptsDir } from './config.mjs'
import { Rdp } from './rdp.mjs'

// userChrome.css and its @imports: re-parsed from disk in the parent process
// (browser/reload.js), then a throwaway user sheet is registered to restyle.
export async function reloadChrome(port) {
  const rdp = await Rdp.connect(port, { timeout: 5000 })
  try {
    const res = await rdp.evaluate(
      fs.readFileSync(path.join(browserScriptsDir, 'reload.js'), 'utf8'),
    )
    return res.error ?? res.value.split('\n')[0]
  } finally {
    rdp.close()
  }
}

// userContent.css: every process keeps its own parsed copy (one sheet object shared by all of
// its documents), so the new text is pushed into each one and re-parsed there.
export async function reloadContent(port, cssFile) {
  const css = fs.readFileSync(cssFile, 'utf8')
  const rdp = await Rdp.connect(port, { timeout: 5000 })
  try {
    // Every <browser> and <iframe> (tabs, the preloaded new tab, sidebars, docked DevTools…) of
    // every window, by process. Only documents that already exist are touched: the parent's
    // copy is reloaded only while some parent-process page (DevTools, about:config…) is open.
    // Don't create a document just for this: a windowless about:blank built by hand crashed the
    // whole browser (MOZ_RELEASE_ASSERT VerifyPartitionedPrincipalMatchesDocumentPrincipal).
    const layout = await rdp.evaluate(`(() => {
      const byPid = {};
      for (const w of Services.wm.getEnumerator("navigator:browser"))
        for (const b of w.document.querySelectorAll("browser, iframe")) {
          const bc = b.browsingContext, wg = bc?.currentWindowGlobal;
          if (!wg) continue;
          const pid = wg.isInProcess ? 0 : wg.domProcess?.osPid;
          if (pid == null) continue;
          (byPid[pid] ??= []).push(bc.id);
          // in-process frames inside it (the DevTools panels live in the toolbox frame)
          if (pid === 0) for (const c of bc.getAllBrowsingContextsInSubtree()) if (c !== bc && c.currentWindowGlobal?.isInProcess) byPid[0].push(c.id);
        }
      return JSON.stringify(byPid);
    })()`)
    if (layout.error) return layout.error

    // In each process: re-parse the sheet of the given documents, then register and
    // unregister a throwaway user sheet, which makes the process restyle its documents.
    const reparse = (ids) => `(() => {
      const g = Cu.getGlobalForObject(Services);
      const done = new Set();
      for (const id of ${JSON.stringify(ids)}) {
        const doc = g.BrowsingContext.get(id)?.window?.document;
        if (!doc) continue;
        const sheet = g.InspectorUtils.getAllStyleSheets(doc, false).find((s) => /\\/chrome\\/userContent\\.css$/.test(s.href || ""));
        if (sheet && !done.has(sheet)) { g.InspectorUtils.parseStyleSheet(sheet, ${JSON.stringify(css)}); done.add(sheet); }
      }
      if (!done.size) return "no userContent.css in this process";
      const sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
      const kick = Services.io.newURI("data:text/css,/*reload " + Date.now() + "*/");
      sss.loadAndRegisterSheet(kick, sss.USER_SHEET);
      sss.unregisterSheet(kick, sss.USER_SHEET);
      return "ok";
    })()`

    const report = []
    for (const [pid, ids] of Object.entries(JSON.parse(layout.value))) {
      const res = await rdp.evaluate(reparse(ids), { pid: Number(pid) })
      report.push(`${Number(pid) === 0 ? 'parent' : pid}: ${res.error ?? res.value}`)
    }
    const ok = report.filter((r) => /: ok$/.test(r)).length
    const failed = report.filter((r) => !/: ok$/.test(r) && !/no userContent/.test(r))
    return (
      `userContent.css reloaded in ${ok}/${report.length} processes` +
      (failed.length ? `; problems:\n  ${failed.join('\n  ')}` : '')
    )
  } finally {
    rdp.close()
  }
}
