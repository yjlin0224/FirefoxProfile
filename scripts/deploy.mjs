// Deploys the repo's profile/ to the profile in .env (folders mirrored, files copied), then reloads the
// changed stylesheets in the running Firefox if its Browser Toolbox is open.
// Usage: node scripts/deploy.mjs [--no-reload] [--port N]
import { profile } from './lib/config.mjs'
import { describe, syncProfile } from './lib/sync.mjs'
import { reloadChanged } from './lib/apply.mjs'

const args = process.argv.slice(2)
const i = args.indexOf('--port')
const prof = profile()
let result
try {
  result = syncProfile(prof)
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
console.log(`Deployed to ${prof.dir}\n${describe(result)}`)
if (!args.includes('--no-reload')) {
  await reloadChanged(prof, [...result.added, ...result.changed, ...result.removed], {
    portOverride: i >= 0 ? args[i + 1] : '',
  })
}
