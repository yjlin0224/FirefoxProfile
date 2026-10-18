// Watches the repo's profile/ folder; on every save, deploys it to the profile in .env and
// reloads what changed in the running Firefox (if its Browser Toolbox is open; the port is
// looked up again each time, so reopening the toolbox needs no restart here).
// Usage: node scripts/watch.mjs [--port N]
import fs from 'node:fs'
import { profile, repoProfileDir } from './lib/config.mjs'
import { describe, syncProfile } from './lib/sync.mjs'
import { reloadChanged } from './lib/apply.mjs'

const i = process.argv.indexOf('--port')
const portOverride = i > 0 ? process.argv[i + 1] : ''
const prof = profile()
const stamp = () => new Date().toLocaleTimeString('zh-TW', { hour12: false })
const log = (msg) => console.log(`[${stamp()}] ${msg}`)

let timer = null
let running = false
let pending = false

async function deploy() {
  if (running) {
    pending = true
    return
  }
  running = true
  try {
    const result = syncProfile(prof)
    const files = [...result.added, ...result.changed, ...result.removed]
    if (files.length) {
      log(`deployed\n${describe(result)}`)
      await reloadChanged(prof, files, { portOverride, log })
    }
  } catch (e) {
    log(`deploy failed: ${e.message}`)
  }
  running = false
  if (pending) {
    pending = false
    deploy()
  }
}

const schedule = () => {
  clearTimeout(timer)
  timer = setTimeout(deploy, 300)
}
fs.watch(repoProfileDir, { recursive: true }, schedule)

log(`watching ${repoProfileDir} -> ${prof.dir}`)
deploy() // start in sync
