// Evaluates JavaScript in the profile's running Firefox over the Browser Toolbox's RDP server:
// in the parent (chrome) process by default, in a tab with --tab <url substring> (page
// privileges), or in a content process with --pid <os pid> (chrome privileges; there,
// `BrowsingContext` and `InspectorUtils` come from `Cu.getGlobalForObject(Services)`).
//
// Usage: node scripts/rdp-eval.mjs [--port N] [--tab URL] [--pid PID] [--raw] <file.js | expression>
//   A file name is looked up as given, then in scripts/browser/. `__OUT_DIR__` in the code
//   becomes the absolute path of scripts/out/ (as a string literal), where scripts write images.
import fs from 'node:fs'
import path from 'node:path'
import { browserScriptsDir, outDir, profile } from './lib/config.mjs'
import { Rdp, findRdpPort } from './lib/rdp.mjs'

const args = process.argv.slice(2)
const opts = {
  port: '',
  tab: process.env.RDP_TAB || null,
  pid: process.env.RDP_PROCESS || 0,
  raw: !!process.env.RDP_RAW,
}
const rest = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port') opts.port = args[++i]
  else if (args[i] === '--tab') opts.tab = args[++i]
  else if (args[i] === '--pid') opts.pid = args[++i]
  else if (args[i] === '--raw') opts.raw = true
  else rest.push(args[i])
}
const arg = rest.join(' ')
if (!arg) {
  console.error(
    'usage: node scripts/rdp-eval.mjs [--port N] [--tab URL] [--pid PID] [--raw] <file.js | expression>',
  )
  process.exit(2)
}

const file = [arg, path.join(browserScriptsDir, arg)].find(
  (f) => /\.m?js$/.test(f) && fs.existsSync(f),
)
let code = file ? fs.readFileSync(file, 'utf8') : arg
if (code.includes('__OUT_DIR__')) {
  fs.mkdirSync(outDir, { recursive: true })
  code = code.replaceAll('__OUT_DIR__', JSON.stringify(outDir))
}

const prof = profile()
const port = await findRdpPort(prof.dir, { portOverride: opts.port })
if (!port) {
  console.error(
    `No Browser Toolbox found for profile ${prof.name}: open it in that Firefox (Ctrl+Shift+Alt+I), or pass --port.`,
  )
  process.exit(3)
}

const rdp = await Rdp.connect(port, { timeout: 5000 })
try {
  const res = await rdp.evaluate(code, { pid: opts.pid, tab: opts.tab })
  if (opts.raw) {
    const { input, ...r } = res.raw
    console.error(JSON.stringify(r).slice(0, 1500))
  }
  console.log(res.error ?? res.value)
  process.exitCode = res.error ? 1 : 0
} catch (e) {
  console.error(e.message)
  process.exitCode = 1
} finally {
  rdp.close()
}
