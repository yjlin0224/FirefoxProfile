# FirefoxProfile

Firefox Developer Edition 的介面自訂：`userChrome.css`（瀏覽器介面）、`userContent.css`（新分頁、about: 頁面、DevTools、檢視原始碼）和 `user.js`（偏好設定）。

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
| `reference/` | `task prefs:dump` 產生的設定頁面對照表（不會部署）：`about-preferences.defaults.js` 是 about:preferences 每個項目對應的 pref 與預設值，`about-preferences.current.js` 是同樣的行換成目前的值（含個人設定，不 commit，已列在 `.gitignore`） |
| `scripts/` | 部署、即時重新載入、量測工具，說明見 [`scripts/README.md`](scripts/README.md) |
| `Taskfile.yaml` | 所有操作的入口 |

## 適用版本

目前以 Firefox Developer Edition 159（Windows 11）為基準。調校時的完整環境（縮放比例、佈景主題、側邊欄設定等）寫在 `userChrome.css`、`userContent.css` 開頭的「TUNED FOR」；`reference/about-preferences.defaults.js` 開頭記錄產生時的確切版本與建置編號。

Firefox 更新到新的主要版本後：

1. 開啟 Browser Toolbox，用 `scripts/` 的量測工具對照兩個 CSS 開頭的設計規格，修正跑掉的地方，做法見各檔開頭的「Firefox 更新後壞掉時怎麼修」。
2. `task userjs:check`：找出型別不符、已經失效或已經等於預設值的設定。
3. `task prefs:dump`，再用 `git diff reference/` 看設定頁面新增、移除或改變了哪些項目。
4. `task mods:check`：第三方樣式常會配合新版 Firefox 修正，有更新就用 `task mods:update` 下載並檢查差異。
5. 把這一節、`user.js` 開頭與兩個 CSS 開頭「TUNED FOR」的版本改成新版本。

## 第一次設定

1. 安裝 [Task](https://taskfile.dev)（`winget install Task.Task`）和 Node.js。量測用的點擊測試另外需要 Python 3。
2. 複製 `.env.template` 為 `.env`，填入 `FIREFOX_PROFILE`，也就是 profile 資料夾名稱（about:support →「設定檔資料夾」路徑的最後一段），例如 `profiles.dev-edition-default`。
3. `task deploy`，然後重新啟動 Firefox，讓 `user.js` 和 `toolkit.legacyUserProfileCustomizations.stylesheets` 生效。

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
| `task fmt` / `task fmt:check` | 用 Prettier（版本固定在 Taskfile，設定在 `.prettierrc.yaml`）格式化或檢查腳本、JSON、YAML；CSS、`user.js`、Markdown 不在範圍內 |
| `task userjs:check` | 檢查 `user.js`：語法、重複、空白（加 `-- --fix` 修正）；Firefox 開著時再和實際設定比對（加 `-- --offline` 略過）。不檢查順序：`user.js` 是手動分組的 |
| `task check` | 一次跑完 `fmt:check` 和 `userjs:check`，commit 前用 |

任何會連線到 Firefox 的指令都可以加 `PORT=1234` 指定 port，例如 `task watch PORT=1234`。

## 安全提醒

- 即時重新載入需要 `devtools.debugger.prompt-connection = false`，否則每次連線都要在 Firefox 裡按允許。關掉它時，任何本機程式都能在 Browser Toolbox 開著時控制瀏覽器：用完請改回 `true` 並關閉 Browser Toolbox。`user.js` 把它固定為 `true`，忘了改回來的話，重新啟動 Firefox 也會恢復；反過來說，工作途中重新啟動後要再關一次。
- Firefox 更新後如果版面跑掉，先看兩個 CSS 檔開頭的說明，用 `scripts/` 的量測工具對照設計規格。

## 待辦

- **歷史視窗（Library）的 Mica**：`userChrome.css` 已經寫好歷史視窗的半透明樣式（「Library Window: over Mica」那一段），但只在視窗根元素有 `windowsmica` 屬性時生效。Firefox 只替主視窗加這個屬性，CSS 又加不了屬性，所以目前這段規則平常不會套用，歷史視窗維持 Firefox 原本的樣子。要讓它自動生效，得在歷史視窗開啟時用腳本加上 `windowsmica`：例如 autoconfig，在 Firefox 安裝資料夾放 `defaults/pref/` 的設定和一個 `.cfg` 腳本。這需要修改這個 repo 目前管不到的安裝資料夾、另外的部署方式，而且腳本以最高權限執行、Firefox 升版後要確認仍有效，所以先不做。不加屬性就讓規則直接套用也不行：沒有 Mica 時，透明的地方會變成純黑或透出視窗後面雜亂的畫面（實測過）。
