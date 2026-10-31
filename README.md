# FirefoxProfile

Firefox Developer Edition 的介面自訂：`userChrome.css`（瀏覽器介面）、`userContent.css`（新分頁、about: 頁面、DevTools、檢視原始碼）、`user.js`（偏好設定），以及 Firefox 安裝資料夾的 autoconfig（`install/`，替 CSS 加上它需要、卻加不了的屬性）。

**這個 repo 是唯一的來源。** 只在這裡修改，再用 `task` 部署到 `.env` 指定的 profile；不要直接改 profile 資料夾裡的檔案，下次部署會被覆蓋。

`profile/` 對應 Firefox 的 profile 資料夾：裡面的檔案（`user.js`）會被複製過去，資料夾（`chrome/`）會完全同步；profile 資料夾裡其他 Firefox 自己的檔案（`prefs.js` 等）不會被碰到。`profile/` 只能放 `user.js` 和 `chrome/`：多出其他東西時部署會拒絕執行，`.gitignore` 也不會收錄，以免不小心放進來的 `prefs.js`、`logins.json`、`key4.db` 等含有個人資料的檔案覆蓋 profile 或被 commit。

## 目錄

| 路徑 | 內容 |
| --- | --- |
| `profile/chrome/userChrome.css` | 瀏覽器介面。開頭有適用環境、設計規格和「Firefox 更新後壞掉時怎麼修」 |
| `profile/chrome/selected-tab-border.css` | 選取中分頁（和打開的 Firefox View 按鈕）會旋轉的漸層框線，由 `userChrome.css` 開頭 `@import`；適用環境和設計規格寫在 `userChrome.css` 開頭 |
| `profile/chrome/userContent.css` | 網頁內容：新分頁（nova）、about: 頁面字型、about:config、DevTools、檢視原始碼。開頭同樣有規格和修理說明 |
| `profile/chrome/UserChromes/` | 第三方樣式（由 `userChrome.css` `@import`），來源網址與目前版本對應的上游 commit 列在 `scripts/mods.json` |
| `profile/user.js` | 每次啟動都會套用的偏好設定 |
| `install/` | Firefox 安裝資料夾的 autoconfig（不會隨 `task deploy` 部署，用 `task autoconfig:install` 安裝）：`defaults/pref/autoconfig.js` 讓 Firefox 每次啟動時執行 `firefox.cfg`。這個腳本替歷史視窗和頁面資訊視窗加上 `windowsmica`、替顯示 about: 頁面的分頁加上 `transparent`，讓 CSS 裡等著這兩個屬性的樣式生效；也把「頁面資訊」加回網頁的右鍵選單（Firefox 從那裡拿掉了，Ctrl+I 和「工具」選單還能打開），並在分頁的右鍵選單加上「檢視原始碼」和「頁面資訊」（作用在按右鍵的那個分頁）；隱私視窗的新分頁則套用一般新分頁上傳的桌布（從新分頁的偏好設定讀出檔名，偏好設定一改就跟著換）；設定頁「備份」的自動備份，最多每隔 `browser.backup.scheduled.minimum-time-between-backups-seconds`（預設一天）做一次（Firefox 原本每次刪除資料，例如清 cookie、刪歷史紀錄或書籤，都會在 10 秒後重做一份，見 bug 2084241）。見下面「安全提醒」 |
| `reference/` | `task prefs:dump` 產生的設定頁面對照表（不會部署）：`about-preferences.defaults.js` 是 about:preferences 每個項目對應的 pref 與預設值，`about-preferences.current.js` 是同樣的行換成目前的值（含個人設定，不 commit，已列在 `.gitignore`） |
| `scripts/` | 部署、即時重新載入、量測工具，說明見 [`scripts/README.md`](scripts/README.md) |
| `Taskfile.yaml` | 所有操作的入口 |

## 適用版本

目前以 Firefox Developer Edition 159（Windows 11）為基準。調校時的完整環境（縮放比例、佈景主題、側邊欄設定等）寫在 `userChrome.css`、`userContent.css` 開頭的「TUNED FOR」；`reference/about-preferences.defaults.js` 開頭記錄產生時的確切版本與建置編號。

Firefox 更新到新的主要版本後：

1. 開啟 Browser Toolbox，用 `scripts/` 的量測工具對照兩個 CSS 開頭的設計規格，修正跑掉的地方，做法見各檔開頭的「Firefox 更新後壞掉時怎麼修」。
2. `task userjs:check`：找出型別不符、已經失效或已經等於預設值的設定。
3. `task prefs:dump`，再用 `git diff reference/` 看設定頁面新增、移除或改變了哪些項目。
4. 確認 autoconfig 還有效：Firefox 啟動時沒有跳出「無法讀取設定檔」，歷史視窗透出 Mica，about:preferences 等頁面透出 Mica。失效時對照 `install/firefox.cfg` 註解裡標的 Firefox 檔案修正。
5. `task mods:check`：第三方樣式常會配合新版 Firefox 修正，有更新就用 `task mods:update` 下載並檢查差異。
6. 把這一節、`user.js` 開頭與兩個 CSS 開頭「TUNED FOR」的版本改成新版本。

## 第一次設定

1. 安裝 [Task](https://taskfile.dev)（`winget install Task.Task`）和 Node.js。量測用的點擊測試另外需要 Python 3。
2. 複製 `.env.template` 為 `.env`，填入 `FIREFOX_PROFILE`，也就是 profile 資料夾名稱（about:support →「設定檔資料夾」路徑的最後一段），例如 `profiles.dev-edition-default`。
3. `task deploy`，然後重新啟動 Firefox，讓 `user.js` 和 `toolkit.legacyUserProfileCustomizations.stylesheets` 生效。
4. `task autoconfig:install`（會跳出系統管理員權限的確認），再重新啟動 Firefox。安裝資料夾不是預設的 `%ProgramFiles%Firefox Developer Edition` 時，在 `.env` 設定 `FIREFOX_INSTALL_DIR`。

## 日常流程

1. 在 Firefox 開啟 Browser Toolbox（Ctrl+Shift+Alt+I）。即時重新載入和量測都靠它的 RDP 連線，port 會自動偵測。
2. `task watch`：修改 `profile/` 裡的檔案並存檔，就會自動部署並即時套用，不必重開 Firefox（`user.js` 例外，要重開）。
3. 改完後 `task diff` 確認 profile 和 repo 一致，`task check` 通過，再自行 commit。

## 指令

| 指令 | 用途 |
| --- | --- |
| `task deploy` | 部署 `profile/`：`chrome/` 完全同步（profile 裡 repo 沒有的檔案會被刪除），`user.js` 複製，profile 裡其他 Firefox 自己的檔案不會動；Firefox 開著時即時重新載入有變動的樣式 |
| `task watch` | 監看並在每次存檔時部署和重新載入 |
| `task diff` | 列出部署會改動的檔案，不做任何修改 |
| `task reload` | 只重新載入 profile 裡已部署的樣式 |
| `task port` | 顯示 Browser Toolbox 的 RDP port |
| `task eval -- <腳本或運算式>` | 在 Firefox 裡執行 JavaScript，例如 `task eval -- toolbar-ruler.js` |
| `task capture -- …` | 擷取真實螢幕畫面 |
| `task click-test` | 用真實的滑鼠點擊測試分頁的點擊範圍 |
| `task wallpaper:position` | 列出新分頁的桌布庫：編號、位置、哪張套用中 |
| `task wallpaper:open -- [編號]` | 用預設的看圖程式開啟那張桌布；不寫編號就把整個桌布庫複製到 `scripts/out/wallpapers/` 並開啟資料夾，看縮圖對照編號。桌布檔案沒有副檔名，所以是複製一份加上副檔名再開，原檔不動 |
| `task wallpaper:position -- <位置> [編號]` | 設定桌布的位置（`left`、`topright` 等 9 種），不寫編號就是套用中那張。位置存在桌布檔名裡，Firefox 套用桌布和每次啟動時會依檔名重設 about:config 的值，所以要改檔名；需先關閉 Firefox |
| `task prefs:dump` | 解析 about:preferences（在背景開一個暫時分頁，用完關掉），依側邊欄的頁面、標題、項目列出對應的 pref，按鈕開啟的對話框中有 pref 的部分（字型、色彩、Proxy、清除資料、同步項目、網站權限預設值）也列在按鈕底下：對話框在暫時分頁裡開啟、讀完直接取消，不會儲存任何東西。寫成 `reference/` 的兩個檔案：預設值和目前的值，兩份行數相同可以直接 diff。目前的值會標出已修改、`user.js` 有設定、鎖定。Firefox 更新後重跑，`git diff reference/` 就能看出設定頁面改了什麼 |
| `task mods:check` | 檢查第三方樣式有沒有更新，不修改任何檔案：列出上游在目前版本之後改到該檔案的 commit（日期與說明），並標出在這裡被手動改過的檔案。透過 GitHub API 查詢，未登入時每小時限 60 次，可在 `.env` 設定 `GITHUB_TOKEN`，或先用 `gh auth login` 登入 GitHub CLI |
| `task ring:generate -- [顏色數]` | 重新產生 `selected-tab-border.css` 中標記為 generated 的部分：選取中分頁旋轉框線的漸層色標，和讓它們沿框線移動的公式（每個色標一組，所以用產生的）。顏色數是混色區的顏色數，預設 9；只有想改這個數量，或改了產生器時才需要 |
| `task mods:update` | 把第三方樣式下載為上游最新的版本，並把對應的 commit 記錄到 `scripts/mods.json`；在這裡被手動改過的檔案會略過，加 `-- --force` 才覆寫。用 `git diff` 檢查後再部署 |
| `task fmt` / `task fmt:check` | 用 Prettier（版本固定在 Taskfile，設定在 `.prettierrc.yaml`）格式化或檢查腳本（含 `install/firefox.cfg`）、JSON、YAML；CSS、`user.js`、Markdown 不在範圍內 |
| `task userjs:check` | 檢查 `user.js`：語法、重複、空白（加 `-- --fix` 修正）；Firefox 開著時再和實際設定比對（加 `-- --offline` 略過）。不檢查順序：`user.js` 是手動分組的 |
| `task autoconfig:install` | 把 `install/` 複製到 Firefox 安裝資料夾的相同位置。安裝資料夾在 `Program Files` 底下，所以會跳出 UAC 要求系統管理員權限；Firefox 重新啟動後生效。裝的是最新 commit 的內容，不是工作目錄：`install/` 或 `scripts/host/autoconfig.ps1` 有未 commit 的修改時會拒絕執行。跳出 UAC 前會印出 commit 和每個檔案的 SHA-256，等你按任意鍵才繼續（Ctrl+C 取消）；UAC 視窗只會顯示「Windows PowerShell」，看不出要裝什麼，所以先確認印出的內容。等按鍵需要終端機：在 Claude Code 用 `!` 執行時輸出要等指令結束才顯示，所以會直接停下，要在終端機執行，或加 `-- --yes` 不等按鍵。以系統管理員身分執行的腳本內容直接從 commit 傳入，要安裝的檔案也經過雜湊比對，檢查之後才被改動的內容裝不進去；錯誤會印在終端機上。Firefox 更新不會刪掉這兩個檔案（更新只刪自己清單 `precomplete` 上的檔案），解除安裝或換安裝位置後要重新安裝 |
| `task autoconfig:check` | 比對安裝資料夾裡的 autoconfig 和 `install/`，不修改任何檔案；沒裝或內容不同只會警告 |
| `task autoconfig:remove` | 從安裝資料夾刪除 `install/` 裡有的檔案（同樣需要系統管理員權限、同樣只用最新 commit），重新啟動 Firefox 後恢復原狀 |
| `task check` | 一次跑完 `fmt:check`、`userjs:check` 和 `autoconfig:check`，commit 前用 |

任何會連線到 Firefox 的指令都可以加 `PORT=1234` 指定 port，例如 `task watch PORT=1234`。

## 安全提醒

- 即時重新載入需要 `devtools.debugger.prompt-connection = false`，否則每次連線都要在 Firefox 裡按允許。關掉它時，任何本機程式都能在 Browser Toolbox 開著時控制瀏覽器：用完請改回 `true` 並關閉 Browser Toolbox。`user.js` 把它固定為 `true`，忘了改回來的話，重新啟動 Firefox 也會恢復；反過來說，工作途中重新啟動後要再關一次。
- `install/firefox.cfg` 每次啟動都以 Firefox 的最高權限、在沙盒外執行，能做任何事（讀 cookie、已儲存的密碼、所有分頁）。所以它只寫在這個檔案裡、不讀取也不執行任何其他檔案：profile 和這個 repo 是一般權限就能寫的地方，讓它載入那裡的檔案，等於讓任何程式都能取得整個瀏覽器；它本身在安裝資料夾裡，要系統管理員權限才能改。修改時維持這個原則，內容保持短到能逐行看懂。不想要它做的事時，在 about:config 把 `firefoxprofile.transparent_about_pages` 設成 `false`（about: 頁面的透明），或 `task autoconfig:remove`（全部）。
- Firefox 更新後如果版面跑掉，先看兩個 CSS 檔開頭的說明，用 `scripts/` 的量測工具對照設計規格。

