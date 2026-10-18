;(() => {
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
  for (const w of Services.wm.getEnumerator('navigator:browser')) {
    const d = w.document,
      root = d.documentElement
    const icon = d
      .getElementById('PanelUI-menu-button')
      .querySelector('.toolbarbutton-icon, .toolbarbutton-badge-stack')
      .getBoundingClientRect()
    const tb = d.getElementById('navigator-toolbox').getBoundingClientRect(),
      nb = d.getElementById('nav-bar').getBoundingClientRect()
    out.push(
      `== ${root.getAttribute('privatebrowsingmode') ? 'private' : 'main'} sizemode=${root.getAttribute('sizemode')} dpr=${w.devicePixelRatio} | screenX/Y=${w.screenX},${w.screenY} innerScreen=${w.mozInnerScreenX},${w.mozInnerScreenY} outer=${w.outerWidth}x${w.outerHeight} inner=${w.innerWidth}x${w.innerHeight}`,
    )
    out.push(
      `   menu icon (hover bg) x=${icon.x} y=${icon.y} | toolbox y=${tb.y} | nav-bar y=${nb.y} h=${nb.height} | root attrs: ${[
        ...root.attributes,
      ]
        .map((a) => a.name)
        .filter((n) =>
          /size|titlebar|tabsintitlebar|customtitlebar|chromemargin|inactive|maxim/i.test(n),
        )
        .map((n) => n + '=' + root.getAttribute(n))
        .join(' ')}`,
    )
    for (const el of [
      root,
      d.body,
      d.getElementById('navigator-toolbox'),
      d.getElementById('nav-bar'),
    ]) {
      if (!el) continue
      const c = w.getComputedStyle(el)
      out.push(
        `   ${el.localName}#${el.id}: border-top=${c.borderTopWidth} ${c.borderTopColor} margin-top=${c.marginTop} padding-top=${c.paddingTop} pad-left=${c.paddingLeft} border-left=${c.borderLeftWidth}`,
      )
      for (const ru of InspectorUtils.getMatchingCSSRules(el)) {
        const t = [...ru.style]
          .filter((p) =>
            /^(border-top|border-left|margin-top|padding-top|padding-left|border-inline-start|margin-block-start|padding-block-start)/.test(
              p,
            ),
          )
          .map((p) => `${p}: ${ru.style.getPropertyValue(p)}`)
        if (t.length && /sizemode|maxim|titlebar|normal/i.test(sel(ru)))
          out.push(`      ${src(ru)} | ${sel(ru)} | ${t.join('; ').slice(0, 160)}`)
      }
    }
  }
  return out.join('\n')
})()
