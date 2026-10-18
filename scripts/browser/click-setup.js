;(async () => {
  const { PrivateBrowsingUtils } = ChromeUtils.importESModule(
    'resource://gre/modules/PrivateBrowsingUtils.sys.mjs',
  )
  const win = [...Services.wm.getEnumerator('navigator:browser')].find(
    (w) => !PrivateBrowsingUtils.isWindowPrivate(w),
  )
  const d = win.document,
    gB = win.gBrowser
  const side = d.getElementById('sidebar-container').getBoundingClientRect()
  const box = d.getElementById('tabbrowser-arrowscrollbox')
  const tabs = [...box.querySelectorAll(':scope > .tabbrowser-tab')].filter((t) => {
    const r = t.getBoundingClientRect()
    return r.y > side.y + 200 && r.bottom < side.bottom - 200
  })
  const A = tabs[0],
    B = tabs[1]
  const ba = A.querySelector('.tab-background').getBoundingClientRect(),
    bb = B.querySelector('.tab-background').getBoundingClientRect()
  const dpr = win.devicePixelRatio,
    sx = win.mozInnerScreenX,
    sy = win.mozInnerScreenY
  const x = ba.x + 80
  const points = []
  for (let y = ba.bottom - 2; y <= bb.y + 2.01; y += 0.5)
    points.push({
      css: +y.toFixed(1),
      rel:
        y < ba.bottom
          ? `A bg -${(ba.bottom - y).toFixed(1)}`
          : y < bb.y
            ? `gap +${(y - ba.bottom).toFixed(1)}`
            : `B bg +${(y - bb.y).toFixed(1)}`,
      px: Math.round((sx + x) * dpr),
      py: Math.round((sy + y) * dpr),
    })
  const info = {
    dpr,
    aIndex: gB.tabs.indexOf(A),
    bIndex: gB.tabs.indexOf(B),
    oldIndex: gB.tabs.indexOf(gB.selectedTab),
    aBg: [ba.y, ba.bottom],
    bBg: [bb.y, bb.bottom],
    points,
  }
  await IOUtils.writeUTF8(PathUtils.join(__OUT_DIR__, 'click-points.json'), JSON.stringify(info))
  return `A=${info.aIndex} bg ${ba.y}..${ba.bottom} | B=${info.bIndex} bg ${bb.y}..${bb.bottom} | ${points.length} points | old selected=${info.oldIndex}`
})()
