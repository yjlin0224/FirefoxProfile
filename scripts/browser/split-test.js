;(async () => {
  const { PrivateBrowsingUtils } = ChromeUtils.importESModule(
    'resource://gre/modules/PrivateBrowsingUtils.sys.mjs',
  )
  const win = [...Services.wm.getEnumerator('navigator:browser')].find(
    (w) => !PrivateBrowsingUtils.isWindowPrivate(w),
  )
  const doc = win.document,
    gB = win.gBrowser
  const sleep = (ms) => new Promise((r) => win.setTimeout(r, ms))
  const DIR = __OUT_DIR__
  const BG = win.matchMedia('(prefers-color-scheme: dark)').matches ? '#2b2a33' : '#f0f0f4'
  const sm = doc.querySelector('sidebar-main'),
    sbBtn = doc.getElementById('sidebar-button')
  const startExpanded = sm.hasAttribute('expanded')
  const box = doc.getElementById('tabbrowser-arrowscrollbox'),
    sc = box.scrollbox
  const oldScroll = sc.scrollTop,
    oldSelected = gB.selectedTab
  const src = (ru) => {
    let r = ru
    while (r && !r.parentStyleSheet) r = r.parentRule
    return r && r.parentStyleSheet ? (r.parentStyleSheet.href || '').split('/').pop() : '?'
  }
  const sel = (ru) => {
    const a = []
    let r = ru
    while (r) {
      a.unshift(r.selectorText || (r.conditionText ? '@' + r.conditionText : ''))
      r = r.parentRule
    }
    return a.filter(Boolean).join(' ⟩ ').replace(/\s+/g, ' ').slice(0, 170)
  }
  const out = []
  let t1, t2
  try {
    const firstTab = box.querySelector(':scope > .tabbrowser-tab')
    t1 = gB.addTrustedTab('about:blank', { inBackground: true })
    t2 = gB.addTrustedTab('about:blank', { inBackground: true })
    gB.addTabSplitView([t1, t2], { insertBefore: firstTab })
    await sleep(800)
    const wrap = t1.closest('tab-split-view-wrapper')
    if (!wrap) throw new Error('no wrapper created')
    for (const t of [t1, t2]) InspectorUtils.addPseudoClassLock(t, ':hover')

    const measure = async (label) => {
      sc.scrollTo({ top: 0, behavior: 'instant' })
      await sleep(400)
      const side = doc.getElementById('sidebar-container').getBoundingClientRect()
      const rel = (r) =>
        `x=${(r.x - side.x).toFixed(1)}..${(r.right - side.x).toFixed(1)} y=${(r.y - side.y).toFixed(1)}..${(r.bottom - side.y).toFixed(1)} (${r.width.toFixed(1)}x${r.height.toFixed(1)})`
      const wr = wrap.getBoundingClientRect(),
        wc = win.getComputedStyle(wrap)
      const rows = [...box.children].filter(
        (e) => e.getBoundingClientRect().height > 0 && e.localName !== 'hbox',
      )
      const i = rows.indexOf(wrap)
      const vis = (e) =>
        (e.localName === 'tab-split-view-wrapper'
          ? e
          : e.matches('.tabbrowser-tab')
            ? e.querySelector('.tab-background')
            : e.querySelector('.tab-group-label-hover-highlight') || e
        ).getBoundingClientRect()
      out.push(
        `[${label}] wrapper ${rel(wr)} bg=${wc.backgroundColor} radius=${wc.borderTopLeftRadius} pad=${wc.padding} margin=${wc.margin} gap=${wc.rowGap} display=${wc.display}`,
      )
      for (const t of [t1, t2]) {
        const tc = win.getComputedStyle(t),
          st = win.getComputedStyle(t.querySelector('.tab-stack'))
        out.push(
          `   inner tab ${rel(t.getBoundingClientRect())} bg ${rel(t.querySelector('.tab-background').getBoundingClientRect())} pad=${tc.padding} margin=${tc.margin} border=${tc.borderTopWidth}/${tc.borderRightWidth}/${tc.borderBottomWidth}/${tc.borderLeftWidth} ${tc.borderBottomColor} | stack pad=${st.padding} border=${st.borderTopWidth}/${st.borderRightWidth}/${st.borderBottomWidth}/${st.borderLeftWidth}`,
        )
        for (const e of [t, t.querySelector('.tab-stack')])
          for (const ru of InspectorUtils.getMatchingCSSRules(e)) {
            const d = [...ru.style]
              .filter(
                (x) =>
                  /^border-(top|right|bottom|left|block|inline)/.test(x) && /width|style/.test(x),
              )
              .map((x) => `${x}: ${ru.style.getPropertyValue(x)}`)
            if (d.length)
              out.push(
                `       ${e === t ? 'tab' : 'stack'} ${src(ru)} | ${sel(ru)} | ${d.join('; ').slice(0, 200)}`,
              )
          }
      }
      const b1 = t1.querySelector('.tab-background').getBoundingClientRect(),
        b2 = t2.querySelector('.tab-background').getBoundingClientRect()
      out.push(
        `   inner: wrapper→tab1 bg left ${(b1.x - wr.x).toFixed(1)} top ${(b1.y - wr.y).toFixed(1)} | tab1→tab2 ${(b2.y - b1.bottom).toFixed(1)} (or ←→ ${(b2.x - b1.right).toFixed(1)}) | tab2→wrapper bottom ${(wr.bottom - b2.bottom).toFixed(1)} right ${(wr.right - Math.max(b1.right, b2.right)).toFixed(1)}`,
      )
      if (i > 0)
        out.push(
          `   above: ${rows[i - 1].localName}.${rows[i - 1].className.split(' ')[0]} → wrapper gap ${(wr.y - vis(rows[i - 1]).bottom).toFixed(1)}px`,
        )
      else
        out.push(
          `   above: (first in list) → wrapper top relative to tab list top ${(wr.y - box.getBoundingClientRect().y).toFixed(1)}px`,
        )
      if (rows[i + 1])
        out.push(
          `   below: ${rows[i + 1].localName}.${rows[i + 1].className.split(' ')[0]} gap ${(vis(rows[i + 1]).y - wr.bottom).toFixed(1)}px`,
        )
      const SCALE = 3,
        top = Math.max(side.y, wr.y - 50),
        h = wr.height + 100
      const img = await win.browsingContext.currentWindowGlobal.drawSnapshot(
        new win.DOMRect(side.x, top, side.width, h),
        SCALE,
        BG,
      )
      const cv = doc.createElementNS('http://www.w3.org/1999/xhtml', 'canvas')
      cv.width = side.width * SCALE
      cv.height = h * SCALE
      cv.getContext('2d').drawImage(img, 0, 0)
      await IOUtils.write(
        PathUtils.join(DIR, `split-${label}.png`),
        Uint8Array.from(atob(cv.toDataURL('image/png').split(',')[1]), (ch) => ch.charCodeAt(0)),
      )
    }

    if (!startExpanded) {
      sbBtn.doCommand()
      await sleep(1200)
    }
    await measure('expanded')
    out.push('   wrapper rules:')
    for (const ru of InspectorUtils.getMatchingCSSRules(wrap)) {
      const t = [...ru.style]
        .filter((p) => /margin|padding|gap|inset|width|grid|background|border-radius/.test(p))
        .map((p) => `${p}: ${ru.style.getPropertyValue(p)}`)
      if (t.length) out.push(`     ${src(ru)} | ${sel(ru)} | ${t.join('; ').slice(0, 230)}`)
    }
    out.push('   inner tab bg rules (margin):')
    for (const ru of InspectorUtils.getMatchingCSSRules(t1.querySelector('.tab-background'))) {
      const t = [...ru.style]
        .filter((p) => /margin/.test(p))
        .map((p) => `${p}: ${ru.style.getPropertyValue(p)}`)
      if (t.length) out.push(`     ${src(ru)} | ${sel(ru)} | ${t.join('; ').slice(0, 200)}`)
    }
    sbBtn.doCommand()
    await sleep(1200)
    await measure('collapsed')
    sbBtn.doCommand()
    await sleep(1200)
  } finally {
    for (const t of [t1, t2])
      if (t && !t.closing) {
        InspectorUtils.removePseudoClassLock(t, ':hover')
        gB.removeTab(t, { animate: false })
      }
    await sleep(500)
    if (sm.hasAttribute('expanded') !== startExpanded) {
      sbBtn.doCommand()
      await sleep(1200)
    }
    if (gB.selectedTab !== oldSelected && !oldSelected.closing) gB.selectedTab = oldSelected
    sc.scrollTo({ top: oldScroll, behavior: 'instant' })
  }
  out.push(
    `cleanup: my test tabs closed=${[t1, t2].every((t) => !t || t.closing || !t.isConnected)} split wrappers left=${doc.querySelectorAll('tab-split-view-wrapper').length} tabs=${gB.tabs.length} selected restored=${gB.selectedTab === oldSelected} sidebar restored=${sm.hasAttribute('expanded') === startExpanded}`,
  )
  return out.join('\n')
})().catch((e) => 'ERROR: ' + e + ' | ' + e.stack)
