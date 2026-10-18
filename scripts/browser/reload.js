// Reload userChrome.css (and its @import tree) from disk without restarting Firefox.
// Run by lib/reload.mjs (task reload, deploy and watch); also: task eval -- reload.js
;(async () => {
  const win =
    [...Services.wm.getEnumerator('navigator:browser')].find(
      (x) => !x.document.documentElement.hasAttribute('privatebrowsingmode'),
    ) || Services.wm.getMostRecentWindow('navigator:browser')
  const sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService)
  const root = InspectorUtils.getAllStyleSheets(win.document, false).find((s) =>
    /\/chrome\/userChrome\.css$/.test(s.href || ''),
  )
  if (!root) return 'userChrome.css not loaded'

  const report = []
  const reparse = async (sheet) => {
    const path = Services.io.newURI(sheet.href).QueryInterface(Ci.nsIFileURL).file.path
    const text = await IOUtils.readUTF8(path)
    InspectorUtils.parseStyleSheet(sheet, text)
    report.push(`${sheet.href.replace(/^.*\/chrome\//, '')} (${sheet.cssRules.length} rules)`)
    for (const rule of sheet.cssRules) {
      if (rule.type === 3 && rule.styleSheet) await reparse(rule.styleSheet)
    }
  }
  await reparse(root)

  // Reparsing does not invalidate the user origin; registering a throwaway user sheet does.
  const kick = Services.io.newURI(`data:text/css,/*reload ${Date.now()}*/`)
  sss.loadAndRegisterSheet(kick, sss.USER_SHEET)
  sss.unregisterSheet(kick, sss.USER_SHEET)

  return 'reloaded:\n  ' + report.join('\n  ')
})()
