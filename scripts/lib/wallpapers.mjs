// The new tab's saved wallpapers: wallpaper/library/ in the profile, files named
// v1-<type>-<theme>-<position>-<number>-<uuid> (no extension); the applied one is named by the
// pref newtabWallpapers.customWallpaper.uuid.
// Firefox: newtab's lib/Wallpapers/WallpaperFileNames.mjs.
import fs from 'node:fs'
import path from 'node:path'

export const POSITIONS = [
  'center',
  'top',
  'bottom',
  'left',
  'right',
  'topleft',
  'topright',
  'bottomleft',
  'bottomright',
]
export const UUID_PREF = 'browser.newtabpage.activity-stream.newtabWallpapers.customWallpaper.uuid'
const SAVED = /^(v1-[a-z]+-(?:light|dark)-)([a-z]+)-([1-9][0-9]*)(-[0-9a-f-]{36})$/

export const uuidPrefLine = new RegExp(
  `user_pref\\("${UUID_PREF.replaceAll('.', '\\.')}", "([^"]*)"\\);`,
)

// { library, prefsFile, applied (file name), wallpapers: [{ name, file, prefix, position,
// number, uuid }] sorted by number }
export function readLibrary(prof) {
  const library = path.join(prof.dir, 'wallpaper', 'library')
  const prefsFile = path.join(prof.dir, 'prefs.js')
  const applied = fs.readFileSync(prefsFile, 'utf8').match(uuidPrefLine)?.[1] ?? ''
  const wallpapers = (fs.existsSync(library) ? fs.readdirSync(library) : [])
    .map((name) => ({ name, m: name.match(SAVED) }))
    .filter((w) => w.m)
    .map(({ name, m }) => ({
      name,
      file: path.join(library, name),
      prefix: m[1],
      position: m[2],
      number: Number(m[3]),
      uuid: m[4],
    }))
    .sort((a, b) => a.number - b.number)
  return { library, prefsFile, applied, wallpapers }
}

// The image format from the file's first bytes, as an extension
export function imageExtension(file) {
  const fd = fs.openSync(file, 'r')
  const head = Buffer.alloc(16)
  fs.readSync(fd, head, 0, 16, 0)
  fs.closeSync(fd)
  if (head[0] === 0xff && head[1] === 0xd8) return 'jpg'
  if (head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'png'
  if (head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP')
    return 'webp'
  if (head.toString('ascii', 4, 8) === 'ftyp')
    return /avi[fs]/.test(head.toString('ascii', 8, 12)) ? 'avif' : 'heic'
  if (head.toString('ascii', 0, 3) === 'GIF') return 'gif'
  return 'bin'
}
