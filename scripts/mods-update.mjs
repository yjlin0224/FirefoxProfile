// Downloads the third-party mods listed in scripts/mods.json into profile/chrome/UserChromes/,
// each at the latest upstream commit that touched its file, and records that commit in
// mods.json. A copy edited here since its recorded commit is left alone unless --force.
// Doesn't deploy: review the changes (git diff profile/chrome/UserChromes) first, since
// userChrome.css extends these files and may need adjusting. `task mods:check` shows what
// would change, without changing anything.
// Usage: node scripts/mods-update.mjs [--force]
import fs from 'node:fs'
import path from 'node:path'
import {
  commitMatching,
  commitsTouching,
  localText,
  modsDir,
  readMods,
  short,
  textAt,
  writeMods,
} from './lib/mods.mjs'

const force = process.argv.includes('--force')
const data = readMods()
fs.mkdirSync(modsDir, { recursive: true })

let changed = 0
let skipped = 0
for (const [name, mod] of Object.entries(data.mods)) {
  try {
    const commits = await commitsTouching(mod.url)
    const [latest] = commits
    if (!latest) throw new Error('no upstream commits touch this file')
    const local = localText(name)
    const matching = await commitMatching(mod.url, commits, mod.commit, local)
    const edited = !!mod.commit && local !== null && !matching
    if (edited && !force) {
      console.log(
        `  ! ${name}: edited here since ${short(mod.commit)}; not updated (--force overwrites)`,
      )
      skipped++
      process.exitCode = 1
      continue
    }
    if (mod.commit === latest.sha && local !== null && !edited) {
      console.log(`  = ${name} (${short(latest.sha)})`)
      continue
    }
    const text = await textAt(mod.url, latest.sha)
    if (text !== local) fs.writeFileSync(path.join(modsDir, name), text)
    console.log(
      `  ${local === null ? '+' : '~'} ${name}: ${mod.commit ? short(mod.commit) : 'none'} -> ${short(latest.sha)} ${latest.date} ${latest.subject}`,
    )
    mod.commit = latest.sha
    changed++
  } catch (e) {
    console.log(`  ! ${name}: ${e.message}`)
    process.exitCode = 1
  }
}
if (changed) writeMods(data)
console.log(
  [
    changed
      ? `${changed} changed: review with git diff profile/chrome/UserChromes scripts/mods.json, then task deploy`
      : '',
    skipped ? `${skipped} skipped (edited here)` : '',
  ]
    .filter(Boolean)
    .join('; ') || 'All mods up to date.',
)
