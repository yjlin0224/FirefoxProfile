// Checks user.js. Order is left alone (it's grouped by hand).
//
// Offline: every line is blank, a // comment, or `user_pref("name", value);` with an optional
// trailing // comment; values are booleans, 32-bit integers or strings; no pref is set twice;
// spacing is canonical (--fix rewrites it: `user_pref("name", value); // comment`).
//
// Online (when the profile's Firefox has the Browser Toolbox open; --offline skips it):
// compares each pref with the running Firefox:
//   error  type differs from Firefox's (Firefox ignores the line)
//   warn   Firefox currently has another value (changed since startup, or something
//          overrides user.js: e.g. a profile group's shared prefs, a policy, a lock)
//   info   no default value in Firefox (obsolete, or only read by code: check before removing)
//   info   same as Firefox's default (redundant, unless it's pinned on purpose)
//
// Usage: node scripts/userjs-check.mjs [--fix] [--offline] [--port N]
// Exit code 1 on errors or (without --fix) spacing to fix.
import fs from 'node:fs'
import { profile, repoUserJs } from './lib/config.mjs'
import { Rdp, findRdpPort } from './lib/rdp.mjs'

const args = process.argv.slice(2)
const fix = args.includes('--fix')
const offline = args.includes('--offline')
const portIndex = args.indexOf('--port')

const PREF =
  /^user_pref\(\s*"((?:[^"\\]|\\.)+)"\s*,\s*(true|false|-?\d+|"(?:[^"\\]|\\.)*")\s*\)\s*;\s*(?:\/\/\s?(.*))?$/

const text = fs.readFileSync(repoUserJs, 'utf8')
const lines = text.replace(/\n$/, '').split('\n')
const problems = { error: [], warn: [], info: [], style: [] }
const report = (kind, line, msg) => problems[kind].push(`  ${String(line).padStart(4)}: ${msg}`)

const prefs = []
const seen = new Map()
const fixed = lines.map((raw, i) => {
  const n = i + 1
  const line = raw.replace(/\s+$/, '')
  if (line !== raw) report('style', n, 'trailing whitespace')
  if (line === '' || /^\s*\/\//.test(line)) return line
  const m = line.match(PREF)
  if (!m) {
    report('error', n, `not a user_pref(...) line: ${line.slice(0, 80)}`)
    return line
  }
  const [, name, valueText, comment] = m
  const value = JSON.parse(valueText)
  if (typeof value === 'number' && (value > 2 ** 31 - 1 || value < -(2 ** 31)))
    report('error', n, `${name}: ${value} is outside Firefox's 32-bit integer range`)
  if (seen.has(name)) report('error', n, `${name} is already set on line ${seen.get(name)}`)
  else seen.set(name, n)
  prefs.push({ name, value, line: n })
  const canonical = `user_pref("${name}", ${valueText});` + (comment ? ` // ${comment}` : '')
  if (canonical !== line) report('style', n, `spacing: ${canonical.slice(0, 80)}`)
  return canonical
})
if (!text.endsWith('\n')) report('style', lines.length, 'no newline at the end of the file')

if (fix && problems.style.length) {
  fs.writeFileSync(repoUserJs, fixed.join('\n') + '\n')
  console.log(`Fixed ${problems.style.length} spacing issue(s) in user.js`)
  problems.style = []
}

if (!offline) {
  const prof = profile()
  const port = await findRdpPort(prof.dir, {
    portOverride: portIndex >= 0 ? args[portIndex + 1] : '',
    quiet: true,
  })
  if (!port) console.log('(online checks skipped: no Browser Toolbox open for this profile)')
  else {
    const rdp = await Rdp.connect(port, { timeout: 5000 })
    try {
      const res = await rdp.evaluate(`(() => {
        const P = Services.prefs, D = P.getDefaultBranch('');
        const type = { 32: 'string', 64: 'number', 128: 'boolean' };
        const read = (br, n, t) => { try { return t === 32 ? br.getStringPref(n) : t === 64 ? br.getIntPref(n) : br.getBoolPref(n) } catch { return undefined } };
        return JSON.stringify(${JSON.stringify(prefs.map((p) => p.name))}.map((n) => {
          const t = P.getPrefType(n);
          return { n, type: type[t], current: t ? read(P, n, t) : undefined, def: t ? read(D, n, t) : undefined, locked: t ? P.prefIsLocked(n) : false };
        }));
      })()`)
      if (res.error) throw new Error(res.error)
      for (const [i, ff] of JSON.parse(res.value).entries()) {
        const { name, value, line } = prefs[i]
        if (ff.type && ff.type !== typeof value)
          report(
            'error',
            line,
            `${name}: Firefox's pref is a ${ff.type}, user.js gives a ${typeof value}`,
          )
        else if (ff.locked) report('warn', line, `${name}: locked in Firefox (policy or config)`)
        else if (ff.current !== undefined && ff.current !== value)
          report(
            'warn',
            line,
            `${name}: Firefox currently has ${JSON.stringify(ff.current)} (user.js: ${JSON.stringify(value)})`,
          )
        if (ff.def === undefined)
          report(
            'info',
            line,
            `${name}: no default value in Firefox (obsolete, or only read by code)`,
          )
        else if (ff.def === value) report('info', line, `${name}: same as Firefox's default`)
      }
    } finally {
      rdp.close()
    }
  }
}

const labels = {
  error: 'Errors',
  style: 'Spacing (task userjs:check -- --fix)',
  warn: 'Warnings',
  info: 'Notes',
}
for (const kind of ['error', 'style', 'warn', 'info'])
  if (problems[kind].length) console.log(`${labels[kind]}:\n${problems[kind].join('\n')}`)
console.log(
  `user.js: ${prefs.length} prefs, ${problems.error.length} errors, ${problems.warn.length} warnings`,
)
process.exitCode = problems.error.length || problems.style.length ? 1 : 0
