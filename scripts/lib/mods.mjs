// The third-party mods vendored in profile/chrome/UserChromes/, listed in scripts/mods.json:
// { mods: { "<file name>": { url, commit } } }. `url` is the file's raw.githubusercontent.com
// URL on its branch (where updates come from); `commit` is the upstream commit the vendored copy
// was taken from, so a check can list what changed upstream since and spot local edits.
//
// GitHub's API allows 60 requests an hour without a token. With GITHUB_TOKEN (environment or
// .env), or else a logged-in GitHub CLI (`gh auth token`), the limit is 5000. The token is only
// sent to api.github.com.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { env, repoChromeDir, scriptsDir } from './config.mjs'

export const modsFile = path.join(scriptsDir, 'mods.json')
export const modsDir = path.join(repoChromeDir, 'UserChromes')

export const readMods = () => JSON.parse(fs.readFileSync(modsFile, 'utf8'))
export const writeMods = (data) => fs.writeFileSync(modsFile, JSON.stringify(data, null, 2) + '\n')

// The repository stores text with LF endings (.gitattributes); upstream files may use CRLF
export const normalize = (text) => text.replace(/\r\n/g, '\n')

export const localText = (name) => {
  const file = path.join(modsDir, name)
  return fs.existsSync(file) ? normalize(fs.readFileSync(file, 'utf8')) : null
}

// raw.githubusercontent.com/<owner>/<repo>/refs/heads/<branch>/<path>
export function source(url) {
  const m = url.match(
    /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/refs\/heads\/([^/]+)\/(.+)$/,
  )
  if (!m) throw new Error(`not a raw.githubusercontent.com branch URL: ${url}`)
  const [, owner, repo, branch, encodedPath] = m
  return { owner, repo, branch, encodedPath, path: decodeURIComponent(encodedPath) }
}

let cachedToken
function token() {
  if (cachedToken === undefined) {
    cachedToken = env('GITHUB_TOKEN')
    if (!cachedToken)
      try {
        cachedToken = execFileSync('gh', ['auth', 'token'], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim()
      } catch {
        cachedToken = ''
      }
  }
  return cachedToken
}

async function api(p) {
  const auth = token()
  const res = await fetch(`https://api.github.com${p}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
  })
  if (!res.ok) {
    const limited = res.status === 403 || res.status === 429
    throw new Error(
      `GitHub API ${res.status}${limited ? ' (rate limit? set GITHUB_TOKEN in .env, or gh auth login)' : ''}: ${p}`,
    )
  }
  return res.json()
}

// The commits on the mod's branch that touched its file, newest first (up to 100), as
// { sha, date, subject }
export async function commitsTouching(url) {
  const s = source(url)
  const list = await api(
    `/repos/${s.owner}/${s.repo}/commits?sha=${s.branch}&path=${encodeURIComponent(s.path)}&per_page=100`,
  )
  return list.map((c) => ({
    sha: c.sha,
    date: c.commit.committer.date.slice(0, 10),
    subject: c.commit.message.split('\n')[0],
  }))
}

// The file as it was at an upstream commit
export async function textAt(url, sha) {
  const s = source(url)
  const res = await fetch(
    `https://raw.githubusercontent.com/${s.owner}/${s.repo}/${sha}/${s.encodedPath}`,
  )
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${s.path} at ${sha.slice(0, 7)}`)
  return normalize(await res.text())
}

// The upstream commit, among `commits` (newest first), whose version of the file is `text`:
// the recorded commit when the copy is untouched, a newer one when mods.json fell behind the
// copy, or null when the copy was edited here. Older commits than the recorded one aren't tried.
export async function commitMatching(url, commits, recorded, text) {
  if (text === null) return null
  if (recorded && text === (await textAt(url, recorded))) return recorded
  for (const c of commits) {
    if (c.sha === recorded) break
    if (text === (await textAt(url, c.sha))) return c.sha
  }
  return null
}

export const short = (sha) => sha.slice(0, 7)
