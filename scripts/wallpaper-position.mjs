// Lists the new tab's saved wallpapers, or sets one's position. Firefox keeps the position in
// the wallpaper's file name (see lib/wallpapers.mjs) and copies it into the pref
// newtabWallpapers.customWallpaper.position whenever that wallpaper is applied and at every
// startup, so changing that pref alone doesn't last. This renames the file (and updates the
// uuid pref in prefs.js when it's the applied one). Uploads are always named "center".
// Firefox: newtab's lib/Wallpapers/WallpaperFeed.sys.mjs (broadcastAppliedWallpaper(),
// #applySavedWallpaper()).
//
// Usage: node scripts/wallpaper-position.mjs                       list (read-only)
//        node scripts/wallpaper-position.mjs <position> [number]  rename (Firefox closed):
//          the wallpaper with that number, or the applied one
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { outDir, profile } from './lib/config.mjs'
import { POSITIONS, UUID_PREF, readLibrary, uuidPrefLine } from './lib/wallpapers.mjs'

const EXTRA_FILES = ['', '.txt', '.thumb'] // the image, its details, an old thumbnail

const [position, numberArg] = process.argv.slice(2)
const prof = profile()
const { library, prefsFile, applied, wallpapers } = readLibrary(prof)

if (!position) {
  if (!wallpapers.length) console.log(`No saved wallpapers in ${library}`)
  for (const w of wallpapers)
    console.log(
      `${String(w.number).padStart(3)}  ${w.position.padEnd(11)}  ${w.name}${w.name === applied ? '  (applied)' : ''}`,
    )
  console.log(
    `\nSee one: task wallpaper:open -- <number>\nSet one: task wallpaper:position -- <${POSITIONS.join('|')}> [number]`,
  )
  process.exit(0)
}

if (!POSITIONS.includes(position)) {
  console.error(`usage: task wallpaper:position -- <${POSITIONS.join('|')}> [number]`)
  process.exit(2)
}

const target = numberArg
  ? wallpapers.find((w) => w.number === Number(numberArg))
  : wallpapers.find((w) => w.name === applied)
if (!target) {
  console.error(
    numberArg
      ? `No saved wallpaper number ${numberArg} (see task wallpaper:position).`
      : `No saved wallpaper applied (${UUID_PREF} = ${JSON.stringify(applied)}); give a number.`,
  )
  process.exit(4)
}
if (target.position === position) {
  console.log(`Already ${position}: ${target.name}`)
  process.exit(0)
}

// Firefox keeps the library's file names in memory and rewrites prefs.js on exit
if (process.platform === 'win32') {
  const running = execFileSync('tasklist', ['/FI', 'IMAGENAME eq firefox.exe', '/NH'], {
    encoding: 'utf8',
  })
  if (/firefox\.exe/i.test(running)) {
    console.error('Close Firefox first (no firefox.exe may be left).')
    process.exit(3)
  }
}

const renamed = `${target.prefix}${position}-${target.number}${target.uuid}`
const isApplied = target.name === applied

if (isApplied) {
  // Keep the old prefs.js, in case anything goes wrong
  const backup = path.join(outDir, 'backups', new Date().toISOString().replace(/[:.]/g, '-'))
  fs.mkdirSync(backup, { recursive: true })
  fs.copyFileSync(prefsFile, path.join(backup, 'prefs.js'))
  console.log(`prefs.js backed up to ${backup}`)
}
for (const ext of EXTRA_FILES) {
  const from = path.join(library, target.name + ext)
  if (fs.existsSync(from)) fs.renameSync(from, path.join(library, renamed + ext))
}
if (isApplied) {
  const prefs = fs.readFileSync(prefsFile, 'utf8')
  fs.writeFileSync(
    prefsFile,
    prefs.replace(uuidPrefLine, `user_pref("${UUID_PREF}", "${renamed}");`),
  )
}

console.log(
  `${target.name}\n  -> ${renamed}${isApplied ? '  (applied: prefs.js updated)' : ''}\nStart Firefox.`,
)
