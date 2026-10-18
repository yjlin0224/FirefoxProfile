// Makes the Firefox profile match the repo's profile/ folder, which mirrors its layout:
// - a file there (user.js) is copied to the profile folder;
// - a folder there (chrome/) is mirrored: files the repo doesn't have are deleted from it.
// Everything else in the profile folder (prefs.js, Firefox's own data) is never touched.
// Files with the same content are left alone.
// Only DEPLOYABLE entries may be in profile/: anything else (e.g. a prefs.js, logins.json or
// key4.db copied in by mistake) would overwrite the profile's own file and, unless
// .gitignore catches it, be committed with its private data. Deploy refuses instead.
import fs from 'node:fs'
import path from 'node:path'
import { repoProfileDir } from './config.mjs'

function listFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    return e.isDirectory()
      ? listFiles(full, base)
      : [path.relative(base, full).replaceAll('\\', '/')]
  })
}

export const DEPLOYABLE = { 'user.js': 'file', 'chrome': 'folder' }

const sameContent = (a, b) => fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b))

// Returns { added, changed, removed } (paths relative to the profile folder, e.g.
// chrome/userChrome.css, user.js). With dryRun, only reports what would happen.
export function syncProfile(prof, { dryRun = false } = {}) {
  const result = { added: [], changed: [], removed: [] }

  const unexpected = fs
    .readdirSync(repoProfileDir, { withFileTypes: true })
    .filter((e) => DEPLOYABLE[e.name] !== (e.isDirectory() ? 'folder' : 'file'))
    .map((e) => `profile/${e.name}${e.isDirectory() ? '/' : ''}`)
  if (unexpected.length)
    throw new Error(
      `Not deploying: profile/ may only hold ${Object.entries(DEPLOYABLE)
        .map(([name, kind]) => `${name} (${kind})`)
        .join(
          ' and ',
        )}. Move these out (they could overwrite the profile's own files): ${unexpected.join(', ')}`,
    )

  const copy = (rel) => {
    const from = path.join(repoProfileDir, rel)
    const to = path.join(prof.dir, rel)
    if (sameContent(from, to)) return
    ;(fs.existsSync(to) ? result.changed : result.added).push(rel)
    if (!dryRun) {
      fs.mkdirSync(path.dirname(to), { recursive: true })
      fs.copyFileSync(from, to)
    }
  }

  for (const entry of fs.readdirSync(repoProfileDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      copy(entry.name)
      continue
    }
    const want = listFiles(path.join(repoProfileDir, entry.name))
    const have = listFiles(path.join(prof.dir, entry.name))
    for (const rel of want) copy(`${entry.name}/${rel}`)
    for (const rel of have.filter((f) => !want.includes(f))) {
      result.removed.push(`${entry.name}/${rel}`)
      if (!dryRun) fs.rmSync(path.join(prof.dir, entry.name, rel))
    }
    if (!dryRun) removeEmptyDirs(path.join(prof.dir, entry.name))
  }
  return result
}

function removeEmptyDirs(dir, root = dir) {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true }))
    if (e.isDirectory()) removeEmptyDirs(path.join(dir, e.name), root)
  if (dir !== root && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir)
}

export function describe({ added, changed, removed }) {
  const lines = [
    ...added.map((f) => `  + ${f}`),
    ...changed.map((f) => `  ~ ${f}`),
    ...removed.map((f) => `  - ${f}`),
  ]
  return lines.length ? lines.join('\n') : '  (nothing to do: the profile matches the repo)'
}
