// Reloads the profile's deployed userChrome.css and userContent.css in the running Firefox.
// Usage: node scripts/reload.mjs [--port N]
import path from 'node:path'
import { profile } from './lib/config.mjs'
import { findRdpPort } from './lib/rdp.mjs'
import { reloadChrome, reloadContent } from './lib/reload.mjs'

const i = process.argv.indexOf('--port')
const prof = profile()
const port = await findRdpPort(prof.dir, { portOverride: i > 0 ? process.argv[i + 1] : '' })
if (!port) {
  console.error(
    `No Browser Toolbox found for profile ${prof.name}: open it in that Firefox (Ctrl+Shift+Alt+I).`,
  )
  process.exit(3)
}
console.log(`userChrome.css -> ${await reloadChrome(port)}`)
console.log(
  `userContent.css -> ${await reloadContent(port, path.join(prof.chromeDir, 'userContent.css'))}`,
)
