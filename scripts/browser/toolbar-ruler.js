// Snapshot the nav-bar and annotate the gaps between toolbar button hover areas.
;(async () => {
  const OUT = PathUtils.join(__OUT_DIR__, 'toolbar-ruler.png')
  const SCALE = 3,
    PAD_TOP = 70,
    PAD_SIDE = 36,
    STRIP_GAP = 40,
    TITLE_H = 60
  const win =
    [...Services.wm.getEnumerator('navigator:browser')].find(
      (x) => !x.document.documentElement.hasAttribute('privatebrowsingmode'),
    ) || Services.wm.getMostRecentWindow('navigator:browser')
  const doc = win.document
  const nav = doc.getElementById('nav-bar')
  const nb = nav.getBoundingClientRect()
  const BG = win.matchMedia('(prefers-color-scheme: dark)').matches ? '#2b2a33' : '#f0f0f4'

  // Hover background is painted on the icon / badge stack; urlbar uses its container box.
  const boxes = [...nav.querySelectorAll(':scope > *, #nav-bar-customization-target > *')]
    .filter(
      (e) =>
        e.getBoundingClientRect().width > 0 &&
        !['nav-bar-customization-target', 'vertical-spacer'].includes(e.id) &&
        e.localName !== 'hbox',
    )
    .map((e) => {
      const target =
        e.id === 'urlbar-container'
          ? e
          : e.querySelector('.toolbarbutton-badge-stack, .toolbarbutton-icon') || e
      const r = target.getBoundingClientRect()
      return {
        id: e.id,
        x: r.x,
        y: r.y,
        w: r.width,
        h: r.height,
        right: r.right,
        urlbar: e.id === 'urlbar-container',
      }
    })
    .sort((a, b) => a.x - b.x)
  const url = boxes.find((b) => b.urlbar)
  const last = boxes[boxes.length - 1]

  // Two strips: left side up to a bit of the urlbar, and right side from the end of the urlbar.
  const strips = [
    { x0: nb.x, x1: url.x + 60, label: '左側：邊界 → 選單按鈕 → … → 網址列' },
    { x0: url.right - 60, x1: last.right + 16, label: '右側：網址列 → … → 帳號按鈕' },
  ]

  const snap = async (x, y, w, h) => {
    try {
      return await win.browsingContext.currentWindowGlobal.drawSnapshot(
        new win.DOMRect(x, y, w, h),
        SCALE,
        BG,
      )
    } catch (e) {
      const c = doc.createElementNS('http://www.w3.org/1999/xhtml', 'canvas')
      c.width = w * SCALE
      c.height = h * SCALE
      const g = c.getContext('2d')
      g.scale(SCALE, SCALE)
      g.drawWindow(win, x, y, w, h, BG)
      return c
    }
  }

  const stripImgs = []
  for (const s of strips) stripImgs.push(await snap(s.x0, nb.y, s.x1 - s.x0, nb.height))
  const W = Math.max(...strips.map((s) => (s.x1 - s.x0) * SCALE)) + PAD_SIDE * 2
  const stripH = nb.height * SCALE + PAD_TOP + 30
  const H = TITLE_H + strips.length * stripH + (strips.length - 1) * STRIP_GAP + 20

  const canvas = doc.createElementNS('http://www.w3.org/1999/xhtml', 'canvas')
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#111'
  g.font = "bold 22px 'Noto Sans CJK TC', 'Microsoft JhengHei', sans-serif"
  g.fillText(
    `nav-bar 間距量測（放大 ${SCALE} 倍）  藍框 = 按鈕 hover 底色範圍　紅色 = 間距`,
    PAD_SIDE,
    38,
  )

  let oy = TITLE_H
  strips.forEach((s, i) => {
    const sx = (x) => PAD_SIDE + (x - s.x0) * SCALE
    const sy = (y) => oy + PAD_TOP + (y - nb.y) * SCALE
    g.fillStyle = '#444'
    g.font = "16px 'Noto Sans CJK TC', 'Microsoft JhengHei', sans-serif"
    g.fillText(s.label, PAD_SIDE, oy + 18)
    g.drawImage(stripImgs[i], PAD_SIDE, oy + PAD_TOP)
    g.strokeStyle = '#999'
    g.lineWidth = 1
    g.strokeRect(
      PAD_SIDE - 0.5,
      oy + PAD_TOP - 0.5,
      (s.x1 - s.x0) * SCALE + 1,
      nb.height * SCALE + 1,
    )

    // Clip annotations to the strip
    g.save()
    g.beginPath()
    g.rect(0, oy, (s.x1 - s.x0) * SCALE + PAD_SIDE * 2, stripH)
    g.clip()
    const visible = boxes.filter((b) => b.right > s.x0 && b.x < s.x1)
    for (const b of visible) {
      g.strokeStyle = 'rgba(30, 110, 255, 0.95)'
      g.lineWidth = 2
      g.setLineDash([6, 4])
      g.strokeRect(sx(b.x) + 1, sy(b.y) + 1, b.w * SCALE - 2, b.h * SCALE - 2)
      g.setLineDash([])
    }
    // Gaps: window edge -> first box (left strip only), then consecutive boxes
    const gaps = []
    if (i === 0) gaps.push({ a: nb.x, b: visible[0].x })
    for (let k = 1; k < visible.length; k++) gaps.push({ a: visible[k - 1].right, b: visible[k].x })
    const rulerY = oy + PAD_TOP - 14
    for (const { a, b } of gaps) {
      const xa = sx(a),
        xb = sx(b),
        px = Math.round((b - a) * 100) / 100
      g.fillStyle = 'rgba(230, 30, 50, 0.28)'
      g.fillRect(xa, oy + PAD_TOP, xb - xa, nb.height * SCALE)
      g.strokeStyle = '#e01e32'
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(xa, rulerY - 8)
      g.lineTo(xa, rulerY + 8)
      g.moveTo(xb, rulerY - 8)
      g.lineTo(xb, rulerY + 8)
      g.moveTo(xa, rulerY)
      g.lineTo(xb, rulerY)
      g.stroke()
      g.fillStyle = '#e01e32'
      g.font = 'bold 16px sans-serif'
      g.textAlign = 'center'
      g.fillText(`${px}px`, (xa + xb) / 2, rulerY - 12)
      g.textAlign = 'start'
    }
    g.restore()
    oy += stripH + STRIP_GAP
  })

  const data = canvas.toDataURL('image/png').split(',')[1]
  const bin = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
  await IOUtils.write(OUT, bin)
  return `wrote ${OUT} (${W}x${H}), boxes: ${boxes.map((b) => b.id).join(', ')}`
})()
