;(async () => {
  const { PrivateBrowsingUtils } = ChromeUtils.importESModule(
    'resource://gre/modules/PrivateBrowsingUtils.sys.mjs',
  )
  const win = [...Services.wm.getEnumerator('navigator:browser')].find(
    (w) => !PrivateBrowsingUtils.isWindowPrivate(w),
  )
  const doc = win.document,
    sleep = (ms) => new Promise((r) => win.setTimeout(r, ms))
  const M = win.MousePosTracker,
    SC = win.SidebarController
  const DIR = __OUT_DIR__
  const BG = win.matchMedia('(prefers-color-scheme: dark)').matches ? '#2b2a33' : '#f0f0f4'
  const sm = doc.querySelector('sidebar-main'),
    sr = sm.shadowRoot,
    container = doc.getElementById('sidebar-container')
  const box = doc.getElementById('tabbrowser-arrowscrollbox'),
    sc = box.scrollbox,
    oldScroll = sc.scrollTop
  const R = (e) => e.getBoundingClientRect()
  const measure = async (label) => {
    sc.scrollTo({ top: 0, behavior: 'instant' })
    await sleep(300)
    const side = R(sm),
      cont = R(container),
      fx = (r) => +(r.x - side.x).toFixed(1),
      fy = (r) => +(r.y - side.y).toFixed(1)
    const gaps = (arr, horiz) =>
      arr.slice(1).map((r, i) => +(horiz ? r.x - arr[i].right : r.y - arr[i].bottom).toFixed(1))
    const out = [
      `== ${label}: sidebar-main expanded=${sm.hasAttribute('expanded')} launcher-expanded=${container.hasAttribute('sidebar-launcher-expanded')} | sidebar-main x=${side.x}..${side.right} (w=${side.width}) | #sidebar-container w=${cont.width} style="${container.getAttribute('style')}" | page area x=${R(doc.querySelector('.browserContainer')).x}`,
    ]
    const pins = [...doc.querySelectorAll('#pinned-tabs-container .tabbrowser-tab .tab-background')]
      .map(R)
      .filter((r) => r.width)
      .sort((a, b) => a.y - b.y || a.x - b.x)
    const row1 = pins.filter((r) => Math.abs(r.y - pins[0].y) < 1)
    out.push(
      `pinned: ${pins.length} tabs, size=${pins[0].width.toFixed(1)}x${pins[0].height}, rows=${new Set(pins.map((r) => Math.round(r.y))).size}, first row x=${row1.map(fx).join(',')} | items-wrapper grid cols=${win.getComputedStyle(doc.getElementById('pinned-tabs-container').shadowRoot.querySelector('[part~=items-wrapper]')).gridTemplateColumns}`,
    )
    const psEl = doc.getElementById('vertical-pinned-tabs-splitter')
    const ps = psEl ? R(psEl) : { y: side.y, bottom: side.y, height: 0, x: side.x, right: side.x }
    out.push(
      `pinned splitter ${psEl ? '' : '(MISSING) '}y=${fy(ps)} h=${ps.height} x=${fx(ps)}..${+(ps.right - side.x).toFixed(1)} | last pinned bottom y=${fy({ y: pins[pins.length - 1].bottom })}`,
    )
    const tabs = [...box.querySelectorAll(':scope > .tabbrowser-tab')]
      .map((t) => R(t.querySelector('.tab-background')))
      .filter((r) => r.height && r.y > ps.bottom)
      .slice(0, 3)
    out.push(
      `tabs: bg x=${tabs[0] ? fx(tabs[0]) + '..' + +(tabs[0].right - side.x).toFixed(1) : '-'} first y=${tabs[0] ? fy(tabs[0]) : '-'} gaps=${gaps(tabs, false).join(',')}`,
    )
    const divEl = sr.querySelector('#sidebar-tools-and-extensions-splitter')
    const div = divEl ? R(divEl) : { y: NaN, x: NaN, right: NaN }
    const wr = sr.querySelector('.buttons-wrapper'),
      wrc = win.getComputedStyle(wr)
    out.push(
      `bottom divider ${divEl ? '' : '(NOT IN DOM) '}y=${fy(div)} x=${fx(div)}..${+(div.right - side.x).toFixed(1)} | buttons-wrapper y=${fy(R(wr))} h=${R(wr).height} display=${wrc.display} dir=${wrc.flexDirection} pad=${wrc.padding} style="${wr.getAttribute('style')}"`,
    )
    for (const g of sr.querySelectorAll('.buttons-wrapper > .tools-and-extensions')) {
      const gc = win.getComputedStyle(g),
        gr = R(g)
      const btns = [...g.querySelectorAll(':scope > moz-button')]
        .map((m) => R(m.shadowRoot.querySelector('.button-background')))
        .filter(
          (b) =>
            b.width &&
            b.x >= gr.x - 0.5 &&
            b.right <= gr.right + 0.5 &&
            b.y >= gr.y - 0.5 &&
            b.bottom <= gr.bottom + 0.5,
        )
      out.push(
        `   group ${g.classList.contains('overflow-button') ? '[more]' : '[tools]'} orientation=${g.getAttribute('orientation')} overflowing=${g.getAttribute('overflowing')} x=${fx(gr)}..${+(gr.right - side.x).toFixed(1)} y=${fy(gr)} h=${gr.height} display=${gc.display} dir=${gc.flexDirection} gap=${gc.rowGap}/${gc.columnGap} pad=${gc.padding} | ${btns.length} visible: ${btns.map((b) => `${fx(b)},${fy(b)}`).join(' ')} size=${btns[0] ? btns[0].width + 'x' + btns[0].height : '-'}`,
      )
    }
    const SCALE = 2,
      w = Math.max(side.width, 60) + 10,
      h = side.height
    const img = await win.browsingContext.currentWindowGlobal.drawSnapshot(
      new win.DOMRect(side.x, side.y, w, h),
      SCALE,
      BG,
    )
    const cv = doc.createElementNS('http://www.w3.org/1999/xhtml', 'canvas')
    cv.width = w * SCALE
    cv.height = h * SCALE
    cv.getContext('2d').drawImage(img, 0, 0)
    await IOUtils.write(
      PathUtils.join(DIR, `hovermode-${label}.png`),
      Uint8Array.from(atob(cv.toDataURL('image/png').split(',')[1]), (ch) => ch.charCodeAt(0)),
    )
    return out.join('\n')
  }
  const res = [`sidebar.visibility=${Services.prefs.getStringPref('sidebar.visibility')}`]
  const ox = M._x,
    oy = M._y
  try {
    res.push(await measure('collapsed'))
    const r = R(sm)
    M._x = r.x + 10
    M._y = r.y + 200
    M._callListener(SC)
    await sleep(1800)
    res.push(await measure('expanded'))
  } finally {
    M._x = ox
    M._y = oy
    M._callListener(SC)
    SC._reconcileHoverState && SC._reconcileHoverState()
    await sleep(1500)
    sc.scrollTo({ top: oldScroll, behavior: 'instant' })
  }
  res.push(`restored: launcher expanded=${SC._state && SC._state.launcherExpanded}`)
  await IOUtils.writeUTF8(PathUtils.join(DIR, 'hovermode.txt'), res.join('\n'))
  return 'ok'
})().catch((e) => 'ERROR: ' + e + ' | ' + e.stack)
