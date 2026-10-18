;(() => {
  const { PrivateBrowsingUtils } = ChromeUtils.importESModule(
    'resource://gre/modules/PrivateBrowsingUtils.sys.mjs',
  )
  const out = []
  for (const win of Services.wm.getEnumerator('navigator:browser')) {
    const d = win.document,
      priv = PrivateBrowsingUtils.isWindowPrivate(win)
    const side = d.getElementById('sidebar-container').getBoundingClientRect()
    const owner = (e) => e.closest && e.closest('.tabbrowser-tab, .tab-group-label-container')
    const test = (label, items, visOf) => {
      const vis = items
        .map((e) => ({ e, r: visOf(e).getBoundingClientRect() }))
        .filter(({ r }) => r.height && r.y > side.y + 2 && r.bottom < side.bottom - 60)
      const A = vis[0]
      if (!A) return out.push(`  ${label}: none visible`)
      const B = vis.find((v) => v.r.y > A.r.bottom + 1 && Math.abs(v.r.x - A.r.x) < 1)
      if (!B) return out.push(`  ${label}: no neighbour below`)
      const x = A.r.x + Math.min(10, A.r.width / 2)
      let lastA = null,
        firstB = null
      for (let y = A.r.bottom - 1; y <= B.r.y + 1; y += 0.5) {
        const o = d.elementsFromPoint(x, y).map(owner).find(Boolean)
        if (o === A.e) lastA = y
        if (o === B.e && firstB === null) firstB = y
      }
      out.push(
        `  ${label}: gap ${A.r.bottom}..${B.r.y} | upper item clickable ${lastA !== null ? (lastA + 0.5 - A.r.bottom).toFixed(1) : '?'}px below its bg | lower item clickable ${firstB !== null ? (B.r.y - firstB).toFixed(1) : '?'}px above its bg`,
      )
    }
    out.push(
      `window private=${priv} sidebar w=${side.width} expanded=${d.querySelector('sidebar-main').hasAttribute('expanded')}`,
    )
    const box = d.getElementById('tabbrowser-arrowscrollbox')
    test('tabs', [...box.querySelectorAll(':scope > .tabbrowser-tab')], (t) =>
      t.querySelector('.tab-background'),
    )
    test('pinned', [...d.querySelectorAll('#pinned-tabs-container .tabbrowser-tab')], (t) =>
      t.querySelector('.tab-background'),
    )
  }
  return out.join('\n')
})()
