;(() => {
  const { PrivateBrowsingUtils } = ChromeUtils.importESModule(
    'resource://gre/modules/PrivateBrowsingUtils.sys.mjs',
  )
  const win = [...Services.wm.getEnumerator('navigator:browser')].find(
    (w) => !PrivateBrowsingUtils.isWindowPrivate(w),
  )
  const doc = win.document
  const tp = doc.getElementById('tabbrowser-tabpanels')
  if (!tp.hasAttribute('splitview')) return 'selected tab is not in a split view right now'
  const box = doc.getElementById('tabbrowser-tabbox').getBoundingClientRect()
  const panes = [...tp.querySelectorAll('.split-view-panel.split-view-panel-active')].sort(
    (a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x,
  )
  const sp = tp.querySelector('.split-view-splitter').getBoundingClientRect()
  const out = [`content area x=${box.x}..${box.right} y=${box.y}..${box.bottom}`]
  for (const p of panes) {
    const bc = p.querySelector('.browserContainer'),
      r = bc.getBoundingClientRect(),
      c = win.getComputedStyle(bc)
    out.push(
      `${p.classList.contains('deck-selected') ? 'selected ' : 'other    '} page x=${r.x}..${r.right} y=${r.y}..${r.bottom} | outline=${c.outlineStyle} ${c.outlineWidth} offset=${c.outlineOffset} ${c.outlineColor} | shadow=${c.boxShadow} | radius=${c.borderTopLeftRadius}`,
    )
  }
  const [a, b] = panes.map((p) => p.querySelector('.browserContainer').getBoundingClientRect())
  out.push(
    `edges: left ${a.x - box.x} | right ${box.right - b.right} | top ${a.y - box.y} / ${b.y - box.y} | bottom ${box.bottom - a.bottom} / ${box.bottom - b.bottom}`,
  )
  out.push(`gap between pages ${b.x - a.right} | splitter x=${sp.x}..${sp.right} (${sp.width}px)`)
  out.push(
    `screen: innerX=${win.mozInnerScreenX} innerY=${win.mozInnerScreenY} dpr=${win.devicePixelRatio}`,
  )
  return out.join('\n')
})()
