// Prints the RDP port of the Browser Toolbox open in the profile's Firefox (see lib/rdp.mjs).
// Usage: node scripts/find-port.mjs [--port N]
import { profile } from './lib/config.mjs'
import { findRdpPort } from './lib/rdp.mjs'

const i = process.argv.indexOf('--port')
const prof = profile()
const port = await findRdpPort(prof.dir, { portOverride: i > 0 ? process.argv[i + 1] : '' })
if (port) console.log(port)
else {
  console.error(`No Browser Toolbox found for profile ${prof.name} (${prof.dir}).`)
  process.exitCode = 3
}
