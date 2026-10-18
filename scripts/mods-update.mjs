// Downloads the third-party mods listed in scripts/mods.json into profile/chrome/UserChromes/.
// Doesn't deploy: review the changes (git diff profile/chrome/UserChromes) first, since userChrome.css
// extends these files and may need adjusting.
// Usage: node scripts/mods-update.mjs
import fs from 'node:fs'
import path from 'node:path'
import { repoChromeDir, scriptsDir } from './lib/config.mjs'

const { mods } = JSON.parse(fs.readFileSync(path.join(scriptsDir, 'mods.json'), 'utf8'))
const dir = path.join(repoChromeDir, 'UserChromes')
fs.mkdirSync(dir, { recursive: true })

let changed = 0
for (const [name, url] of Object.entries(mods)) {
  const res = await fetch(url)
  if (!res.ok) {
    console.log(`  ! ${name}: HTTP ${res.status}`)
    process.exitCode = 1
    continue
  }
  const text = await res.text()
  const file = path.join(dir, name)
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
  if (old === text) {
    console.log(`  = ${name}`)
    continue
  }
  fs.writeFileSync(file, text)
  changed++
  console.log(`  ${old === null ? '+' : '~'} ${name}`)
}
console.log(
  changed
    ? `${changed} changed: review with git diff profile/chrome/UserChromes, then task deploy`
    : 'All mods up to date.',
)
