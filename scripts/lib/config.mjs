// Paths and settings shared by the scripts: the repo's files, the profile they deploy to
// (from .env), and where measurements write their output.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const scriptsDir = path.join(repoDir, 'scripts')
export const browserScriptsDir = path.join(scriptsDir, 'browser')
export const outDir = path.join(scriptsDir, 'out')
// What gets deployed: profile/ mirrors the Firefox profile folder (chrome/, user.js)
export const repoProfileDir = path.join(repoDir, 'profile')
export const repoChromeDir = path.join(repoProfileDir, 'chrome')
export const repoUserJs = path.join(repoProfileDir, 'user.js')
// What `task autoconfig:install` copies: install/ mirrors the Firefox install folder
export const repoInstallDir = path.join(repoDir, 'install')

// .env: KEY=value lines, # comments. Real environment variables win, so a task or shell can
// override a value for one run.
function readDotEnv() {
  const file = path.join(repoDir, '.env')
  const values = {}
  if (!fs.existsSync(file)) return values
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m) values[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return values
}

const dotEnv = readDotEnv()
export const env = (name) => (process.env[name] ?? dotEnv[name] ?? '').trim()

function defaultProfilesDir() {
  if (process.platform === 'win32')
    return path.join(
      process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'),
      'Mozilla',
      'Firefox',
      'Profiles',
    )
  if (process.platform === 'darwin')
    return path.join(os.homedir(), 'Library', 'Application Support', 'Firefox', 'Profiles')
  return path.join(os.homedir(), '.mozilla', 'firefox')
}

// The profile folder to deploy to. Exits with a hint when .env isn't set up.
export function profile() {
  const name = env('FIREFOX_PROFILE')
  if (!name) {
    console.error('FIREFOX_PROFILE is not set: copy .env.template to .env and fill it in.')
    process.exit(2)
  }
  const dir = path.join(env('FIREFOX_PROFILES_DIR') || defaultProfilesDir(), name)
  // A profile folder always has these; refuse to write anywhere else.
  if (!fs.existsSync(path.join(dir, 'prefs.js')) && !fs.existsSync(path.join(dir, 'times.json'))) {
    console.error(`Not a Firefox profile folder: ${dir}`)
    process.exit(2)
  }
  return { name, dir, chromeDir: path.join(dir, 'chrome'), userJs: path.join(dir, 'user.js') }
}

// The Firefox install folder (FIREFOX_INSTALL_DIR, else Developer Edition's default on
// Windows). Exits with a hint when there's no Firefox there.
export function installDir() {
  const dir =
    env('FIREFOX_INSTALL_DIR') ||
    path.join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Firefox Developer Edition')
  if (!fs.existsSync(path.join(dir, 'firefox.exe'))) {
    console.error(`No firefox.exe in ${dir}: set FIREFOX_INSTALL_DIR in .env.`)
    process.exit(2)
  }
  return dir
}
