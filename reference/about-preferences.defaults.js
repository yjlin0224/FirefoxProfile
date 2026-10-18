// about:preferences：每個設定項目對應的 pref 與預設值
// Firefox 159.0b3 (20261016090327), zh-TW, win
// 由 `task prefs:dump` 從執行中的 Firefox 產生，不要手動修改。Firefox 更新後重新產生，
// 再用 `git diff reference/` 看設定頁面改了什麼。
//
// 收錄設定頁面上的控制項，以及按鈕開啟的對話框裡有 pref 的部分（字型、色彩、Proxy、清除資料、
// 同步項目、網站權限的「封鎖新請求」與自動播放）；例外清單、憑證、搜尋引擎等不是 pref，不收。
// 依側邊欄順序排列，子頁面接在上層頁面後面；同一個 pref 只在第一次出現時列出。
//   [隱藏]  目前在這台電腦上沒有顯示（條件不成立、平台不同或功能還沒開放）
//   [換算]  頁面上的選項不等於 pref 的值：Firefox 會換算，或一次寫入好幾個 pref
//   [反向]  勾選 = pref 為 false
// 對照目前的值：about-preferences.current.js（同樣的行，可以直接 diff）


// ════════════════════════════════════════════════════════════════════════════
// 帳號與同步 (about:preferences#sync)
// ════════════════════════════════════════════════════════════════════════════

// ── 同步 ──
// 管理要同步的資料（對話框）
//   書籤
user_pref("services.sync.engine.bookmarks", true);
//   瀏覽紀錄
user_pref("services.sync.engine.history", true);
//   開啟的分頁
user_pref("services.sync.engine.tabs", true);
//   密碼
user_pref("services.sync.engine.passwords", true);
//   地址
user_pref("services.sync.engine.addresses", false);
//   付款方式
user_pref("services.sync.engine.creditcards", false);
//   附加元件
user_pref("services.sync.engine.addons", true);
//   選項
user_pref("services.sync.engine.prefs", true);


// ════════════════════════════════════════════════════════════════════════════
// 帳號與同步 › 設定檔 (about:preferences#profiles)
// ════════════════════════════════════════════════════════════════════════════
// （沒有可以用 pref 設定的項目）


// ════════════════════════════════════════════════════════════════════════════
// 首頁與啟動 (about:preferences#home)
// ════════════════════════════════════════════════════════════════════════════

// ── 啟動 ──
// 開啟先前的視窗與分頁 [換算]
user_pref("browser.startup.page", 1);
//   也開啟新分頁 [隱藏]
user_pref("browser.sessionstore.newTabOnRestore", false);
// 電腦開機時自動開啟 Firefox Developer Edition：不是 pref（Windows 的開機啟動項目）
// 總是檢查 Firefox Developer Edition 是否為您的預設瀏覽器
user_pref("browser.shell.checkDefaultBrowser", true);

// ── 首頁 ──
// 新視窗 [換算]
//   選項：Firefox 首頁（預設） | 空白頁 | 自訂網址…
user_pref("browser.startup.homepage", "about:home");
// 新分頁 [換算]
//   選項：Firefox 首頁（預設） | 空白頁
user_pref("browser.newtabpage.enabled", true);

// ── Firefox 首頁 ──
// 搜尋
user_pref("browser.newtabpage.activity-stream.showSearch", true);
// 小工具
user_pref("browser.newtabpage.activity-stream.widgets.enabled", true);
//   天氣 [隱藏]
user_pref("browser.newtabpage.activity-stream.widgets.weather.enabled", true);
//   每日一圖
user_pref("browser.newtabpage.activity-stream.widgets.pictureOfTheDay.enabled", false);
//   金融 [隱藏]
user_pref("browser.newtabpage.activity-stream.widgets.stocks.enabled", false);
//   計時器
user_pref("browser.newtabpage.activity-stream.widgets.focusTimer.enabled", false);
//   時鐘
user_pref("browser.newtabpage.activity-stream.widgets.clocks.enabled", false);
//   清單
user_pref("browser.newtabpage.activity-stream.widgets.lists.enabled", false);
//   填字遊戲 [隱藏]
user_pref("browser.newtabpage.activity-stream.widgets.crossword.enabled", false);
//   搜尋 [隱藏]
user_pref("browser.newtabpage.activity-stream.widgets.recentSearches.enabled", false);
//   隱私權 [隱藏]
user_pref("browser.newtabpage.activity-stream.widgets.privacy.enabled", false);
// 捷徑
user_pref("browser.newtabpage.activity-stream.feeds.topsites", true);
//   捷徑
//     選項：1 1 行 | 2 2 行 | 3 3 行 | 4 4 行
user_pref("browser.newtabpage.activity-stream.topSitesRows", 1); // 1 行
// 文章 [隱藏]
user_pref("browser.newtabpage.activity-stream.feeds.section.topstories", true);
// 支持 Firefox [換算]
user_pref("browser.newtabpage.activity-stream.showSponsoredCheckboxes", true);
user_pref("browser.newtabpage.activity-stream.showSponsoredTopSites", true);
user_pref("browser.newtabpage.activity-stream.showSponsored", true);
//   贊助捷徑
//     見「首頁與啟動 › Firefox 首頁 › 支持 Firefox」：browser.newtabpage.activity-stream.showSponsoredTopSites
//   贊助內容 [隱藏]
//     見「首頁與啟動 › Firefox 首頁 › 支持 Firefox」：browser.newtabpage.activity-stream.showSponsored
// 近期動態
user_pref("browser.newtabpage.activity-stream.feeds.section.highlights", false);
//   近期動態
//     選項：1 1 行 | 2 2 行 | 3 3 行 | 4 4 行
user_pref("browser.newtabpage.activity-stream.section.highlights.rows", 1); // 1 行
//   造訪過的頁面
user_pref("browser.newtabpage.activity-stream.section.highlights.includeVisited", true);
//   書籤
user_pref("browser.newtabpage.activity-stream.section.highlights.includeBookmarks", true);
//   最新下載
user_pref("browser.newtabpage.activity-stream.section.highlights.includeDownloads", true);
// Firefox Developer Edition 圖示 [反向]
user_pref("browser.newtabpage.activity-stream.hideLogo", false);


// ════════════════════════════════════════════════════════════════════════════
// 首頁與啟動 › 自訂首頁 (about:preferences#customHomepage)
// ════════════════════════════════════════════════════════════════════════════
// （沒有可以用 pref 設定的項目）


// ════════════════════════════════════════════════════════════════════════════
// 搜尋 (about:preferences#search)
// ════════════════════════════════════════════════════════════════════════════

// ── 預設搜尋引擎 ──
// 預設搜尋引擎：不是 pref（存在 search.json.mozlz4）
// 在結果頁的網址列顯示搜尋詞彙
user_pref("browser.urlbar.showSearchTerms.enabled", true);
// 於隱私瀏覽視窗使用不同的預設搜尋引擎 [隱藏]
user_pref("browser.search.separatePrivateDefault.enabled", false);
//   隱私瀏覽視窗中的預設搜尋引擎：不是 pref（存在 search.json.mozlz4）

// ── 搜尋引擎建議 ──
// 顯示搜尋建議 [換算]
user_pref("browser.search.suggest.enabled", true);
user_pref("browser.urlbar.suggest.searches", true);
//   在網址列結果中顯示搜尋建議 [隱藏] [換算]
//     見「搜尋 › 搜尋引擎建議 › 顯示搜尋建議」：browser.urlbar.suggest.searches
//   在網址列顯示的結果中，將搜尋建議放在瀏覽紀錄前面 [換算]
user_pref("browser.urlbar.showSearchSuggestionsFirst", true);
//   隱私瀏覽視窗中的搜尋建議
user_pref("browser.search.suggest.enabled.private", false);
//   熱門搜尋建議
user_pref("browser.urlbar.suggest.trending", true);

// 網址列
//   瀏覽紀錄
user_pref("browser.urlbar.suggest.history", true);
//   書籤
user_pref("browser.urlbar.suggest.bookmark", true);
//   剪貼簿 [隱藏]
user_pref("browser.urlbar.suggest.clipboard", true);
//   開啟的分頁
user_pref("browser.urlbar.suggest.openpage", true);
//   捷徑
user_pref("browser.urlbar.suggest.topsites", true);
//   最近搜尋內容
user_pref("browser.urlbar.suggest.recentsearches", true);
//   建議要使用的搜尋引擎
user_pref("browser.urlbar.suggest.engines", true);
//   快速操作
user_pref("browser.urlbar.suggest.quickactions", true);
//   來自 Firefox Developer Edition 的建議 [隱藏]
user_pref("browser.urlbar.suggest.quicksuggest.all", false);
//     來自贊助商的建議 [隱藏]
user_pref("browser.urlbar.suggest.quicksuggest.sponsored", false);
//     一邊打字，一邊從 Mozilla 取得建議 [隱藏]
user_pref("browser.urlbar.quicksuggest.online.enabled", true);

// ── 網址列導航 ──
// 使用 Tab 鍵移動焦點時，跳過結果選單 [反向]
user_pref("browser.urlbar.resultMenu.keyboardAccessible", true);


// ════════════════════════════════════════════════════════════════════════════
// 隱私權與安全性 (about:preferences#privacy)
// ════════════════════════════════════════════════════════════════════════════

// ── 加強型追蹤保護 ──
// 在網址列顯示追蹤器封鎖數量 [隱藏]
user_pref("browser.urlbar.trackerCount.enabled", true);

// ── 內建 VPN ──
// 自動開啟 VPN
//   當我開啟 Firefox Developer Edition 時
user_pref("browser.ipProtection.autoStartEnabled", false);
//   於隱私視窗中
user_pref("browser.ipProtection.autoStartPrivateEnabled", false);

// ── 瀏覽資料 ──
// 清除瀏覽資料（對話框）
//   時間
//     選項："1" 一小時內 | "2" 兩小時內 | "3" 四小時內 | "4" 自 上午12:00 起 | "0" 所有歷史記錄
user_pref("privacy.sanitize.timeSpan", 1); // 一小時內
//   瀏覽與下載紀錄
user_pref("privacy.clearSiteData.browsingHistoryAndDownloads", false);
//   Cookie 與網站資料
user_pref("privacy.clearSiteData.cookiesAndStorage", true);
//   暫存的快取檔案與頁面
user_pref("privacy.clearSiteData.cache", true);
//   儲存的表單資訊
user_pref("privacy.clearSiteData.formdata", false);
//   網站設定
user_pref("privacy.clearSiteData.siteSettings", false);
// 每次關閉 Firefox Developer Edition 時都清除 Cookie 與網站資料 [換算]
user_pref("privacy.clearOnShutdown_v2.cookiesAndStorage", true);
user_pref("privacy.clearOnShutdown_v2.cache", true);
user_pref("privacy.sanitize.sanitizeOnShutdown", false);

// ── 瀏覽紀錄 ──
// 瀏覽紀錄 [換算]
//   選項：保留所有歷史記錄 | 自訂瀏覽紀錄行為 | 不保留歷史記錄
//   見「隱私權與安全性 › 瀏覽資料 › 每次關閉 Firefox Developer Edition 時都清除 Cookie 與網站資料」：privacy.sanitize.sanitizeOnShutdown
user_pref("privacy.history.custom", false);
user_pref("browser.privatebrowsing.autostart", false);
user_pref("places.history.enabled", true);
user_pref("browser.formfill.enable", true);

// ── 其他保護 ──
// 告訴網站不要銷售或分享我的資料
user_pref("privacy.globalprivacycontrol.enabled", false);
// 建議 Firefox Relay 轉寄信箱 [換算]
user_pref("signon.firefoxRelay.feature", "available");


// ════════════════════════════════════════════════════════════════════════════
// 隱私權與安全性 › 連線與軟體安全性 (about:preferences#connectionSecurity)
// ════════════════════════════════════════════════════════════════════════════

// ── 純 HTTPS 模式 ──
// 純 HTTPS 模式 [換算]
//   選項：在所有視窗都開啟純 HTTPS 模式 | 僅在隱私瀏覽視窗開啟純 HTTPS 模式 | 不要開啟純 HTTPS 模式
user_pref("dom.security.https_only_mode", false);
user_pref("dom.security.https_only_mode_pbm", false);

// ── Proxy 設定值 ──
// 設定 Proxy（對話框）
//   設定存取網際網路的代理伺服器
//     選項："0" 不使用 Proxy | "4" 自動偵測此網路的 Proxy 設定 | "5" 使用系統 Proxy 設定 | "1" 手動設定 Proxy | "2" Proxy 自動設定網址
user_pref("network.proxy.type", 5); // 使用系統 Proxy 設定
//   使用系統的網頁代理伺服器自動探索設定 [隱藏]
user_pref("network.proxy.system_wpad", false);
//   HTTP Proxy
user_pref("network.proxy.http", "");
//   埠
user_pref("network.proxy.http_port", 0);
//   也針對 HTTPS 連線使用此代理伺服器
user_pref("network.proxy.share_proxy_settings", false);
//   HTTPS Proxy
user_pref("network.proxy.ssl", "");
//   埠
user_pref("network.proxy.ssl_port", 0);
//   SOCKS 主機
user_pref("network.proxy.socks", "");
//   埠
user_pref("network.proxy.socks_port", 0);
//   network.proxy.socks_version
//     選項："4" SOCKS v4 | "5" SOCKS v5
user_pref("network.proxy.socks_version", 5); // SOCKS v5
//   2
user_pref("network.proxy.autoconfig_url", "");
//   直接連線
user_pref("network.proxy.no_proxies_on", "");
//   若已儲存密碼則不要提示驗證
user_pref("signon.autologin.proxy", false);
//   使用 SOCKS v4 時也代理 DNS 查詢
user_pref("network.proxy.socks_remote_dns", false);
//   使用 SOCKS v5 時也代理 DNS 查詢
user_pref("network.proxy.socks5_remote_dns", true);

// ── 隱私權面板設定 ──
// 顯示偵測到資料外洩的訊息
user_pref("browser.urlbar.trustPanel.breachAlerts", true);

// ── 詐欺內容與危險網站保護 ──
// 封鎖危險及詐騙內容 [換算]
user_pref("browser.safebrowsing.phishing.enabled", true);
user_pref("browser.safebrowsing.malware.enabled", true);
//   封鎖危險的下載項目
user_pref("browser.safebrowsing.downloads.enabled", true);
//   下載不安全或不常見的軟體時警告您 [換算]
user_pref("browser.safebrowsing.downloads.remote.block_uncommon", true);
user_pref("browser.safebrowsing.downloads.remote.block_potentially_unwanted", true);

// ── 憑證 ──
// 允許 Firefox Developer Edition 自動信任您安裝的第三方根憑證
user_pref("security.enterprise_roots.enabled", true);


// ════════════════════════════════════════════════════════════════════════════
// 隱私權與安全性 › DNS over HTTPS (about:preferences#dnsOverHttps)
// ════════════════════════════════════════════════════════════════════════════

// ── 進階設定 ──
// 使用下列方式開啟 DNS over HTTPS： [換算]
//   選項：預設 | 自訂 | 關閉
user_pref("network.trr.mode", 0);
user_pref("network.trr.uri", "");
// user_pref("doh-rollout.disable-heuristics", ?); // 沒有預設值
//   自訂 › 無法使用安全 DNS 時，總是警告我 [換算]
//     見「隱私權與安全性 › DNS over HTTPS › 進階設定 › 使用下列方式開啟 DNS over HTTPS：」：network.trr.mode
user_pref("network.trr_ui.fallback_was_checked", true);
//   自訂 › 選擇提供者： [換算]
//     見「隱私權與安全性 › DNS over HTTPS › 進階設定 › 使用下列方式開啟 DNS over HTTPS：」：network.trr.uri
user_pref("network.trr.custom_uri", "");
//   自訂 › 輸入自訂提供者網址 [隱藏] [換算]
//     見「隱私權與安全性 › DNS over HTTPS › 進階設定 › 使用下列方式開啟 DNS over HTTPS： › 選擇提供者：」：network.trr.custom_uri
//     見「隱私權與安全性 › DNS over HTTPS › 進階設定 › 使用下列方式開啟 DNS over HTTPS：」：network.trr.uri


// ════════════════════════════════════════════════════════════════════════════
// 隱私權與安全性 › 加強型追蹤保護 (about:preferences#etp)
// ════════════════════════════════════════════════════════════════════════════

// ── 進階設定 ──
// 加強型追蹤保護 [換算]
//   選項：標準（預設） | 嚴格 | 自訂
// user_pref("browser.contentblocking.category", ?); // 沒有預設值
//   嚴格 › 修正網站的主要問題（建議） [隱藏]
user_pref("privacy.trackingprotection.allow_list.baseline.enabled", true);
//     修正網站的小問題
user_pref("privacy.trackingprotection.allow_list.convenience.enabled", true);


// ════════════════════════════════════════════════════════════════════════════
// 隱私權與安全性 › 加強型追蹤保護 › 自訂追蹤保護 (about:preferences#etpCustomize)
// ════════════════════════════════════════════════════════════════════════════

// ── 追蹤保護 ──
// 修正網站的主要問題（建議）
//   見「隱私權與安全性 › 加強型追蹤保護 › 進階設定 › 加強型追蹤保護 › 修正網站的主要問題（建議）」：privacy.trackingprotection.allow_list.baseline.enabled
//   修正網站的小問題
//     見「隱私權與安全性 › 加強型追蹤保護 › 進階設定 › 加強型追蹤保護 › 修正網站的主要問題（建議） › 修正網站的小問題」：privacy.trackingprotection.allow_list.convenience.enabled
// Cookie [換算]
user_pref("network.cookie.cookieBehavior", 5);
//   Cookie
//     選項："0" 所有網站都可使用 Cookie | "4" 封鎖跨網站追蹤 Cookie | "5" 隔離跨網站 Cookie | "3" 封鎖來自未造訪過網站的 Cookie | "1" 封鎖所有跨網站 Cookie（可能會造成網站運作不正常） | "2" 封鎖所有 Cookie（會造成網站不正常）
//     見「隱私權與安全性 › 加強型追蹤保護 › 自訂追蹤保護 › 追蹤保護 › Cookie」：network.cookie.cookieBehavior
// 追蹤用內容 [換算]
user_pref("privacy.trackingprotection.enabled", false);
user_pref("privacy.trackingprotection.pbmode.enabled", true);
user_pref("privacy.trackingprotection.emailtracking.enabled", false);
user_pref("privacy.trackingprotection.emailtracking.pbmode.enabled", true);
user_pref("privacy.trackingprotection.socialtracking.enabled", false);
//   追蹤用內容 [換算]
//     選項：所有視窗 | 僅在隱私瀏覽視窗
//     見「隱私權與安全性 › 加強型追蹤保護 › 自訂追蹤保護 › 追蹤保護 › 追蹤用內容」：privacy.trackingprotection.enabled、privacy.trackingprotection.pbmode.enabled、privacy.trackingprotection.emailtracking.enabled、privacy.trackingprotection.emailtracking.pbmode.enabled、privacy.trackingprotection.socialtracking.enabled
// 加密貨幣採礦程式
user_pref("privacy.trackingprotection.cryptomining.enabled", true);
// 已知的數位指紋追蹤程式
user_pref("privacy.trackingprotection.fingerprinting.enabled", true);
// 疑似是數位指紋追蹤程式 [換算]
user_pref("privacy.fingerprintingProtection", false);
user_pref("privacy.fingerprintingProtection.pbmode", true);
//   疑似是數位指紋追蹤程式 [換算]
//     選項：所有視窗 | 僅在隱私瀏覽視窗
//     見「隱私權與安全性 › 加強型追蹤保護 › 自訂追蹤保護 › 追蹤保護 › 疑似是數位指紋追蹤程式」：privacy.fingerprintingProtection、privacy.fingerprintingProtection.pbmode


// ════════════════════════════════════════════════════════════════════════════
// 隱私權與安全性 › 瀏覽紀錄 (about:preferences#history)
// ════════════════════════════════════════════════════════════════════════════

// ── 進階設定 ──
// 總是使用隱私瀏覽模式 [隱藏]
//   見「隱私權與安全性 › 瀏覽紀錄 › 瀏覽紀錄」：browser.privatebrowsing.autostart
// 保留瀏覽與下載紀錄 [隱藏]
//   見「隱私權與安全性 › 瀏覽紀錄 › 瀏覽紀錄」：places.history.enabled
// 保留我的搜尋列與表單輸入的內容 [隱藏]
//   見「隱私權與安全性 › 瀏覽紀錄 › 瀏覽紀錄」：browser.formfill.enable
// 結束 Firefox Developer Edition 時清除歷史記錄 [隱藏]
//   見「隱私權與安全性 › 瀏覽資料 › 每次關閉 Firefox Developer Edition 時都清除 Cookie 與網站資料」：privacy.sanitize.sanitizeOnShutdown
//   設定…（對話框）
//     時間 [隱藏]
//       選項："1" 一小時內 | "2" 兩小時內 | "3" 四小時內 | "4" 自 上午12:00 起 | "0" 所有歷史記錄
//       見「隱私權與安全性 › 瀏覽資料 › 清除瀏覽資料（對話框） › 時間」：privacy.sanitize.timeSpan
//     瀏覽與下載紀錄
user_pref("privacy.clearOnShutdown_v2.browsingHistoryAndDownloads", true);
//     Cookie 與網站資料
//       見「隱私權與安全性 › 瀏覽資料 › 每次關閉 Firefox Developer Edition 時都清除 Cookie 與網站資料」：privacy.clearOnShutdown_v2.cookiesAndStorage
//     暫存的快取檔案與頁面
//       見「隱私權與安全性 › 瀏覽資料 › 每次關閉 Firefox Developer Edition 時都清除 Cookie 與網站資料」：privacy.clearOnShutdown_v2.cache
//     儲存的表單資訊
user_pref("privacy.clearOnShutdown_v2.formdata", false);
//     網站設定
user_pref("privacy.clearOnShutdown_v2.siteSettings", false);


// ════════════════════════════════════════════════════════════════════════════
// 隱私權與安全性 › 管理網站規則 (about:preferences#vpnSiteRules)
// ════════════════════════════════════════════════════════════════════════════
// （沒有可以用 pref 設定的項目）


// ════════════════════════════════════════════════════════════════════════════
// 密碼與自動填寫 (about:preferences#passwordsAutofill)
// ════════════════════════════════════════════════════════════════════════════

// ── 密碼 ──
// 提示儲存密碼
user_pref("signon.rememberSignons", true);
//   儲存並自動填寫使用者名稱與密碼
user_pref("signon.autofillForms", true);
//   建議一組安全的密碼
user_pref("signon.generation.enabled", true);
// 需要驗證登入資訊才能管理密碼 [換算]：要通過作業系統驗證才會寫入，而且 Firefox 會鎖定它，user.js 設不了
user_pref("signon.management.page.os-auth.locked.enabled", false);
// 允許使用 Windows 單一登入系統，登入微軟、工作單位、學校提供的帳號
user_pref("network.http.windows-sso.enabled", false);
// 其他保護
//   針對發生過資料外洩的網站顯示密碼警告
user_pref("signon.management.page.breach-alerts.enabled", true);

// ── 付款方式 ──
// 儲存並自動填寫付款資訊
user_pref("extensions.formautofill.creditCards.enabled", true);
//   自動填寫與管理付款資訊時，需進行裝置登入驗證 [換算]：要通過作業系統驗證才會寫入，而且 Firefox 會鎖定它，user.js 設不了
user_pref("extensions.formautofill.creditCards.os-auth.locked.enabled", false);
//   儲存安全碼 [隱藏]
user_pref("extensions.formautofill.creditCards.cvv.enabled", true);

// ── 地址與更多資訊 ──
// 儲存並自動填寫地址
user_pref("extensions.formautofill.addresses.enabled", true);

// ── 個人資訊 ──
// 儲存並自動填寫個人資訊 [隱藏] [換算]
user_pref("extensions.formautofill.passports.enabled", false);


// ════════════════════════════════════════════════════════════════════════════
// 密碼與自動填寫 › 管理地址與更多資訊 (about:preferences#manageAddresses)
// ════════════════════════════════════════════════════════════════════════════
// （沒有可以用 pref 設定的項目）


// ════════════════════════════════════════════════════════════════════════════
// 密碼與自動填寫 › 管理個人資訊 (about:preferences#managePersonalInfo)
// ════════════════════════════════════════════════════════════════════════════
// （沒有可以用 pref 設定的項目）


// ════════════════════════════════════════════════════════════════════════════
// 密碼與自動填寫 › 管理付款方式 (about:preferences#managePayments)
// ════════════════════════════════════════════════════════════════════════════
// （沒有可以用 pref 設定的項目）


// ════════════════════════════════════════════════════════════════════════════
// 外觀設定 (about:preferences#appearance)
// ════════════════════════════════════════════════════════════════════════════

// ── 網站外觀 ──
// 網站外觀 [換算]
//   選項：系統 | 亮色 | 暗色
user_pref("layout.css.prefers-color-scheme.content-override", 2);

// ── 視窗密度 ──
// 視窗密度 [換算]
//   選項：自動（預設值） | 標準 | 緊密 | 觸控
user_pref("browser.uidensity", 0);
//   標準 › 在平板電腦模式中使用觸控大小 [隱藏]
user_pref("browser.touchmode.auto", false);


// ════════════════════════════════════════════════════════════════════════════
// 外觀設定 › 更多圖示 (about:preferences#browserIcon)
// ════════════════════════════════════════════════════════════════════════════

// ── 標準 ──
// 標準 [換算]
//   選項：預設 | 2004 懷舊版 | 2017 懷舊版 | 彩虹驕傲 | 極簡
// user_pref("browser.shell.customIcon.id", ?); // 沒有預設值

// ── 獎勵 ──
// 獎勵 [換算]
//   選項：Kit | 像素化 | Momo
//   見「外觀設定 › 更多圖示 › 標準 › 標準」：browser.shell.customIcon.id


// ════════════════════════════════════════════════════════════════════════════
// 下載 (about:preferences#downloads)
// ════════════════════════════════════════════════════════════════════════════

// ── 儲存檔案到 ──
// 儲存檔案到 [換算]
// user_pref("browser.download.dir", ?); // 沒有預設值
// 下載檔案前，先詢問要將檔案儲存至何處。 [反向]
user_pref("browser.download.useDownloadDir", true);
// 關閉隱私視窗時清除下載項目 [換算]
user_pref("browser.download.deletePrivate", false);
// user_pref("browser.download.deletePrivate.chosen", ?); // 沒有預設值

// ── 檔案與應用程式 ──
// Firefox Developer Edition 應如何處理其他檔案？
//   選項：false 自動儲存檔案 | true 詢問要直接開啟還是儲存檔案
user_pref("browser.download.always_ask_before_handling_new_types", false); // 自動儲存檔案


// ════════════════════════════════════════════════════════════════════════════
// 分頁與瀏覽 (about:preferences#tabsBrowsing)
// ════════════════════════════════════════════════════════════════════════════

// ── 瀏覽器版面 ──
// 瀏覽器版面 [換算]
//   選項：水平分頁標籤 | 垂直分頁標籤
user_pref("sidebar.verticalTabs", false);

// ── 分頁 ──
// 開啟
//   以分頁開啟鏈結，而不使用新視窗 [換算]
user_pref("browser.link.open_newwindow", 3);
//   用新分頁開啟鏈結或媒體內容後，自動切換至該分頁 [反向]
user_pref("browser.tabs.loadInBackground", true);
//   將應用程式開啟的分頁，開啟於目前瀏覽分頁旁 [換算]
user_pref("browser.link.open_newwindow.override.external", -1);
//   開啟多個分頁時，警告我可能會拖慢 Firefox Developer Edition
user_pref("browser.tabs.warnOnOpen", true);
// 互動
//   按下 Ctrl+Tab 時，依照最近使用分頁的順序切換分頁標籤
user_pref("browser.ctrlTab.sortByRecentlyUsed", false);
//   當滑鼠移動到分頁標籤上時，顯示分頁預覽
user_pref("browser.tabs.hoverPreview.showThumbnails", true);
//   Use AI to suggest tabs and a name for tab groups [隱藏]
user_pref("browser.tabs.groups.smart.userEnabled", true);
//   將分頁拖曳到一起，即可建立分頁群組
user_pref("browser.tabs.dragDrop.createGroup.enabled", true);
//   在 Windows 工作列顯示分頁預覽圖
user_pref("browser.taskbar.previews.enable", false);
// 容器
//   使用容器分頁 [換算]
user_pref("privacy.userContext.enabled", true);
// 關閉
//   關閉多個分頁前先問我
user_pref("browser.tabs.warnOnClose", false);
//   按 {$quitKey} 離開之前先問我 [隱藏]
user_pref("browser.warnOnQuitShortcut", false);

// ── 頁面導航 ──
// 總是使用鍵盤方向鍵瀏覽網頁（鍵盤瀏覽）
user_pref("accessibility.browsewithcaret", false);
// 打字時直接搜尋頁面文字（隨打即找）
user_pref("accessibility.typeaheadfind", false);
// 開啟預覽鏈結功能
user_pref("browser.ml.linkPreview.enabled", true);
//   允許 AI 讀取頁面頂部，產生頁面重點 [隱藏]
user_pref("browser.ml.linkPreview.optin", false);
//   快速預覽：長按鏈結 1 秒鐘
user_pref("browser.ml.linkPreview.longPress", true);
// 選擇文字時顯示操作選單 [隱藏]
user_pref("browser.highlightToSearch.enabled", true);
//   選擇文字時顯示操作選單
user_pref("browser.ml.chat.shortcuts", true);

// ── 媒體 ──
// 使用子母畫面
user_pref("media.videocontrols.picture-in-picture.video-toggle.enabled", true);
//   切換分頁時，於子母畫面中繼續播放影片
user_pref("media.videocontrols.picture-in-picture.enable-when-switching-tabs.enabled", false);
// 播放 DRM 內容
user_pref("media.eme.enabled", true);

// ── 效能 ──
// 使用推薦的效能設定 [換算]
user_pref("browser.preferences.defaultPerformanceSettings.enabled", true);
user_pref("dom.ipc.processCount", 8);
user_pref("layers.acceleration.disabled", false);
// 可用時開啟硬體加速 [隱藏] [反向]
//   見「分頁與瀏覽 › 效能 › 使用推薦的效能設定」：layers.acceleration.disabled

// ── 推薦 ──
// 隨您上網推薦擴充套件
user_pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons", true);
// 隨您上網推薦新功能
user_pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features", true);


// ════════════════════════════════════════════════════════════════════════════
// 分頁與瀏覽 › 容器設定 (about:preferences#containers)
// ════════════════════════════════════════════════════════════════════════════

// ── 容器 ──
// 選擇要分別使用哪個容器來開啟分頁
user_pref("privacy.userContext.newTabContainerOnLeftClick.enabled", false);
// 不要將來自外部應用程式的鏈結放入容器開啟
user_pref("browser.link.force_default_user_context_id_for_external_opens", false);


// ════════════════════════════════════════════════════════════════════════════
// 輔助功能 (about:preferences#accessibility)
// ════════════════════════════════════════════════════════════════════════════

// ── 預設縮放比例 ──
// 預設縮放比例：不是 pref（存在 content-prefs.sqlite）
// 只縮放文字 [換算]
user_pref("browser.zoom.full", true);

// ── 字型 ──
// 字體樣式
user_pref("font.name.sans-serif.zh-TW", "");
// 字體大小
user_pref("font.size.variable.zh-TW", 16);
// 進階設定（對話框）：字型 pref 名稱裡的語言代碼（例如 zh-TW）是對話框上方選的語言，其他語言換成對應代碼
//   對應此種語言
// user_pref("font.language.group", ?); // 沒有預設值
//   比例字型
//     選項："serif" 襯線字型 (Serif) | "sans-serif" 無襯線字型 (Sans Serif)
user_pref("font.default.zh-TW", "sans-serif"); // 無襯線字型 (Sans Serif)
//   大小
//     見「輔助功能 › 字型 › 字體大小」：font.size.variable.zh-TW
//   襯線字型
user_pref("font.name.serif.zh-TW", "");
//   無襯線字型
//     見「輔助功能 › 字型 › 字體樣式」：font.name.sans-serif.zh-TW
//   等寬字型
user_pref("font.name.monospace.zh-TW", "");
//   大小
user_pref("font.size.monospace.zh-TW", 16);
//   最小字型大小
user_pref("font.minimum-size.zh-TW", 0); // 無
//   忽略您上面的選擇，優先使用頁面指定的字型 [換算]
user_pref("browser.display.use_document_fonts", 1);

// ── 網站對比 ──
// 覆蓋色彩
//   選項：0 自動（使用系統設定） | 1 關閉 | 2 自訂
user_pref("browser.display.document_color_use", 0); // 自動（使用系統設定）
//   自訂 › 管理色彩（對話框）
//     文字
user_pref("browser.display.foreground_color", "#000000");
//     背景
user_pref("browser.display.background_color", "#FFFFFF");
//     未拜訪鏈結
user_pref("browser.anchor_color", "#0000EE");
//     已拜訪鏈結
user_pref("browser.visited_color", "#551A8B");

// ── 鍵盤導航與捲動 ──
// 需要時顯示觸控鍵盤
user_pref("ui.osk.enabled", true);
// 使用 Tab 鍵在表單控制元件與鏈結間移動焦點 [隱藏] [換算]
user_pref("accessibility.tabfocus", 7);
// 使用鍵盤、耳機或虛擬介面控制媒體內容播放行為
user_pref("media.hardwaremediakeys.enabled", true);
// 使用自動捲動
user_pref("general.autoScroll", true);
// 總是顯示捲動列 [隱藏] [反向]
user_pref("widget.gtk.overlay-scrollbars.enabled", true);

// ── 移動與鏈結樣式 ──
// 總是幫鏈結加上底線
user_pref("layout.css.always_underline_links", false);
// 使用平滑捲動
user_pref("general.smoothScroll", true);


// ════════════════════════════════════════════════════════════════════════════
// 語言 (about:preferences#languages)
// ════════════════════════════════════════════════════════════════════════════

// ── 瀏覽器語言 ──
// 偏好語言 [隱藏] [換算]
// user_pref("intl.locale.requested", ?); // 沒有預設值
// 備用語言 [隱藏] [換算]
//   見「語言 › 瀏覽器語言 › 偏好語言」：intl.locale.requested
// 使用您作業系統的「正體中文」語系來顯示日期、時間、數字、單位。 [隱藏]
user_pref("intl.regional_prefs.use_os_locales", false);

// ── 網站語言 ──
// 網站語言 [換算]
user_pref("intl.accept_languages", "und");

// ── 翻譯 ──
// 提供全頁翻譯
user_pref("browser.translations.automaticallyPopup", true);

// ── 拼字檢查 ──
// 打字時即時檢查拼字 [換算]
user_pref("layout.spellcheckDefault", 1);


// ════════════════════════════════════════════════════════════════════════════
// 語言 › 更多翻譯設定 (about:preferences#translations)
// ════════════════════════════════════════════════════════════════════════════
// （沒有可以用 pref 設定的項目）


// ════════════════════════════════════════════════════════════════════════════
// AI 控制 (about:preferences#ai)
// ════════════════════════════════════════════════════════════════════════════

// 封鎖 AI 強化功能 [換算]
user_pref("browser.ai.control.default", "available");
// 本機裝置上的 AI
//   翻譯 [換算]
//     選項：可用 | 封鎖
user_pref("browser.ai.control.translations", "default");
//   語音辨識 [換算]
//     選項：可用 | 封鎖
user_pref("browser.ai.control.speechRecognition", "default");
//   Firefox Developer Edition PDF 檢視器中的圖片替代文字 [隱藏] [換算]
//     選項：可用 | 啟用 | 封鎖
user_pref("browser.ai.control.pdfjsAltText", "default");
//   分頁群組建議 [隱藏] [換算]
//     選項：可用 | 啟用 | 封鎖
user_pref("browser.ai.control.smartTabGroups", "default");
//   預覽鏈結當中的重點資訊 [隱藏] [換算]
//     選項：可用 | 啟用 | 封鎖
user_pref("browser.ai.control.linkPreviewKeyPoints", "default");
// 智慧視窗
//   智慧視窗 [隱藏] [換算]
//     選項：可用 | 封鎖
user_pref("browser.ai.control.smartWindow", "default");
// 側邊欄中的 AI 聊天機器人
//   側邊欄中的聊天機器人 [換算]
//     選項：可用 | 封鎖
user_pref("browser.ai.control.sidebarChatbot", "default");
user_pref("browser.ml.chat.provider", "");


// ════════════════════════════════════════════════════════════════════════════
// AI 控制 › 智慧視窗 (about:preferences#personalizeSmartWindow)
// ════════════════════════════════════════════════════════════════════════════

// ── 預設設定 ──
// 預設使用智慧視窗
user_pref("browser.smartwindow.isDefaultWindow", false);
// 自動開啟助理
user_pref("browser.smartwindow.sidebar.openByDefault", true);
// 選擇文字時顯示捷徑
user_pref("browser.ml.chat.shortcuts.smartwindow", true);

// ── 助理模型 ──
// 助理模型 [換算]
//   選項：Mistral Small 4：個人化 | Gemini 3.1 Flash Lite：快速 | Qwen 3 235B：靈活 | 自訂：使用您自己的 LLM 模型
// user_pref("browser.smartwindow.firstrun.modelChoice", ?); // 沒有預設值

// ── 記憶 ──
// 從智慧視窗的對話學習
user_pref("browser.smartwindow.memories.generateFromConversation", true);
// 了解傳統上網方式與智慧視窗的差異
user_pref("browser.smartwindow.memories.generateFromHistory", true);


// ════════════════════════════════════════════════════════════════════════════
// AI 控制 › 智慧視窗 › 管理記憶 (about:preferences#manageMemories)
// ════════════════════════════════════════════════════════════════════════════
// （沒有可以用 pref 設定的項目）


// ════════════════════════════════════════════════════════════════════════════
// 權限與資料 (about:preferences#permissionsData)
// ════════════════════════════════════════════════════════════════════════════

// ── 權限 ──
// 位置（對話框）
//   封鎖新網站取得您所在位置的請求 [換算]
//     選項：0（不勾：每次詢問） | 2（勾選：封鎖）
user_pref("permissions.default.geo", 0);
// 攝影機（對話框）
//   封鎖新網站使用您攝影機的請求 [換算]
//     選項：0（不勾：每次詢問） | 2（勾選：封鎖）
user_pref("permissions.default.camera", 0);
// 裝置應用程式與服務（對話框）
//   要在此裝置封鎖要連入應用程式或服務的新請求嗎？ [換算]
//     選項：0（不勾：每次詢問） | 2（勾選：封鎖）
user_pref("permissions.default.loopback-network", 0);
// 區域網路裝置（對話框）
//   封鎖存取其他連結到您 Wi-Fi 或區域網路上的其他裝置當中的應用程式與服務的新請求。 [換算]
//     選項：0（不勾：每次詢問） | 2（勾選：封鎖）
user_pref("permissions.default.local-network", 0);
// 麥克風（對話框）
//   封鎖新網站使用您麥克風的請求 [換算]
//     選項：0（不勾：每次詢問） | 2（勾選：封鎖）
user_pref("permissions.default.microphone", 0);
// 通知（對話框）
//   封鎖新網站傳送通知的請求 [換算]
//     選項：0（不勾：每次詢問） | 2（勾選：封鎖）
user_pref("permissions.default.desktop-notification", 0);
// 自動播放（對話框）
//   對所有網站的預設行為
//     選項："1" 允許自動播放影音內容 | "2" 封鎖音訊 | "5" 封鎖影音內容
user_pref("media.autoplay.default", 1); // 允許自動播放影音內容
// 虛擬實境（對話框）
//   封鎖新網站使用您虛擬裝置的請求 [換算]
//     選項：0（不勾：每次詢問） | 2（勾選：封鎖）
user_pref("permissions.default.xr", 0);
// 封鎖彈出型視窗與第三方重新導向 [換算]
user_pref("dom.disable_open_during_load", true);
user_pref("dom.security.framebusting_intervention.enabled", true);
// 網站嘗試安裝擴充套件時，顯示警告
user_pref("xpinstall.whitelist.required", true);
// 暫停通知到 Firefox Developer Edition 重新啟動後 [隱藏]：不是 pref（只到 Firefox 重新啟動為止）

// Firefox Developer Edition 資料收集與使用
//   Firefox Developer Edition 資料收集與使用
user_pref("datareporting.healthreport.uploadEnabled", true);
//     允許個人化推薦的擴充套件 [換算]
user_pref("browser.discovery.enabled", true);
//     允許 Firefox Developer Edition 進行功能研究 [換算]
user_pref("app.shield.optoutstudies.enabled", true);
//   允許 Firefox Developer Edition 在新版本推出前改進功能、效能、穩定度 [換算]
user_pref("nimbus.rollouts.enabled", true);
//   傳送每日使用情況回報給 Mozilla
user_pref("datareporting.usage.uploadEnabled", true);
//   自動傳送錯誤報告
user_pref("browser.crashReports.unsubmittedCheck.autoSubmit2", false);


// ════════════════════════════════════════════════════════════════════════════
// Firefox 實驗室 (about:preferences#experimental)
// ════════════════════════════════════════════════════════════════════════════
// Firefox 實驗室的功能是 Nimbus 的選擇加入（enrollment），不是 pref，user.js 設不了。


// ════════════════════════════════════════════════════════════════════════════
// 關於 Firefox Developer Edition (about:preferences#about)
// ════════════════════════════════════════════════════════════════════════════

// ── Firefox Developer Edition 更新 ──
// 安裝
//   安裝：不是 pref（存在安裝資料夾的更新設定）
//     自動安裝更新（推薦） › 當 Firefox Developer Edition 未執行時：不是 pref（存在安裝資料夾的更新設定）


// ════════════════════════════════════════════════════════════════════════════
// Mozilla 的更多產品 (about:preferences#moreFromMozilla)
// ════════════════════════════════════════════════════════════════════════════
// （沒有可以用 pref 設定的項目）
