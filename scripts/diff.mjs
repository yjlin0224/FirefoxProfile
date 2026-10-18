// Lists what `deploy` would change in the profile in .env, without touching anything.
// Usage: node scripts/diff.mjs
import { profile } from './lib/config.mjs'
import { describe, syncProfile } from './lib/sync.mjs'

const prof = profile()
let result
try {
  result = syncProfile(prof, { dryRun: true })
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
console.log(`Repo vs ${prof.dir} (+ added, ~ changed, - deleted by deploy)\n${describe(result)}`)
