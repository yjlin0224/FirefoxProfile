;(() => {
  const win =
    [...Services.wm.getEnumerator('navigator:browser')].find(
      (x) => !x.document.documentElement.hasAttribute('privatebrowsingmode'),
    ) || Services.wm.getMostRecentWindow('navigator:browser')
  const doc = win.document
  const R = (e) => e.getBoundingClientRect()
  const content = R(doc.querySelector('.browserContainer'))
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
  const pins = [...doc.querySelectorAll('#pinned-tabs-container .tabbrowser-tab')].map((t) => {
    const bg = t.querySelector('.tab-background'),
      icon = t.querySelector('.tab-icon-image, .tab-icon-stack')
    const b = R(bg),
      h = R(t),
      i = icon && R(icon)
    return { b, h, i, radius: win.getComputedStyle(bg).borderTopLeftRadius }
  })
  const rows = [...new Set(pins.map((p) => Math.round(p.b.y)))]
  const out = [
    `page area top y=${content.y} | toolbar icon bottom y=${icons[0].bottom}`,
    `toolbar icons x: ${icons.map((r) => `${r.x}-${r.right}`).join('  ')}`,
    `pinned rows: ${rows.length}, per row: ${rows.map((y) => pins.filter((p) => Math.round(p.b.y) === y).length).join('/')}`,
  ]
  rows.forEach((y, k) => {
    const row = pins.filter((p) => Math.round(p.b.y) === y)
    const gaps = row.slice(1).map((p, j) => +(p.b.x - row[j].b.right).toFixed(1))
    out.push(
      `row ${k + 1}: y=${row[0].b.y}..${row[0].b.bottom}  bg x: ${row.map((p) => `${p.b.x}-${p.b.right} (${p.b.width}x${p.b.height})`).join('  ')}  gaps=${gaps.join(',')}`,
    )
    out.push(
      `        hit x: ${row.map((p) => `${p.h.x}-${p.h.right}`).join('  ')}  hit y=${row[0].h.y}..${row[0].h.bottom}`,
    )
    out.push(
      `        favicon centre offset: ${row.map((p) => (p.i ? `${+(p.i.x + p.i.width / 2 - (p.b.x + p.b.width / 2)).toFixed(1)},${+(p.i.y + p.i.height / 2 - (p.b.y + p.b.height / 2)).toFixed(1)}` : '-')).join('  ')}  radius=${row[0].radius}`,
    )
  })
  const lastPin = pins[pins.length - 1].b
  const firstTab = [
    ...doc.querySelectorAll(
      '#tabbrowser-arrowscrollbox > .tabbrowser-tab, #tabbrowser-arrowscrollbox > tab-group',
    ),
  ][0]
  const ft = R(firstTab.querySelector('.tab-background, .tab-group-label-hover-highlight'))
  out.push(
    `first row top vs page top: ${pins[0].b.y - content.y}px | toolbar icon bottom → first pinned: ${pins[0].b.y - icons[0].bottom}px | last pinned → first tab: ${ft.y - lastPin.bottom}px (first tab may be scrolled)`,
  )
  return out.join('\n')
})()
