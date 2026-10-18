// After a sync: reload in the running Firefox what changed, if its Browser Toolbox is open.
import path from 'node:path'
import { findRdpPort } from './rdp.mjs'
import { reloadChrome, reloadContent } from './reload.mjs'

export async function reloadChanged(prof, files, { portOverride = '', log = console.log } = {}) {
  const chrome = files.some((f) => f.startsWith('chrome/') && f !== 'chrome/userContent.css')
  const content = files.includes('chrome/userContent.css')
  if (files.includes('user.js')) log('user.js: takes effect the next time Firefox starts')
  if (!chrome && !content) return
  const port = await findRdpPort(prof.dir, { portOverride, quiet: true })
  if (!port) {
    log(
      'Not reloaded: no Browser Toolbox open for this profile (open it with Ctrl+Shift+Alt+I, or restart Firefox)',
    )
    return
  }
  try {
    if (chrome) log(`userChrome.css -> ${await reloadChrome(port)}`)
    if (content)
      log(
        `userContent.css -> ${await reloadContent(port, path.join(prof.chromeDir, 'userContent.css'))}`,
      )
  } catch (e) {
    log(`Reload failed (port ${port}): ${e.message}`)
  }
}
