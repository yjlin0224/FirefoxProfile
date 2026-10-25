// The Firefox install folder's autoconfig: the repo's install/ mirrors that folder (like
// profile/ mirrors the profile), its files copied to the same paths there. Firefox reads them
// at startup.
//
// The install folder is under Program Files, so install and remove run host/autoconfig.ps1 as
// administrator (a UAC prompt). What runs and what gets written there comes from the repo's
// last commit, never the working tree: the UAC prompt only says "Windows PowerShell", and the
// repo is writable by anything running as the user, so a change made behind your back would
// otherwise run, and land in the install folder, with administrator rights. Hence:
//   - install/ and the .ps1 must have no uncommitted changes (or the task refuses);
//   - the .ps1's text is passed inline, from the commit;
//   - the files go through a payload file whose SHA-256 is passed along; the elevated script
//     reads it once and writes it only if the hash matches.
// Before the prompt, the commit and each file's SHA-256 are printed: check them first.
//
// Usage: node scripts/autoconfig.mjs <install | check | remove>
//   check: compares the install folder with install/ (read-only). It only warns, so
//   `task check` passes on a machine without the autoconfig.
import { execFileSync, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { installDir, outDir, repoDir, repoInstallDir } from './lib/config.mjs'

const action = process.argv[2]
if (!['install', 'check', 'remove'].includes(action)) {
  console.error('usage: node scripts/autoconfig.mjs <install | check | remove>')
  process.exit(2)
}
const dir = installDir()
const PS1 = 'scripts/host/autoconfig.ps1'

// install/'s files, as paths relative to it
function repoFiles(sub = '') {
  return fs.readdirSync(path.join(repoInstallDir, sub), { withFileTypes: true }).flatMap((e) => {
    const rel = path.join(sub, e.name)
    return e.isDirectory() ? repoFiles(rel) : [rel.replaceAll('\\', '/')]
  })
}

function status() {
  return repoFiles().map((rel) => {
    const target = path.join(dir, rel)
    const state = !fs.existsSync(target)
      ? 'missing'
      : fs.readFileSync(target).equals(fs.readFileSync(path.join(repoInstallDir, rel)))
        ? 'ok'
        : 'differs'
    return { rel, state }
  })
}

function print(files) {
  console.log(`autoconfig in ${dir}:`)
  for (const { rel, state } of files) console.log(`  ${state.padEnd(8)} ${rel}`)
}

const git = (...args) => execFileSync('git', ['-C', repoDir, ...args], { maxBuffer: 1 << 24 })
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex')

// The commit's install/ and .ps1, after checking the working tree has nothing else
function committed() {
  const changes = git('status', '--porcelain', '--untracked-files=all', '--', 'install', PS1)
    .toString()
    .trim()
  if (changes) {
    console.error(`Uncommitted changes; commit (or discard) them first:\n${changes}`)
    process.exit(1)
  }
  const commit = git('rev-parse', '--short', 'HEAD').toString().trim()
  const files = git('ls-tree', '-r', '--name-only', 'HEAD', '--', 'install')
    .toString()
    .split('\n')
    .filter(Boolean)
    .map((p) => ({ path: p.slice('install/'.length), data: git('show', `HEAD:${p}`) }))
  if (!files.length) {
    console.error('No install/ in the last commit.')
    process.exit(1)
  }
  return { commit, files, script: git('show', `HEAD:${PS1}`).toString() }
}

// Runs the commit's .ps1 as administrator and waits for it; returns its exit code and the
// error it logged
function elevated(act, { script, files }) {
  fs.mkdirSync(outDir, { recursive: true })
  const payload = path.join(outDir, 'autoconfig-payload.json')
  const log = path.join(outDir, 'autoconfig.log')
  const bytes = Buffer.from(
    JSON.stringify(files.map((f) => ({ path: f.path, data: f.data.toString('base64') }))),
  )
  fs.writeFileSync(payload, bytes)
  fs.rmSync(log, { force: true })
  const q = (s) => `'${s.replaceAll("'", "''")}'`
  const inner =
    `& {\n${script}\n} -Action ${act} -Target ${q(dir)} -Payload ${q(payload)}` +
    ` -PayloadHash ${sha256(bytes)} -Log ${q(log)}; exit 0`
  const encoded = Buffer.from(inner, 'utf16le').toString('base64')
  // The elevated command line is limited to 32767 characters
  if (encoded.length > 30000) throw new Error(`${PS1} is too long to pass inline`)
  // Given on stdin, so this outer command has no length limit (and needs no escaping). Declining
  // the prompt makes Start-Process fail: exit 1
  const outer =
    `try { $p = Start-Process powershell -Verb RunAs -Wait -PassThru -WindowStyle Hidden` +
    ` -ErrorAction Stop -ArgumentList '-NoProfile -NonInteractive -EncodedCommand ${encoded}';` +
    ` exit $p.ExitCode } catch { [Console]::Error.WriteLine($_); exit 1 }`
  const r = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', '-'], {
    input: outer + '\n',
    stdio: ['pipe', 'inherit', 'inherit'],
  })
  fs.rmSync(payload, { force: true })
  const error = fs.existsSync(log) && fs.readFileSync(log, 'utf8').trim()
  fs.rmSync(log, { force: true })
  return { code: r.status, error }
}

if (action === 'check') {
  const files = status()
  print(files)
  if (files.some((f) => f.state !== 'ok'))
    console.log('Warning: not installed as in the repo. Run `task autoconfig:install`.')
} else {
  const c = committed()
  console.log(
    `${action === 'install' ? 'Installing into' : 'Removing from'} ${dir}, from commit ${c.commit}:`,
  )
  for (const f of c.files)
    console.log(`  ${f.path}${action === 'install' ? `  sha256 ${sha256(f.data)}` : ''}`)
  console.log(`  run by ${PS1} at that commit, as administrator: Windows asks next.`)
  const { code, error } = elevated(action, c)
  const files = status()
  print(files)
  const done = files.every((f) => f.state === (action === 'install' ? 'ok' : 'missing'))
  if (code !== 0 || !done) {
    // No error from the script: it didn't run (the prompt declined) or Start-Process said why
    console.error(error || `${action} failed (exit code ${code}; declined the UAC prompt?)`)
    process.exit(1)
  }
  console.log('Restart Firefox for it to take effect.')
}
