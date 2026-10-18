;(async () => {
  const win = [...Services.wm.getEnumerator('navigator:browser')].find(
    (x) => !x.document.documentElement.hasAttribute('privatebrowsingmode'),
  )
  const doc = win.document,
    sleep = (ms) => new Promise((r) => win.setTimeout(r, ms))
  const sm = doc.querySelector('sidebar-main'),
    sr = sm.shadowRoot,
    btn = doc.getElementById('sidebar-button')
  const oldVis = Services.prefs.getStringPref('sidebar.visibility')
  const state = (label) => {
    const tools = [
      ...sr.querySelectorAll('.tools-and-extensions:not(.overflow-button) > moz-button'),
    ]
    const g = sr.querySelector('.tools-and-extensions:not(.overflow-button)'),
      gr = g.getBoundingClientRect()
    const more = sr.querySelector('.overflow-button')
    const shown = tools.filter((t) => {
      const r = t.getBoundingClientRect()
      return t.style.visibility !== 'hidden' && r.width && r.right <= gr.right + 0.5
    })
    const last = tools[tools.length - 1]
    return `${label}: expanded=${sm.hasAttribute('expanded')} tools=${tools.length} visible=${shown.length} | last="${last.getAttribute('view')}" visibility=${last.style.visibility || '(default)'} | firefox shouldShowOverflowButton=${sm.shouldShowOverflowButton} more button display=${win.getComputedStyle(more).display} | overflow list copies=${doc.getElementById('tools-overflow-list').children.length}`
  }
  const out = []
  try {
    if (oldVis !== 'always-show') {
      Services.prefs.setStringPref('sidebar.visibility', 'always-show')
      await sleep(2500)
    }
    if (!sm.hasAttribute('expanded')) {
      btn.doCommand()
      await sleep(1500)
    }
    out.push(state('start'))
    for (let i = 1; i <= 6; i++) {
      btn.doCommand()
      await sleep(i % 2 ? 250 + i * 60 : 1300) // vary timing: sometimes re-toggle mid-animation
      btn.doCommand()
      await sleep(1500)
      out.push(state(`toggle #${i}`))
    }
  } finally {
    if (Services.prefs.getStringPref('sidebar.visibility') !== oldVis) {
      Services.prefs.setStringPref('sidebar.visibility', oldVis)
      await sleep(2500)
    }
  }
  out.push(`restored sidebar.visibility=${Services.prefs.getStringPref('sidebar.visibility')}`)
  await IOUtils.writeUTF8(PathUtils.join(__OUT_DIR__, 'overflow-repro.txt'), out.join('\n'))
  return 'ok'
})().catch((e) => 'ERROR: ' + e + ' | ' + e.stack)
