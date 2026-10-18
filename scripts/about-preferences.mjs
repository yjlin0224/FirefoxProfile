// Writes about:preferences' settings, page by page, as user.js lines: reference/
// about-preferences.defaults.js (Firefox's default values) and about-preferences.current.js
// (the running Firefox's values, marking what's changed, locked or set by profile/user.js).
// Both files have the same lines in the same order, so they diff line by line; regenerate
// after a Firefox update and `git diff reference/` shows what the settings pages changed.
//
// The structure comes from browser/about-preferences.js (a temporary about:preferences tab):
// the pages' controls, plus the pref-holding dialogs their buttons open (fonts, colors, proxy,
// clear data, sync engines, site permission defaults), listed under the button.
//
// Usage: node scripts/about-preferences.mjs [--port N] [--from saved.json]
//   --from: render a dump saved earlier (scripts/out/about-preferences.json) without Firefox
import fs from 'node:fs'
import path from 'node:path'
import { browserScriptsDir, outDir, profile, repoDir, repoUserJs } from './lib/config.mjs'
import { Rdp, findRdpPort } from './lib/rdp.mjs'

const args = process.argv.slice(2)
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : '')
const referenceDir = path.join(repoDir, 'reference')
const dumpFile = path.join(outDir, 'about-preferences.json')

let data
if (opt('--from')) data = JSON.parse(fs.readFileSync(opt('--from'), 'utf8'))
else {
  const prof = profile()
  const port = await findRdpPort(prof.dir, { portOverride: opt('--port') })
  if (!port) {
    console.error(
      `No Browser Toolbox found for profile ${prof.name}: open it in that Firefox (Ctrl+Shift+Alt+I), or pass --port.`,
    )
    process.exit(3)
  }
  const rdp = await Rdp.connect(port, { timeout: 5000 })
  try {
    const code = fs.readFileSync(path.join(browserScriptsDir, 'about-preferences.js'), 'utf8')
    const res = await rdp.evaluate(code)
    if (res.error || !res.value.startsWith('{')) {
      console.error(res.error ?? res.value)
      process.exit(1)
    }
    data = JSON.parse(res.value)
  } finally {
    rdp.close()
  }
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(dumpFile, JSON.stringify(data, null, 2) + '\n')
}

// Controls that hold a value (buttons, links, message bars and lists don't)
const INPUTS = new Set([
  'moz-checkbox',
  'moz-toggle',
  'moz-radio-group',
  'moz-select',
  'moz-visual-picker',
  'moz-input-text',
  'moz-input-url',
  'moz-input-password',
  'moz-input-number',
  'moz-input-folder',
  // in the dialogs (XUL and HTML controls)
  'checkbox',
  'radiogroup',
  'menulist',
  'input',
  'textarea',
  'moz-input-color',
])
// Containers whose label is shown above their children
const CONTAINERS = new Set(['moz-fieldset', 'moz-box-group', 'moz-box-item', 'moz-card'])
const MAX_OPTIONS = 12 // longer lists (e.g. every language) aren't spelled out

const text = (key, fallback) => data.labels[key] ?? fallback ?? ''
const userJsPrefs = new Set(
  [...fs.readFileSync(repoUserJs, 'utf8').matchAll(/^\s*user_pref\(\s*"([^"]+)"/gm)].map(
    (m) => m[1],
  ),
)
const literal = (v) => (typeof v === 'string' ? JSON.stringify(v) : String(v))

// Panes in sidebar order, each followed by its sub-pages
const panes = new Map(data.panes.map((p) => [p.id, p]))
const ordered = []
const visit = (pane, trail) => {
  ordered.push({ pane, trail })
  for (const child of data.panes.filter((p) => p.parent === pane.id))
    visit(child, [...trail, text(child.label, child.id)])
}
for (const { category, label } of data.nav) {
  const pane = data.panes.find((p) => p.category === category && !p.parent)
  if (pane) visit(pane, [label])
}
const missing = data.panes.filter((p) => !ordered.some((o) => o.pane === p))
for (const pane of missing) visit(pane, [text(pane.label, pane.id)])

// Does the subtree hold anything to list? Controls that write prefs, and the ones that are
// known not to (with a note saying where their value lives); pickers that only feed another
// control (e.g. "add a language") are left out.
const listed = (item) =>
  ((INPUTS.has(item.control) || CONTAINERS.has(item.control)) && item.writes.length > 0) ||
  !!item.note
const hasListed = (item) =>
  listed(item) ||
  (item.dialog?.items ?? []).some(hasListed) ||
  (item.items ?? []).some(hasListed) ||
  (item.options ?? []).some((o) => o.items.some(hasListed))

function render(mode) {
  const out = []
  const where = new Map() // pref -> where it was first listed
  const { firefox } = data
  const current = mode === 'current'
  out.push(
    current
      ? '// about:preferences：每個設定項目對應的 pref 與「目前的值」'
      : '// about:preferences：每個設定項目對應的 pref 與預設值',
    `// Firefox ${firefox.displayVersion} (${firefox.buildID}), ${firefox.locale}, ${firefox.os}`,
    '// 由 `task prefs:dump` 從執行中的 Firefox 產生，不要手動修改。Firefox 更新後重新產生，',
    '// 再用 `git diff reference/` 看設定頁面改了什麼。',
    '//',
    '// 收錄設定頁面上的控制項，以及按鈕開啟的對話框裡有 pref 的部分（字型、色彩、Proxy、清除資料、',
    '// 同步項目、網站權限的「封鎖新請求」與自動播放）；例外清單、憑證、搜尋引擎等不是 pref，不收。',
    '// 依側邊欄順序排列，子頁面接在上層頁面後面；同一個 pref 只在第一次出現時列出。',
    '//   [隱藏]  目前在這台電腦上沒有顯示（條件不成立、平台不同或功能還沒開放）',
    '//   [換算]  頁面上的選項不等於 pref 的值：Firefox 會換算，或一次寫入好幾個 pref',
    '//   [反向]  勾選 = pref 為 false',
  )
  if (current)
    out.push(
      '//   頁面上：[換算]、[反向] 項目目前在頁面上的狀態',
      '//   行尾：已修改（和預設值不同）、user.js（profile/user.js 有設定）、鎖定',
      '// 對照預設值：about-preferences.defaults.js（同樣的行，可以直接 diff）',
    )
  else out.push('// 對照目前的值：about-preferences.current.js（同樣的行，可以直接 diff）')

  const prefLine = (name, optionText) => {
    const info = data.prefs[name] ?? { type: 'none', hasDefault: false, default: null }
    const value = current ? info.current : info.default
    const notes = []
    if (optionText) notes.push(optionText)
    if (current) {
      if (info.current !== info.default)
        notes.push(info.hasDefault ? `已修改，預設 ${literal(info.default)}` : '已修改，預設沒有值')
      if (userJsPrefs.has(name)) notes.push('user.js')
      if (info.locked) notes.push('鎖定')
    } else if (!info.hasDefault) notes.push('沒有預設值')
    if (current && (value === null || value === undefined)) notes.push('目前沒有值')
    const tail = notes.length ? ` // ${notes.join('；')}` : ''
    if (value === null || value === undefined) return `// user_pref("${name}", ?);${tail}`
    return `user_pref("${name}", ${literal(value)});${tail}`
  }

  const optionLabel = (item, value) => {
    const o = (item.options ?? []).find(
      (o) => o.value !== null && String(o.value) === String(value),
    )
    const label = o ? text(o.label, o.fallbackLabel) : ''
    return label === String(value) ? '' : label // e.g. font sizes: "16" says nothing new
  }
  const uiText = (item) => {
    const v = item.value
    if (v === null || v === undefined) return ''
    if (item.options?.some((o) => o.value !== null)) return optionLabel(item, v) || String(v)
    if (typeof v === 'boolean') return v ? '開' : '關'
    return JSON.stringify(v)
  }

  function item(node, indent, context, prefix, trail) {
    if (!hasListed(node)) return
    const own = text(node.label, node.fallbackLabel)
    const name = own || context
    const pad = '  '.repeat(indent)
    let childIndent = indent
    if (listed(node)) {
      const direct = !node.converts && node.writes.length === 1 && node.writes[0] === node.pref
      const marks = [
        node.hidden ? ' [隱藏]' : '',
        direct || !node.writes.length ? '' : ' [換算]',
        node.inverted ? ' [反向]' : '',
      ]
      let line = `// ${pad}${prefix}${name}${marks.join('')}`
      if (node.note) line += `：${node.note}`
      if (current && node.writes.length && (!direct || node.inverted) && uiText(node))
        line += `（頁面上：${uiText(node)}）`
      out.push(line)
      const options = (node.options ?? []).filter((o) => o.value !== null)
      if (node.writes.length && options.length && options.length <= MAX_OPTIONS)
        out.push(
          `// ${pad}  選項：` +
            options
              .map((o) => (direct ? `${literal(o.value)} ` : '') + text(o.label, o.fallbackLabel))
              .join(' | '),
        )
      // Prefs listed earlier: one line per place they were listed
      const earlier = Map.groupBy(
        node.writes.filter((p) => where.has(p)),
        (p) => where.get(p),
      )
      for (const [place, prefs] of earlier)
        out.push(`// ${pad}  見「${place}」：${prefs.join('、')}`)
      for (const pref of node.writes.filter((p) => !where.has(p))) {
        where.set(pref, [...trail, name].join(' › '))
        const info = data.prefs[pref]
        const value = current ? info?.current : info?.default
        out.push(prefLine(pref, direct ? optionLabel(node, value) : ''))
      }
      childIndent = indent + 1
    } else if (own && CONTAINERS.has(node.control)) {
      out.push(`// ${pad}${prefix}${own}`)
      childIndent = indent + 1
    }
    const childContext = own || context
    for (const o of node.options ?? []) {
      const option = text(o.label, o.fallbackLabel)
      for (const child of o.items)
        item(child, childIndent, childContext, option ? `${option} › ` : '', [...trail, name])
    }
    for (const child of node.items ?? [])
      item(child, childIndent, childContext, '', own ? [...trail, own] : trail)
    // A button's dialog: its controls, one level in
    if (node.dialog?.items.some(hasListed)) {
      const dialogName = `${name}（對話框）`
      out.push(`// ${pad}${prefix}${dialogName}${node.dialog.note ? `：${node.dialog.note}` : ''}`)
      for (const child of node.dialog.items)
        item(child, indent + 1, name, '', [...trail, dialogName])
    }
  }

  for (const { pane, trail } of ordered) {
    const anchor = pane.category.replace(/^pane/, '')
    const title = trail.join(' › ')
    out.push(
      '',
      '',
      `// ${'═'.repeat(76)}`,
      `// ${title} (about:preferences#${anchor[0].toLowerCase() + anchor.slice(1)})`,
      `// ${'═'.repeat(76)}`,
    )
    const groups = pane.groups.filter((g) => g.items.some(hasListed))
    if (pane.id === 'experimental')
      out.push(
        '// Firefox 實驗室的功能是 Nimbus 的選擇加入（enrollment），不是 pref，user.js 設不了。',
      )
    else if (!groups.length) out.push('// （沒有可以用 pref 設定的項目）')
    for (const g of groups) {
      // Some groups have no heading on the page (e.g. AI controls' list)
      const heading = text(g.label, '')
      out.push('')
      if (heading) out.push(`// ── ${heading}${g.hidden ? ' [隱藏]' : ''} ──`)
      for (const node of g.items)
        item(node, 0, heading || title, '', heading ? [title, heading] : [title])
    }
  }
  return out.join('\n') + '\n'
}

fs.mkdirSync(referenceDir, { recursive: true })
for (const mode of ['defaults', 'current']) {
  const file = path.join(referenceDir, `about-preferences.${mode}.js`)
  fs.writeFileSync(file, render(mode))
  console.log(`${path.relative(repoDir, file)}`)
}
for (const w of data.warnings ?? []) console.warn(`warning: ${w}`)
const counts = Object.values(data.prefs)
console.log(
  `${data.panes.length} pages, ${counts.length} prefs, ${counts.filter((p) => p.current !== p.default).length} changed from the default`,
)
