// Walk the vertical tab strip top to bottom and report every visual box and the gaps between them.
;(async () => {
  const win =
    [...Services.wm.getEnumerator('navigator:browser')].find(
      (x) => !x.document.documentElement.hasAttribute('privatebrowsingmode'),
    ) || Services.wm.getMostRecentWindow('navigator:browser')
  const doc = win.document
  const sleep = (ms) => new Promise((r) => win.setTimeout(r, ms))
  const side = doc.getElementById('sidebar-container').getBoundingClientRect()
  const box = doc.getElementById('tabbrowser-arrowscrollbox')
  const scroller = box.scrollbox || box.shadowRoot.querySelector('[part~=scrollbox]')
  const oldScroll = scroller.scrollTop
  scroller.scrollTo({ top: 0, behavior: 'instant' })
  await sleep(300)
  const rel = (r) => ({
    x: +(r.x - side.x).toFixed(1),
    y: +(r.y - side.y).toFixed(1),
    r: +(r.right - side.x).toFixed(1),
    b: +(r.bottom - side.y).toFixed(1),
  })
  const items = []
  const add = (kind, el, hit) => {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return
    const h = hit ? hit.getBoundingClientRect() : null
    items.push({ kind, ...rel(r), hit: h ? rel(h) : null })
  }
  for (const t of doc.querySelectorAll('#pinned-tabs-container .tabbrowser-tab'))
    add('pinned', t.querySelector('.tab-background'), t)
  const ps = doc.getElementById('vertical-pinned-tabs-splitter')
  if (ps) add('pinned-splitter', ps)
  const walk = (parent) => {
    for (const el of parent.children) {
      if (el.matches('.tabbrowser-tab'))
        add(
          el.closest('tab-group') ? 'grouped-tab' : 'tab',
          el.querySelector('.tab-background'),
          el,
        )
      else if (el.localName === 'tab-group') {
        const lc = el.querySelector('.tab-group-label-container'),
          lbl = el.querySelector('.tab-group-label')
        const hl = el.querySelector('.tab-group-label-hover-highlight')
        if (hl) add(`group-label${el.collapsed ? '(collapsed)' : ''}`, hl, lc)
        walk(el)
        const oc = el.querySelector('.tab-group-overflow-count')
        if (oc) add('group-overflow-count', oc)
      } else if (el.localName === 'tab-split-view-wrapper') {
        add('split-view', el)
      }
    }
  }
  walk(box)
  const nt = doc.getElementById('vertical-tabs-newtab-button')
  if (nt) add('newtab-button', nt)
  const visible = items.filter((i) => i.b > 0 && i.y < side.height)
  // rows = items sharing the same y (pinned grid rows)
  const lines = []
  let prev = null
  for (const i of visible) {
    const gap = prev ? +(i.y - prev.b).toFixed(1) : null
    const sameRow = prev && Math.abs(i.y - prev.y) < 0.5
    lines.push(
      `${i.kind.padEnd(22)} x=${i.x}..${i.r} y=${i.y}..${i.b}` +
        (i.hit ? `  hit y=${i.hit.y}..${i.hit.b} x=${i.hit.x}..${i.hit.r}` : '') +
        (sameRow
          ? `  ←→ ${+(i.x - prev.r).toFixed(1)}px`
          : gap !== null
            ? `  ↕ ${gap}px`
            : `  (top edge ${i.y}px)`),
    )
    prev = sameRow ? { ...i } : i
  }
  scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'instant' })
  await sleep(300)
  const tail = []
  const lastTabs = [...box.querySelectorAll(':scope > .tabbrowser-tab:not([hidden])')]
    .slice(-2)
    .map((x) => x.querySelector('.tab-background').getBoundingClientRect())
  const ntb = doc.getElementById('vertical-tabs-newtab-button').getBoundingClientRect()
  const div = doc
    .querySelector('sidebar-main')
    .shadowRoot.querySelector('#sidebar-tools-and-extensions-splitter')
    .getBoundingClientRect()
  tail.push(
    `last tab bg y=${(lastTabs[1].y - side.y).toFixed(1)}..${(lastTabs[1].bottom - side.y).toFixed(1)}  ↕ ${(lastTabs[1].y - lastTabs[0].bottom).toFixed(1)}px from previous`,
  )
  tail.push(
    `newtab button y=${(ntb.y - side.y).toFixed(1)}..${(ntb.bottom - side.y).toFixed(1)} x=${ntb.x - side.x}..${ntb.right - side.x}  ↕ ${(ntb.y - lastTabs[1].bottom).toFixed(1)}px from last tab bg`,
  )
  tail.push(
    `bottom divider y=${(div.y - side.y).toFixed(1)}  ↕ ${(div.y - ntb.bottom).toFixed(1)}px from newtab button`,
  )
  scroller.scrollTo({ top: oldScroll, behavior: 'instant' })
  const vars = [
    '--tab-margin-inline-inner',
    '--tab-margin-block',
    '--tab-padding-block-start',
    '--tab-padding-block-end',
    '--tab-height-with-margin-padding',
  ]
    .map(
      (v) =>
        v +
        '=' +
        win
          .getComputedStyle(doc.querySelector('#tabbrowser-arrowscrollbox .tabbrowser-tab'))
          .getPropertyValue(v)
          .trim(),
    )
    .join(' | ')
  const pc = doc.getElementById('pinned-tabs-container')
  const pcs = win.getComputedStyle(pc)
  const pinnedInfo = `pinned container: style=${JSON.stringify(pc.getAttribute('style'))} h=${pc.getBoundingClientRect().height} computed height=${pcs.height} min=${pcs.minHeight} max=${pcs.maxHeight} flex=${pcs.flex}`
  return (
    vars +
    '\n' +
    pinnedInfo +
    '\n' +
    lines.slice(0, 40).join('\n') +
    (lines.length > 40 ? `\n… ${lines.length - 40} more` : '') +
    '\n== tail (scrolled to end)\n' +
    tail.join('\n')
  )
})().catch((e) => 'ERROR: ' + e + ' | ' + e.stack)
