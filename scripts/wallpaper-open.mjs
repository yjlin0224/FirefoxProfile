// Shows the new tab's saved wallpapers. Their files have no extension, so they're copied (with
// the right one, from their first bytes) to scripts/out/wallpapers/<number>-<position>.<ext>
// and opened from there; the profile's files are only read, so Firefox may be running.
//
// Usage: node scripts/wallpaper-open.mjs [number]
//   with a number: opens that image in the default viewer
//   without: copies them all and opens the folder (thumbnails show which number is which)
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { outDir, profile } from './lib/config.mjs'
import { imageExtension, readLibrary } from './lib/wallpapers.mjs'

const numberArg = process.argv[2]
const { library, applied, wallpapers } = readLibrary(profile())
const dir = path.join(outDir, 'wallpapers')

const chosen = numberArg ? wallpapers.filter((w) => w.number === Number(numberArg)) : wallpapers
if (!chosen.length) {
  console.error(
    numberArg
      ? `No saved wallpaper number ${numberArg} (see task wallpaper:position).`
      : `No saved wallpapers in ${library}`,
  )
  process.exit(4)
}

// Start clean, so the folder only has the library's current pictures and names
fs.rmSync(dir, { recursive: true, force: true })
fs.mkdirSync(dir, { recursive: true })
const copies = chosen.map((w) => {
  const copy = path.join(
    dir,
    `${w.number}-${w.position}${w.name === applied ? '-applied' : ''}.${imageExtension(w.file)}`,
  )
  fs.copyFileSync(w.file, copy)
  console.log(`${w.name}\n  -> ${copy}`)
  return copy
})

const open = (target) => {
  if (process.platform === 'win32')
    spawn('explorer.exe', [target], { detached: true, stdio: 'ignore' }).unref()
  else
    spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [target], {
      detached: true,
      stdio: 'ignore',
    }).unref()
}
open(numberArg ? copies[0] : dir)
