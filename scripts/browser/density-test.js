;(async () => {
  const { PrivateBrowsingUtils } = ChromeUtils.importESModule(
    'resource://gre/modules/PrivateBrowsingUtils.sys.mjs',
  )
  const win = [...Services.wm.getEnumerator('navigator:browser')].find(
    (w) => !PrivateBrowsingUtils.isWindowPrivate(w),
  )
  const doc = win.document,
    sleep = (ms) => new Promise((r) => win.setTimeout(r, ms))
  const box = doc.getElementById('tabbrowser-arrowscrollbox'),
    sc = box.scrollbox,
    oldScroll = sc.scrollTop
  const oldDensity = Services.prefs.getIntPref('browser.uidensity', 0)
  const R = (e) => e.getBoundingClientRect()
  const measure = (label) => {
    const side = R(doc.getElementById('sidebar-container')),
      nb = R(doc.getElementById('nav-bar'))
    const icons = [
      'PanelUI-menu-button',
      'back-button',
      'forward-button',
      'stop-reload-button',
      'alltabs-button',
      'firefox-view-button',
      'sidebar-button',
    ].map((id) =>
      R(doc.getElementById(id).querySelector('.toolbarbutton-icon, .toolbarbutton-badge-stack')),
    )
    const url = R(doc.getElementById('urlbar-container'))
    const pins = [...doc.querySelectorAll('#pinned-tabs-container .tabbrowser-tab .tab-background')]
      .map(R)
      .filter((r) => r.width)
      .sort((a, b) => a.y - b.y || a.x - b.x)
    const row1 = pins.filter((r) => Math.abs(r.y - pins[0].y) < 1)
    const tabs = [...box.querySelectorAll(':scope > .tabbrowser-tab')]
      .map((t) => R(t.querySelector('.tab-background')))
      .filter((r) => r.height && r.y > side.y && r.bottom < side.bottom)
      .slice(0, 4)
    const sr = doc.querySelector('sidebar-main').shadowRoot
    const btns = [...sr.querySelectorAll('.tools-and-extensions > moz-button')]
      .map((m) => ({ b: R(m.shadowRoot.querySelector('.button-background')), g: R(m.parentNode) }))
      .filter(({ b, g }) => b.width && b.x >= g.x - 0.5 && b.right <= g.right + 0.5)
      .map(({ b }) => b)
      .sort((a, b) => a.x - b.x)
    const gaps = (arr, horiz) =>
      arr.slice(1).map((r, i) => +(horiz ? r.x - arr[i].right : r.y - arr[i].bottom).toFixed(1))
    const fx = (r) => +(r.x - side.x).toFixed(1)
    return [
      `== ${label} (uidensity attr=${doc.documentElement.getAttribute('uidensity')})  nav-bar h=${nb.height}`,
      `toolbar icons: size=${icons[0].width}x${icons[0].height} x=${icons.map((r) => r.x).join(',')} gaps=${gaps(icons, true).join(',')} | urlbar x=${url.x} h=${url.height}`,
      `sidebar w=${side.width} | page top y=${R(doc.querySelector('.browserContainer')).y} | toolbar icon bottom y=${icons[0].bottom}`,
      `pinned: size=${pins[0] ? pins[0].width + 'x' + pins[0].height : '-'} per row=${row1.length} x=${row1.map(fx).join(',')} gaps=${gaps(row1, true).join(',')} | first pinned top vs page top=${pins[0] ? pins[0].y - R(doc.querySelector('.browserContainer')).y : '-'}`,
      `tabs: bg h=${tabs[0] ? tabs[0].height : '-'} x=${tabs[0] ? fx(tabs[0]) + '..' + +(tabs[0].right - side.x).toFixed(1) : '-'} vertical gaps=${gaps(tabs, false).join(',')}`,
      `bottom buttons: size=${btns[0] ? btns[0].width + 'x' + btns[0].height : '-'} x=${btns.map(fx).join(',')} gaps=${gaps(btns, true).join(',')} bottom edge=${btns[0] ? +(side.bottom - btns[0].bottom).toFixed(1) : '-'}`,
    ].join('\n')
  }
  const out = []
  try {
    sc.scrollTo({ top: 0, behavior: 'instant' })
    out.push(measure('normal (0)'))
    for (const [d, name] of [
      [1, 'compact (1)'],
      [2, 'touch (2)'],
    ]) {
      Services.prefs.setIntPref('browser.uidensity', d)
      await sleep(1500)
      out.push(measure(name))
    }
  } finally {
    Services.prefs.setIntPref('browser.uidensity', oldDensity)
    if (oldDensity === 0) Services.prefs.clearUserPref('browser.uidensity')
    await sleep(1000)
    sc.scrollTo({ top: oldScroll, behavior: 'instant' })
  }
  out.push(
    `restored browser.uidensity=${Services.prefs.getIntPref('browser.uidensity', 0)} (hasUserValue=${Services.prefs.prefHasUserValue('browser.uidensity')})`,
  )
  return out.join('\n')
})().catch((e) => 'ERROR: ' + e + ' | ' + e.stack)
