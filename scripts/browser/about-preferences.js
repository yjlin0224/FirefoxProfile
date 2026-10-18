// Reads about:preferences' structure for scripts/about-preferences.mjs: every pane, group and
// setting with the prefs it writes, and those prefs' default and current values. Returns JSON.
//
// The settings pages are built from config objects (Firefox: browser/components/preferences/
// config/*.mjs, registered with SettingGroupManager / SettingPaneManager); each item is a
// Setting (toolkit/content/preferences/Preferences.js) with an optional `pref`, `get`/`set`
// converting between the pref and the control, and `deps` on other Settings. A Setting's `set`
// writes other prefs through `deps.<id>.value = …`; those are followed here by reading the
// functions' source.
//
// Opens about:preferences in a temporary background tab (marked claude-temp) so it doesn't
// touch the user's tabs, and closes it when done. Buttons that open pref-holding dialogs are
// clicked there and the dialogs cancelled (see DIALOG_BUTTONS). Read-only otherwise.
;(async () => {
  const win = Services.wm.getMostRecentWindow('navigator:browser')
  const { gBrowser } = win
  const selected = gBrowser.selectedTab
  const tab = gBrowser.addTab('about:preferences', {
    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    skipAnimation: true,
  })
  tab.setAttribute('claude-temp', 'about-preferences')
  try {
    const sleep = (ms) => new Promise((r) => win.setTimeout(r, ms))

    // Wait for the panes to render their controls (counted until stable for a second)
    let doc
    let last = -1
    let stableSince = 0
    for (const deadline = Date.now() + 30000; ;) {
      if (Date.now() > deadline) throw new Error('about:preferences did not finish rendering')
      await sleep(250)
      doc = tab.linkedBrowser.contentDocument
      if (doc?.readyState !== 'complete' || !doc.defaultView.Preferences?._settings) continue
      const n = doc.querySelectorAll('setting-control').length
      if (n !== last) [last, stableSince] = [n, Date.now()]
      else if (n && Date.now() - stableSince > 1000) break
    }
    await doc.l10n.ready
    const page = doc.defaultView
    const settings = page.Preferences._settings

    // --- Which prefs a setting writes ---
    const prefExists = (name) => Services.prefs.getPrefType(name) !== Services.prefs.PREF_INVALID
    const sourceOf = (config, keys) => {
      // AsyncSetting classes keep their methods on the class
      if (config.asyncSetting) return String(config.asyncSetting.constructor)
      return keys.map((k) => (typeof config[k] === 'function' ? String(config[k]) : '')).join('\n')
    }
    const WRITE_LITERAL =
      /Services\.prefs\.(?:set\w*Pref|clearUserPref|setComplexValue)\(\s*["'`]([^"'`]+)["'`]/g
    const escape = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')
    // Settings whose `set` calls into another module, so their source doesn't show the pref.
    // FRAGILE: keyed by setting id and checked against Firefox 159's sources; an id that's
    // renamed falls back to what the source shows (often "not a pref").
    const KNOWN = {
      // FirefoxRelay.sys.mjs: feature.markAsAvailable() / markAsDisabled()
      relayIntegration: { writes: ['signon.firefoxRelay.feature'] },
      // LoginHelper.setOSAuthEnabled(): set after an OS login prompt, then locked
      requireOSAuthForPasswords: {
        writes: ['signon.management.page.os-auth.locked.enabled'],
        note: '要通過作業系統驗證才會寫入，而且 Firefox 會鎖定它，user.js 設不了',
      },
      requireOSAuthForPayments: {
        writes: ['extensions.formautofill.creditCards.os-auth.locked.enabled'],
        note: '要通過作業系統驗證才會寫入，而且 Firefox 會鎖定它，user.js 設不了',
      },
      // Services.locale.requestedLocales
      browserLanguagePreferred: { writes: ['intl.locale.requested'] },
      browserLanguageFallback: { writes: ['intl.locale.requested'] },
      // The list's reorder/remove handlers and the add button write the acceptLanguages setting
      websiteLanguageWrapper: { writes: ['intl.accept_languages'] },
      defaultZoom: { note: '不是 pref（存在 content-prefs.sqlite）' },
      updateRadioGroup: { note: '不是 pref（存在安裝資料夾的更新設定）' },
      backgroundUpdate: { note: '不是 pref（存在安裝資料夾的更新設定）' },
      windowsLaunchOnLogin: { note: '不是 pref（Windows 的開機啟動項目）' },
      defaultEngineNormal: { note: '不是 pref（存在 search.json.mozlz4）' },
      defaultPrivateEngine: { note: '不是 pref（存在 search.json.mozlz4）' },
      notificationsDoNotDisturb: { note: '不是 pref（只到 Firefox 重新啟動為止）' },
    }
    const writes = new Map()
    function prefsWritten(id, seen = new Set()) {
      if (writes.has(id)) return writes.get(id)
      if (seen.has(id)) return []
      seen.add(id)
      const setting = settings.get(id)
      if (!setting) return []
      const config = setting.config ?? {}
      const out = new Set(KNOWN[id]?.writes)
      if (setting.pref?.id) out.add(setting.pref.id)
      const src = sourceOf(config, ['set', 'onUserChange'])
      const deps = config.deps ?? []
      // `for (const dep of Object.values(deps)) dep.value = …`: all of them
      const writesAll = /Object\.values\(\w+\)/.test(src) && /\.value\s*=(?!=)/.test(src)
      for (const dep of deps) {
        const d = escape(dep)
        // deps.foo.value = …, a destructured foo.value = …, or Services.prefs.*(foo.pref.id)
        if (
          writesAll ||
          new RegExp(`\\b${d}\\.value\\s*=(?!=)`).test(src) ||
          new RegExp(`\\b${d}\\.pref\\b`).test(src)
        )
          for (const p of prefsWritten(dep, seen)) out.add(p)
      }
      for (const m of src.matchAll(WRITE_LITERAL)) if (prefExists(m[1])) out.add(m[1])
      // A `set` that calls elsewhere (e.g. ZoomHelpers.toggleFullZoom()): by convention its
      // backing pref is a dep named …Pref
      if (!out.size && (config.set || config.onUserChange))
        for (const dep of deps.filter((d) => d.endsWith('Pref')))
          for (const p of prefsWritten(dep, seen)) out.add(p)
      const list = [...out]
      writes.set(id, list)
      return list
    }

    // --- Pref values ---
    const prefInfo = {}
    const readPref = (branch, name) => {
      switch (branch.getPrefType(name)) {
        case branch.PREF_BOOL:
          return branch.getBoolPref(name)
        case branch.PREF_INT:
          return branch.getIntPref(name)
        case branch.PREF_STRING: {
          const v = branch.getStringPref(name)
          // Localized defaults point at a .properties file; read the localized value instead
          if (/^chrome:\/\/.+\.properties$/.test(v))
            try {
              return branch.getComplexValue(name, Ci.nsIPrefLocalizedString).data
            } catch {}
          return v
        }
      }
      return undefined
    }
    const defaults = Services.prefs.getDefaultBranch('')
    function describePref(name) {
      if (name in prefInfo) return
      const type = Services.prefs.getPrefType(name)
      let def
      try {
        def = readPref(defaults, name)
      } catch {}
      prefInfo[name] = {
        type: { 32: 'string', 64: 'int', 128: 'bool' }[type] ?? 'none',
        default: def ?? null,
        hasDefault: def !== undefined,
        current: type ? readPref(Services.prefs, name) : null,
        userSet: Services.prefs.prefHasUserValue(name),
        locked: Services.prefs.prefIsLocked(name),
      }
    }

    // --- Labels (in the browser's language) ---
    const l10nKeys = new Map()
    const label = (l10nId, args) => {
      if (!l10nId) return null
      const key = JSON.stringify([l10nId, args ?? null])
      l10nKeys.set(key, { id: l10nId, args: args ?? undefined })
      return key
    }

    // --- The tree ---
    const controls = new Map()
    for (const el of doc.querySelectorAll('setting-control'))
      if (el.config?.id && !controls.has(el.config.id)) controls.set(el.config.id, el)

    const uiValue = (setting) => {
      try {
        if (setting.config?.asyncSetting) return setting.config.cachedValue ?? null
        const v = setting.value
        return v === undefined || (typeof v === 'object' && v !== null) ? null : v
      } catch {
        return null
      }
    }

    const nodes = new Map() // setting id -> its node, to hang dialogs on their buttons
    function walk(item) {
      const setting = item.id ? settings.get(item.id) : null
      const config = setting?.config ?? {}
      const el = controls.get(item.id)
      const node = {
        id: item.id ?? null,
        control: item.control ?? 'moz-checkbox',
        label: label(item.l10nId, item.l10nArgs),
        fallbackLabel: item.controlAttrs?.label ?? null,
        hidden: el ? !!el.hidden : null,
        pref: setting?.pref?.id ?? null,
        // Preferences.add({ inverted: true }): checked means the pref is false
        inverted: !!setting?.pref?.inverted,
        converts: !!(config.get || config.set || config.asyncSetting),
        writes: item.id ? prefsWritten(item.id) : [],
        note: KNOWN[item.id]?.note ?? null,
        value: setting ? uiValue(setting) : null,
      }
      node.writes.forEach(describePref)
      if (item.options)
        node.options = item.options.map((o) => ({
          value: o.value ?? null,
          label: label(o.l10nId, o.l10nArgs),
          fallbackLabel: o.controlAttrs?.label ?? null,
          items: (o.items ?? []).map(walk),
        }))
      if (item.items) node.items = item.items.map(walk)
      if (item.id && !nodes.has(item.id)) nodes.set(item.id, node)
      return node
    }

    const panes = [...doc.querySelectorAll('setting-pane')].map((p) => ({
      id: p.config.id,
      category: p.dataset.category,
      parent: p.config.parent ?? null,
      label: label(p.config.l10nId),
      groups: [...p.querySelectorAll('setting-group')].map((g) => ({
        id: g.getAttribute('groupid'),
        label: label(g.config?.l10nId),
        hidden: !!g.hidden,
        items: (g.config?.items ?? []).map(walk),
      })),
    }))
    const nav = [...doc.querySelectorAll('#categories > moz-page-nav-button[id^="category-"]')]
      .filter((b) => !b.hidden)
      .map((b) => ({ category: b.getAttribute('view'), label: b.textContent.trim() }))

    // --- Dialogs opened by buttons ---
    // Clicks these buttons in the temporary tab, so each dialog opens exactly as from the page
    // (same URL and arguments), reads its pref-bound controls, and closes it without accepting:
    // nothing is saved. Dialogs that hold no prefs (exceptions lists, certificates, search
    // engines, payment methods, containers…) aren't opened.
    // FRAGILE: keyed by setting id and checked against Firefox 159; a renamed button is skipped
    // with a warning in the output.
    const DIALOG_BUTTONS = {
      advancedFonts: {
        note: '字型 pref 名稱裡的語言代碼（例如 zh-TW）是對話框上方選的語言，其他語言換成對應代碼',
      },
      colors: {},
      connectionSettings: {},
      clearSiteDataButton: {}, // sanitize_v2.xhtml, "clear now" mode
      clearDataSettings: {}, // sanitize_v2.xhtml, "clear on shutdown" mode
      syncChangeOptions: {},
      locationSettingsButton: {},
      cameraSettingsButton: {},
      loopbackNetworkSettingsButton: {},
      localNetworkSettingsButton: {},
      microphoneSettingsButton: {},
      speakerSettingsButton: {},
      notificationSettingsButton: {},
      autoplaySettingsButton: {},
      xrSettingsButton: {},
    }
    const OPENS_DIALOG =
      /gSubDialog\.open|showPermissionExceptions|showConnections|_chooseWhatToSync/
    const textLabels = {} // labels read from dialogs (already translated)
    const warnings = []
    const clean = (t) =>
      (t ?? '')
        .replace(/\s+/g, ' ')
        .replace(/（[^（）]*\d[^（）]*）$/, '') // live sizes, e.g. "Cookie 與網站資料（0 位元組）"
        .replace(/\s*\([A-Z0-9]\)/, '') // access keys, e.g. "埠 (P)"
        .replace(/[:：]\s*$/, '')
        .trim()
    async function readDialog(buttonId) {
      const setting = settings.get(buttonId)
      const click = setting?.config?.onUserClick
      if (!click || !OPENS_DIALOG.test(String(click))) {
        warnings.push(`${buttonId}: button not found or no longer opens a dialog`)
        return null
      }
      const before = page.gSubDialog._dialogs.length
      setting.userClick(new page.MouseEvent('click'))
      let dialog, d
      for (const deadline = Date.now() + 10000; ;) {
        if (Date.now() > deadline) throw new Error(`${buttonId}: dialog did not open`)
        await sleep(200)
        dialog = page.gSubDialog._topDialog
        d = dialog?._frame?.contentDocument
        if (
          page.gSubDialog._dialogs.length > before &&
          d?.readyState === 'complete' &&
          d.location.href !== 'about:blank'
        )
          break
      }
      try {
        await d.l10n?.ready
        await sleep(800) // dialogs finish setting up after load (e.g. the autoplay menu)
        const dw = d.defaultView
        const items = []
        // A control's label: a <label control=…>, its own label (not for menulists: theirs is
        // the selected item), aria-labelledby, or a <label> right before it
        const labelFor = (el) => {
          const labelText = (l) => l && (l.getAttribute('value') || l.label || l.textContent)
          const forEl = el.id && d.querySelector(`label[control="${el.id}"]`)
          const byId = el.getAttribute('aria-labelledby')
          const before = el.previousElementSibling
          return clean(
            labelText(forEl) ||
              (el.localName !== 'menulist' && el.getAttribute('label')) ||
              el.getAttribute('aria-label') ||
              (byId && labelText(d.getElementById(byId))) ||
              (before?.localName === 'label' && labelText(before)) ||
              el.labels?.[0]?.textContent,
          )
        }
        const add = (el, pref, extra = {}) => {
          const key = `dialog:${buttonId}:${pref}`
          textLabels[key] = labelFor(el) || pref
          describePref(pref)
          let options = null
          if (el.localName === 'radiogroup')
            options = [...el.querySelectorAll('radio')]
              .filter((r) => r.closest('radiogroup') === el)
              .map((r) => ({
                value: r.value,
                label: clean(r.label),
              }))
          else if (el.localName === 'menulist')
            options = [...el.querySelectorAll('menuitem')].map((m) => ({
              value: m.value,
              label: clean(m.label),
            }))
          const optionNodes = options?.map((o, i) => {
            const k = `${key}:option:${i}`
            textLabels[k] = o.label
            return { value: o.value, label: k, fallbackLabel: null, items: [] }
          })
          items.push({
            id: `${buttonId}:${pref}`,
            control: el.localName,
            label: key,
            fallbackLabel: null,
            hidden: !el.checkVisibility(),
            pref,
            inverted: !!dw.Preferences?.get?.(pref)?.inverted,
            // A checkbox on a non-boolean pref is converted in code (e.g. fonts.js'
            // use_document_fonts); other controls show the pref's value as is
            converts:
              el.localName === 'checkbox' &&
              Services.prefs.getPrefType(pref) !== Services.prefs.PREF_BOOL,
            writes: [pref],
            note: null,
            value: el.localName === 'checkbox' ? el.checked : null,
            ...(optionNodes ? { options: optionNodes } : {}),
            ...extra,
          })
        }
        for (const el of d.querySelectorAll('[preference]'))
          if (el.localName !== 'button') add(el, el.getAttribute('preference'))
        // sitePermissions.xhtml binds its controls by hand: "block new requests" writes
        // permissions.default.<type> (checked: 2 = block, unchecked: 0 = ask), and autoplay's
        // menu writes media.autoplay.default
        const manager = dw.gSitePermissionsManager
        if (manager) {
          const box = d.getElementById('permissionsDisableCheckbox')
          if (box && !box.hidden && manager._defaultPermissionStatePrefName) {
            add(box, manager._defaultPermissionStatePrefName)
            const node = items.at(-1)
            node.options = [
              { value: 0, label: 'opt:ask', fallbackLabel: '0（不勾：每次詢問）', items: [] },
              { value: 2, label: 'opt:block', fallbackLabel: '2（勾選：封鎖）', items: [] },
            ]
            node.converts = true
            node.value = box.checked ? 2 : 0
          }
          const autoplay = d.querySelector('#setAutoplayPref menulist')
          if (autoplay && !d.getElementById('setAutoplayPref').hidden)
            add(autoplay, 'media.autoplay.default')
        }
        return { url: d.location.href, note: DIALOG_BUTTONS[buttonId].note ?? null, items }
      } finally {
        dialog.close() // cancel: never accept (the clear-data dialog would clear data)
        await sleep(300)
      }
    }
    for (const id of Object.keys(DIALOG_BUTTONS)) {
      const node = nodes.get(id)
      if (!node) {
        warnings.push(`${id}: not on the settings pages any more`)
        continue
      }
      node.dialog = await readDialog(id)
    }

    // Resolve every label at once
    const keys = [...l10nKeys.keys()]
    const messages = await doc.l10n.formatMessages(keys.map((k) => l10nKeys.get(k)))
    const labels = {}
    Object.assign(labels, textLabels)
    keys.forEach((k, i) => {
      const m = messages[i]
      if (!m) return
      const attrs = Object.fromEntries((m.attributes ?? []).map((a) => [a.name, a.value]))
      const text = attrs.label ?? m.value ?? attrs.heading ?? attrs.title ?? attrs['aria-label']
      if (text)
        labels[k] = text
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
    })

    return JSON.stringify({
      firefox: {
        name: Services.appinfo.name,
        version: Services.appinfo.version,
        displayVersion: AppConstants.MOZ_APP_VERSION_DISPLAY,
        buildID: Services.appinfo.appBuildID,
        locale: Services.locale.appLocaleAsBCP47,
        os: AppConstants.platform,
      },
      nav,
      panes,
      labels,
      prefs: prefInfo,
      warnings,
    })
  } finally {
    gBrowser.removeTab(tab, { animate: false })
    if (selected.isConnected) gBrowser.selectedTab = selected
  }
})().catch((e) => 'ERROR: ' + e + ' | ' + e.stack)
