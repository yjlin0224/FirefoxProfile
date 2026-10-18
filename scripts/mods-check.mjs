// Checks the vendored third-party mods (scripts/mods.json) against upstream without changing
// anything: for each, the upstream commits that touched its file since the recorded one, and
// whether the vendored copy still matches that commit (if not, it was edited here).
// Usage: node scripts/mods-check.mjs
// Exit code 1 when a mod is behind, edited locally, or couldn't be checked.
import { commitMatching, commitsTouching, localText, readMods, short } from './lib/mods.mjs'

const { mods } = readMods()
let attention = 0
let failed = 0
for (const [name, mod] of Object.entries(mods)) {
  try {
    if (!mod.commit) {
      console.log(`  ? ${name}: no commit recorded (task mods:update records one)`)
      attention++
      continue
    }
    const commits = await commitsTouching(mod.url)
    const at = commits.findIndex((c) => c.sha === mod.commit)
    const local = localText(name)
    const matching = await commitMatching(mod.url, commits, mod.commit, local)
    const notes = [
      local === null ? 'not in UserChromes/' : '',
      local !== null && !matching ? `edited here since ${short(mod.commit)}` : '',
      matching && matching !== mod.commit
        ? `the copy is upstream's ${short(matching)}, but mods.json records ${short(mod.commit)}`
        : '',
    ].filter(Boolean)
    if (at === 0) console.log(`  = ${name}: up to date (${short(mod.commit)})`)
    else if (at > 0) {
      console.log(`  ~ ${name}: ${at} upstream commit(s) since ${short(mod.commit)}`)
      for (const c of commits.slice(0, at))
        console.log(`      ${c.date} ${short(c.sha)} ${c.subject}`)
    } else
      console.log(
        `  ~ ${name}: ${short(mod.commit)} is not among the last ${commits.length} upstream commits of the file`,
      )
    if (notes.length) console.log(`      ! ${notes.join('; ')}`)
    if (at !== 0 || notes.length) attention++
  } catch (e) {
    console.log(`  ! ${name}: ${e.message}`)
    failed++
  }
}
console.log(
  [
    attention
      ? `${attention} mod(s) need attention: task mods:update downloads the new versions`
      : '',
    failed ? `${failed} couldn't be checked` : '',
  ]
    .filter(Boolean)
    .join('; ') || 'All mods up to date.',
)
process.exitCode = attention || failed ? 1 : 0
