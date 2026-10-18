;(() => {
  const { PrivateBrowsingUtils } = ChromeUtils.importESModule(
    'resource://gre/modules/PrivateBrowsingUtils.sys.mjs',
  )
  const w = [...Services.wm.getEnumerator('navigator:browser')].find(
    (x) => !PrivateBrowsingUtils.isWindowPrivate(x),
  )
  return String(w.gBrowser.tabs.indexOf(w.gBrowser.selectedTab))
})()
