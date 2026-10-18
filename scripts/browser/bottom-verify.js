;(async () => {
  const win =
    [...Services.wm.getEnumerator('navigator:browser')].find(
      (x) => !x.document.documentElement.hasAttribute('privatebrowsingmode'),
    ) || Services.wm.getMostRecentWindow('navigator:browser')
  const doc = win.document
  const sleep = (ms) => new Promise((r) => win.setTimeout(r, ms))
  const sm = doc.querySelector('sidebar-main'),
    sr = sm.shadowRoot
  const sc = doc.getElementById('sidebar-container')
  const measure = (label) => {
    const side = sc.getBoundingClientRect()
    const btns = [...sr.querySelectorAll('.tools-and-extensions > moz-button')]
      .map((m) => ({
        m,
        b: m.shadowRoot && m.shadowRoot.querySelector('.button-background'),
        g: m.parentNode.getBoundingClientRect(),
      }))
      .filter(({ b }) => b && b.getBoundingClientRect().width)
      .filter(({ b, g }) => {
        const r = b.getBoundingClientRect()
        return (
          r.x >= g.x - 0.5 &&
          r.right <= g.right + 0.5 &&
          r.y >= g.y - 0.5 &&
          r.bottom <= g.bottom + 0.5
        )
      })
      .map(({ m, b }) => {
        const r = b.getBoundingClientRect()
        const radius = win.getComputedStyle(b).borderTopLeftRadius
        return {
          more: m.classList.contains('more-tools-button'),
          x: +(r.x - side.x).toFixed(1),
          y: +(r.y - side.y).toFixed(1),
          w: r.width,
          h: r.height,
          right: +(r.right - side.x).toFixed(1),
          bottom: +(r.bottom - side.y).toFixed(1),
          radius,
        }
      })
    // Only buttons actually visible inside their (clipping) group
    const visible = btns.slice().sort((a, b) => a.y - b.y || a.x - b.x)
    const horiz = visible.length > 1 && visible[0].y === visible[1].y
    const gaps = visible
      .slice(1)
      .map((b, i) =>
        horiz ? +(b.x - visible[i].right).toFixed(1) : +(b.y - visible[i].bottom).toFixed(1),
      )
    const spl = sr.querySelector('#sidebar-tools-and-extensions-splitter').getBoundingClientRect()
    return {
      state: label,
      sidebarWidth: side.width,
      expanded: sm.hasAttribute('expanded'),
      buttons: visible.map(
        (b) => `${b.more ? '[more]' : ''}${b.x},${b.y} ${b.w}x${b.h} r=${b.radius}`,
      ),
      gaps,
      leftEdge: visible[0] && visible[0].x,
      rightEdge:
        visible.length && +(side.width - Math.max(...visible.map((b) => b.right))).toFixed(1),
      bottomEdge:
        visible.length && +(side.height - Math.max(...visible.map((b) => b.bottom))).toFixed(1),
      splitterToFirst:
        visible.length &&
        +(Math.min(...visible.map((b) => b.y)) - (spl.bottom - side.y)).toFixed(1),
      hiddenInOverflow:
        sr.querySelectorAll('.tools-and-extensions > moz-button').length - visible.length,
    }
  }
  const btn = doc.getElementById('sidebar-button')
  const out = [measure('expanded')]
  btn.doCommand()
  await sleep(1200)
  out.push(measure('collapsed'))
  btn.doCommand()
  await sleep(1200)
  out.push({ restored: sm.hasAttribute('expanded'), width: sc.getBoundingClientRect().width })
  return JSON.stringify(out, null, 1)
})().catch((e) => 'ERROR: ' + e + ' | ' + e.stack)
