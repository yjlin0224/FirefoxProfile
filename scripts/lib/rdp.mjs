// Minimal Firefox Remote Debugging Protocol (RDP) client, talking to the Browser Toolbox's
// server, and a finder for that server's port.
import net from 'node:net'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { env } from './config.mjs'

export class Rdp {
  static async connect(port, { timeout = 3000 } = {}) {
    const rdp = new Rdp()
    await rdp.#open(port, timeout)
    return rdp
  }

  #sock = null
  #buf = Buffer.alloc(0)
  #waiters = []

  #open(port, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.close()
        // Without a greeting the toolbox is usually waiting for its "allow connection?" prompt
        reject(
          new Error(
            `no answer from 127.0.0.1:${port} within ${timeout}ms (is the Browser Toolbox asking to allow the connection? devtools.debugger.prompt-connection)`,
          ),
        )
      }, timeout)
      this.#sock = net.connect(Number(port), '127.0.0.1')
      this.#sock.on('data', (d) => this.#onData(d))
      this.#sock.on('error', (e) => {
        clearTimeout(timer)
        reject(e)
      })
      this.waitFor((p) => p.from === 'root').then(() => {
        clearTimeout(timer)
        resolve()
      })
    })
  }

  #onData(d) {
    this.#buf = Buffer.concat([this.#buf, d])
    for (;;) {
      const colon = this.#buf.indexOf(':')
      if (colon < 0) return
      const len = Number(this.#buf.subarray(0, colon).toString())
      if (this.#buf.length < colon + 1 + len) return
      const pkt = JSON.parse(this.#buf.subarray(colon + 1, colon + 1 + len).toString())
      this.#buf = this.#buf.subarray(colon + 1 + len)
      const i = this.#waiters.findIndex((w) => w.match(pkt))
      if (i >= 0) this.#waiters.splice(i, 1)[0].resolve(pkt)
    }
  }

  waitFor(match) {
    return new Promise((resolve) => this.#waiters.push({ match, resolve }))
  }

  send(pkt) {
    const s = Buffer.from(JSON.stringify(pkt))
    this.#sock.write(`${s.length}:`)
    this.#sock.write(s)
  }

  request(pkt) {
    const p = this.waitFor((r) => r.from === pkt.to && !r.type)
    this.send(pkt)
    return p
  }

  // The console actor to evaluate in: the parent process (default), a content process by
  // its OS pid (chrome privileges), or a tab whose URL contains `tab` (page privileges).
  async consoleActor({ pid = 0, tab = null } = {}) {
    if (tab) {
      const { tabs } = await this.request({ to: 'root', type: 'listTabs' })
      const matches = tabs.filter((t) => (t.url || '').includes(tab))
      const found = matches.find((t) => t.selected) || matches[0]
      // Only a count: the open tabs' URLs are private and this ends up in terminals and logs
      if (!found) throw new Error(`no tab matching "${tab}" among ${tabs.length} open tabs`)
      if (matches.length > 1)
        console.error(
          `[tab] ${matches.length} tabs match "${tab}", using ${found.selected ? 'the selected one' : 'the first'}`,
        )
      const target = await this.request({ to: found.actor, type: 'getTarget' })
      return target.frame.consoleActor
    }
    const proc = await this.request({ to: 'root', type: 'getProcess', id: Number(pid) })
    const target = await this.request({ to: proc.processDescriptor.actor, type: 'getTarget' })
    if (target.process?.error) throw new Error(`process ${pid}: ${target.process.message}`)
    return target.process.consoleActor
  }

  // Evaluates `code` (top-level await allowed) and returns its result as a string, with long
  // strings fetched in full. Rejections and exceptions come back as {error}.
  async evaluate(code, where = {}) {
    const actor = await this.consoleActor(where)
    const resultP = this.waitFor((p) => p.type === 'evaluationResult' && p.from === actor)
    await this.request({ to: actor, type: 'evaluateJSAsync', text: code, mapped: { await: true } })
    const res = await resultP
    if (res.topLevelAwaitRejected)
      return { error: 'REJECTED (wrap the script in try/catch to see why)', raw: res }
    if (res.exception) return { error: 'EXCEPTION: ' + res.exceptionMessage, raw: res }
    const r = res.result
    if (r && typeof r === 'object' && r.type === 'longString') {
      const { substring } = await this.request({
        to: r.actor,
        type: 'substring',
        start: 0,
        end: r.length,
      })
      return { value: substring, raw: res }
    }
    if (r && typeof r === 'object' && r.type === 'undefined') return { value: '', raw: res }
    return { value: typeof r === 'object' && r !== null ? JSON.stringify(r) : String(r), raw: res }
  }

  close() {
    this.#sock?.destroy()
  }
}

const samePath = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase()

// Local TCP ports that Firefox processes listen on (Windows: tasklist + netstat).
function firefoxListeningPorts() {
  if (process.platform !== 'win32') return []
  const pids = new Set(
    execFileSync('tasklist', ['/FI', 'IMAGENAME eq firefox.exe', '/FO', 'CSV', '/NH'], {
      encoding: 'utf8',
    })
      .split(/\r?\n/)
      .map((l) => l.split('","')[1])
      .filter(Boolean),
  )
  const ports = []
  for (const line of execFileSync('netstat', ['-ano', '-p', 'TCP'], { encoding: 'utf8' }).split(
    /\r?\n/,
  )) {
    const m = line.trim().match(/^TCP\s+127\.0\.0\.1:(\d+)\s+\S+\s+LISTENING\s+(\d+)$/)
    if (m && pids.has(m[2])) ports.push(Number(m[1]))
  }
  return ports
}

// The Browser Toolbox server of the Firefox running `profileDir`: FIREFOX_RDP_PORT (or
// `portOverride`) when set, otherwise found among Firefox's listening ports by connecting and
// asking each for its profile folder. Returns null when there's none (Firefox closed, or the
// toolbox not open).
export async function findRdpPort(profileDir, { portOverride = '', quiet = false } = {}) {
  const given = String(portOverride || env('FIREFOX_RDP_PORT'))
  const candidates = given ? [Number(given)] : firefoxListeningPorts()
  for (const port of candidates) {
    let rdp
    try {
      rdp = await Rdp.connect(port, { timeout: given ? 5000 : 1500 })
      const { value } = await rdp.evaluate('PathUtils.profileDir')
      if (value && samePath(value, profileDir)) return port
      if (given && !quiet) console.error(`port ${port} is Firefox with another profile: ${value}`)
    } catch (e) {
      if (given && !quiet) console.error(`port ${port}: ${e.message}`)
    } finally {
      rdp?.close()
    }
  }
  return null
}
