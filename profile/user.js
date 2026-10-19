// TODO: https://searchfox.org/mozilla-release/source/modules/libpref/init/all.js
// Checked against Firefox Developer Edition 159 with `task userjs:check` (see README.md, 適用版本)
user_pref("accessibility.typeaheadfind", true);
user_pref("browser.aboutConfig.showWarning", false);
user_pref("browser.contentblocking.category", "custom");
user_pref("browser.discovery.enabled", false);
user_pref("browser.download.always_ask_before_handling_new_types", true);
user_pref("browser.download.autohideButton", false);
user_pref("browser.ipProtection.added", true); // built-in VPN button on the toolbar
user_pref("browser.ipProtection.enabled", true); // built-in VPN (default false; Firefox only turns it on for some users)
user_pref("browser.ml.chat.shortcuts", false); // no AI chatbot shortcut when selecting text
user_pref("browser.newtabpage.activity-stream.nova.enabled", true); // default, pinned: userContent.css is written for the nova new tab
user_pref("browser.newtabpage.activity-stream.improvesearch.handoffToAwesomebar", false);
user_pref("browser.newtabpage.activity-stream.section.highlights.rows", 4);
user_pref("browser.newtabpage.activity-stream.showSponsored", false);
user_pref("browser.newtabpage.activity-stream.showSponsoredTopSites", false);
user_pref("browser.newtabpage.activity-stream.topSitesRows", 4);
user_pref("browser.nova.enabled", true); // default, pinned: userChrome.css is written for the nova browser UI
user_pref("browser.opaqueResponseBlocking", false);
user_pref("browser.profiles.enabled", false); // no profile group / profile switcher (the app menu entry); this profile was taken out of its group (StoreID removed from profiles.ini)
user_pref("browser.promo.pin.enabled", false);
user_pref("browser.promo.relay.enabled", false);
user_pref("browser.search.suggest.enabled.private", true);
user_pref("browser.search.update", false); // no daily updates of website-added (OpenSearch) engines; built-in engines update anyway
user_pref("browser.startup.homepage_override.mstone", "ignore");
user_pref("browser.startup.page", 3);
user_pref("browser.tabs.warnOnOpen", false);
user_pref("browser.toolbars.bookmarks.visibility", "never"); // userChrome.css: no bookmarks toolbar
user_pref("browser.uidensity", 0); // default, pinned: userChrome.css's 32px grid is for normal density
user_pref("browser.urlbar.keepPanelOpenDuringImeComposition", true); // keep the urlbar results open while composing with an IME
user_pref("browser.urlbar.showSearchSuggestionsFirst", false);
user_pref("browser.urlbar.trimURLs", false);
user_pref("browser.vpn_promo.enabled", false);
user_pref("datareporting.healthreport.uploadEnabled", false); // shared by the profile group (permanentSharedPrefs): the group's database overrides this at startup; set it in Settings
user_pref("datareporting.policy.dataSubmissionEnabled", false);
user_pref("datareporting.policy.firstRunURL", "");
user_pref("datareporting.usage.uploadEnabled", false);
user_pref("devtools.command-button-measure.enabled", true);
user_pref("devtools.command-button-rulers.enabled", true);
user_pref("devtools.command-button-screenshot.enabled", true);
user_pref("devtools.chrome.enabled", true); // Browser Toolbox, used by scripts/
user_pref("devtools.debugger.prompt-connection", true); // default, pinned: scripts/ need it off, set by hand for a session; a restart turns it back on if that's forgotten
user_pref("devtools.debugger.remote-enabled", true); // Browser Toolbox, used by scripts/
user_pref("devtools.dom.enabled", true);
user_pref("devtools.screenshot.audio.enabled", false);
user_pref("devtools.toolbox.host", "right");
user_pref("dom.disable_open_during_load", true); // default, pinned: block pop-ups (per-site exceptions are site permissions); synced, so another device could turn it off
user_pref("dom.security.framebusting_intervention.enabled", true); // default, pinned: block third-party frames from redirecting the page (same settings checkbox as pop-ups)
user_pref("dom.security.https_only_mode", false); // HTTPS-Only Mode in private windows only (with _pbm)
user_pref("dom.security.https_only_mode_pbm", true);
user_pref("extensions.activeThemeID", "default-theme@mozilla.org");
user_pref("findbar.highlightAll", true);
user_pref("font.default.x-unicode", "sans-serif");
user_pref("font.default.x-western", "sans-serif");
user_pref("font.language.group", "zh-TW");
user_pref("font.name.monospace.ja", "Maple Mono NF CN");
user_pref("font.name.monospace.ko", "Maple Mono NF CN");
user_pref("font.name.monospace.x-unicode", "Maple Mono NF CN");
user_pref("font.name.monospace.x-western", "Maple Mono NF CN");
user_pref("font.name.monospace.zh-CN", "Maple Mono NF CN");
user_pref("font.name.monospace.zh-HK", "Maple Mono NF CN");
user_pref("font.name.monospace.zh-TW", "Maple Mono NF CN");
user_pref("font.name.sans-serif.ja", "Noto Sans CJK JP");
user_pref("font.name.sans-serif.ko", "Noto Sans CJK KR");
user_pref("font.name.sans-serif.x-unicode", "Noto Sans");
user_pref("font.name.sans-serif.x-western", "Noto Sans");
user_pref("font.name.sans-serif.zh-CN", "Noto Sans CJK SC");
user_pref("font.name.sans-serif.zh-HK", "Noto Sans CJK HK");
user_pref("font.name.sans-serif.zh-TW", "Noto Sans CJK TC");
user_pref("font.name.serif.ja", "Noto Serif CJK JP");
user_pref("font.name.serif.ko", "Noto Serif CJK KR");
user_pref("font.name.serif.x-unicode", "Noto Serif");
user_pref("font.name.serif.x-western", "Noto Serif");
user_pref("font.name.serif.zh-CN", "Noto Serif CJK SC");
user_pref("font.name.serif.zh-HK", "Noto Serif CJK HK");
user_pref("font.name.serif.zh-TW", "Noto Serif CJK TC");
user_pref("font.size.monospace.x-unicode", 16);
user_pref("font.size.monospace.x-western", 16);
user_pref("general.smoothScroll.msdPhysics.enabled", true);
user_pref("gfx.color_management.mode", 1); // color-manage all images, not only tagged ones
user_pref("intl.accept_languages", "zh-tw,zh,en-us,en,ja");
user_pref("layout.css.scroll-anchoring.enabled", false);
user_pref("media.autoplay.default", 5); // block audio and video; per-site exceptions are site permissions (permissions.sqlite), not prefs
user_pref("network.cookie.cookieBehavior", 5); // default, pinned: custom ETP cookies = isolate cross-site cookies
user_pref("network.http.referer.disallowCrossSiteRelaxingDefault.top_navigation", true); // part of ETP strict (rpTop), not on the custom page: sites can't loosen the referrer policy for cross-site navigations
user_pref("network.http.windows-sso.enabled", true);
user_pref("network.trr.mode", 5); // DNS over HTTPS off by choice: Firefox won't turn it on by itself
user_pref("permissions.default.camera", 2);
user_pref("permissions.default.desktop-notification", 2);
user_pref("permissions.default.geo", 2);
user_pref("permissions.default.microphone", 2);
user_pref("permissions.default.xr", 2);
user_pref("places.history.expiration.max_pages", 2147483647);
user_pref("privacy.annotate_channels.strict_list.enabled", true); // part of ETP strict (lvl2), not on the custom page: the stricter tracker list in normal windows too
user_pref("privacy.bounceTrackingProtection.mode", 1); // part of ETP strict (btp), not on the custom page: purge bounce trackers' data (default 3 only logs them)
user_pref("privacy.donottrackheader.enabled", true);
user_pref("privacy.fingerprintingProtection", true);
user_pref("privacy.fingerprintingProtection.overrides", "+AllTargets,-CSSPrefersColorScheme,-CanvasExtractionBeforeUserInputIsBlocked,-CanvasExtractionFromThirdPartiesIsBlocked,-CanvasImageExtractionPrompt,-CanvasRandomization,-FontVisibilityBaseSystem,-FontVisibilityLangPack,-JSDateTimeUTC,-KeyboardEvents,-WidgetEvents,-WindowDevicePixelRatio");
user_pref("privacy.fingerprintingProtection.pbmode", true); // default, pinned: custom ETP suspected fingerprinters in all windows (with privacy.fingerprintingProtection)
user_pref("privacy.globalprivacycontrol.enabled", true);
user_pref("privacy.query_stripping.enabled", true);
user_pref("privacy.query_stripping.enabled.pbmode", true);
user_pref("privacy.query_stripping.strip_list", "__hsfp __hssc __hstc __s _hsenc _openstat dclid fbclid gbraid gclid hsCtaTracking igshid mc_eid ml_subscriber ml_subscriber_hash msclkid oft_c oft_ck oft_d oft_id oft_ids oft_k oft_lk oft_sk oly_anon_id oly_enc_id rb_clickid s_cid twclid vero_conv vero_id wbraid wickedid yclid  __hsfp __hssc __hstc __s _gl _hsenc _kx _openstat at_recipient_id at_recipient_list bbeml bsft_clkid bsft_uid dclid et_rid fb_action_ids fb_comment_id fbclid gbraid gclid guce_referrer guce_referrer_sig hsCtaTracking irclickid mc_eid ml_subscriber ml_subscriber_hash msclkid mtm_cid oft_c oft_ck oft_d oft_id oft_ids oft_k oft_lk oft_sk oly_anon_id oly_enc_id pk_cid rb_clickid s_cid ss_email_id twclid unicorn_click_id vero_conv vero_id vgo_ee wbraid wickedid yclid ymclid ysclid h_sid h_slt mkt_tok igsh igshid ref_src ref_url si __cft__[0] __tn__ trackid"); // https://github.com/brave/brave-core/blob/master/components/query_filter/utils.cc
user_pref("privacy.sanitize.sanitizeOnShutdown", false); // pinned: default too, but Sync can bring true from another device and clear history on exit
user_pref("privacy.trackingprotection.allow_list.baseline.enabled", false); // custom ETP: no exceptions to fix major site issues
user_pref("privacy.trackingprotection.allow_list.convenience.enabled", false); // custom ETP: no exceptions to fix minor site issues
user_pref("privacy.trackingprotection.cryptomining.enabled", true); // default, pinned: custom ETP
user_pref("privacy.trackingprotection.emailtracking.enabled", true); // deliberate mix: email and social trackers blocked in all windows, other tracking content only in private ones (the settings page can't show this and rewrites both when its tracking toggle is used)
user_pref("privacy.trackingprotection.emailtracking.pbmode.enabled", true);
user_pref("privacy.trackingprotection.enabled", false); // custom ETP tracking content: private windows only (with the pbmode/emailtracking prefs)
user_pref("privacy.trackingprotection.fingerprinting.enabled", true); // default, pinned: custom ETP known fingerprinters
user_pref("privacy.trackingprotection.pbmode.enabled", true);
user_pref("privacy.trackingprotection.socialtracking.enabled", true); // see emailtracking.enabled
user_pref("signon.generation.enabled", false);
user_pref("signon.rememberSignons", false);
user_pref("svg.context-properties.content.enabled", true);
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref("toolkit.zoomManager.zoomValues", "0.1,0.125,0.2,0.25,0.3,0.3333333333333333,0.375,0.4,0.5,0.6,0.625,0.6666666666666666,0.7,0.75,0.8,0.875,0.9,1.0,1.25,1.3333333333333333,1.5,1.6666666666666667,1.75,2.0,2.5,3.0,3.5,4.0");
user_pref("widget.windows.mica", true); // Windows only: Mica behind the toolbars (userChrome.css is tuned for it; needs the default theme)
user_pref("widget.windows.mica.popups", 1); // Windows only: the backdrop for menus too
user_pref("widget.windows.mica.toplevel-backdrop", 1); // Windows only: Mica, meant for windows without tabs in the title bar (vertical tabs)
user_pref("browser.theme.windows.accent-color-in-tabs.enabled", true); // Windows only: no effect while Mica is on; the fallback without it (with Windows' accent color on title bars)
user_pref("browser.theme.native-theme", true); // all platforms: with the default theme, the browser UI takes the system's colors instead of Firefox's
user_pref("widget.non-native-theme.use-theme-accent", true); // all platforms: web form controls take the system accent color too (default false)
user_pref("widget.gtk.alt-theme.accent", true); // Linux only; default, pinned
user_pref("gfx.webrender.compositor.force-enabled", true);
user_pref("sidebar.revamp", true); // default, pinned: userChrome.css needs the new sidebar
user_pref("sidebar.verticalTabs", true);
user_pref("sidebar.position_start", true); // default, pinned: userChrome.css expects the sidebar on the left
user_pref("sidebar.visibility", "always-show"); // default, pinned: userChrome.css is tuned for always-show (or expand-on-hover)
