;(async () => {
  const win =
    [...Services.wm.getEnumerator('navigator:browser')].find(
      (x) => !x.document.documentElement.hasAttribute('privatebrowsingmode'),
    ) || Services.wm.getMostRecentWindow('navigator:browser')
  const doc = win.document
  const SCALE = 3,
    PAD = 50,
    TOP = 50
  const BG = win.matchMedia('(prefers-color-scheme: dark)').matches ? '#2b2a33' : '#f0f0f4'
  const R = (e) => e.getBoundingClientRect()
  const region = { x: 0, y: 0, w: 290, h: 120 }
  const snap = await win.browsingContext.currentWindowGlobal.drawSnapshot(
    new win.DOMRect(region.x, region.y, region.w, region.h),
    SCALE,
    BG,
  )
  const c = doc.createElementNS('http://www.w3.org/1999/xhtml', 'canvas')
  c.width = region.w * SCALE + PAD * 2
  c.height = region.h * SCALE + TOP + 40
  const g = c.getContext('2d')
  g.fillStyle = '#fff'
  g.fillRect(0, 0, c.width, c.height)
  g.drawImage(snap, PAD, TOP)
  const X = (x) => PAD + (x - region.x) * SCALE,
    Y = (y) => TOP + (y - region.y) * SCALE
  g.fillStyle = '#111'
  g.font = "bold 20px 'Noto Sans CJK TC', 'Microsoft JhengHei', sans-serif"
  g.fillText('工具列按鈕 ↔ 釘選分頁 對齊（放大 3 倍）  藍線 = 工具列按鈕左右邊界', PAD, 32)
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
  g.strokeStyle = 'rgba(30,110,255,0.9)'
  g.lineWidth = 1
  g.setLineDash([5, 4])
  for (const r of icons)
    for (const x of [r.x, r.right]) {
      g.beginPath()
      g.moveTo(X(x) + 0.5, TOP)
      g.lineTo(X(x) + 0.5, TOP + region.h * SCALE)
      g.stroke()
    }
  g.setLineDash([])
  // horizontal guide at the page area's top edge
  const top = R(doc.querySelector('.browserContainer')).y
  g.strokeStyle = 'rgba(255,45,85,0.9)'
  g.beginPath()
  g.moveTo(PAD, Y(top) + 0.5)
  g.lineTo(PAD + region.w * SCALE, Y(top) + 0.5)
  g.stroke()
  g.fillStyle = '#ff2d55'
  g.font = 'bold 15px sans-serif'
  g.fillText(`頁面區頂端 y=${top}`, X(260) - 40, Y(top) - 6)
  // 4px gap label between toolbar icon bottom and first pinned
  const pin = R(doc.querySelector('#pinned-tabs-container .tabbrowser-tab .tab-background'))
  g.fillStyle = '#ff2d55'
  g.fillText(
    `${pin.y - icons[0].bottom}px`,
    X(icons[0].right) + 8,
    Y((icons[0].bottom + pin.y) / 2) + 5,
  )
  const OUT = PathUtils.join(__OUT_DIR__, 'pinned-ruler.png')
  await IOUtils.write(
    OUT,
    Uint8Array.from(atob(c.toDataURL('image/png').split(',')[1]), (ch) => ch.charCodeAt(0)),
  )
  return OUT
})().catch((e) => 'ERROR: ' + e + ' | ' + e.stack)
