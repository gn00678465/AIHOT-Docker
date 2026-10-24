# AIHOT-Docker

自動追蹤官方上游 [KKKKhazix/AIHOT](https://github.com/KKKKhazix/AIHOT) 最新程式碼，透過 GitHub Actions 雲端自動編譯並推送到 Docker Hub，專供 **Unraid** 或各類 Linux Docker 主機快速開箱部署。

---

## 特性

- **零衝突**：獨立維護 Docker 建置腳本，不改動上游程式碼庫，無需手動同步 Fork。
- **免本地編譯**：由 GitHub Actions 雲端 Runner 完成編譯與映像檔打包，徹底解決 NAS / 本機編譯耗費 CPU 與記憶體的問題。
- **Unraid 開箱即用**：內建針對 Unraid appdata 路徑優化的 `docker-compose.yml`。

---

## 快速設定

### 1. 設定 GitHub Secrets
進入本倉庫的 **Settings** -> **Secrets and variables** -> **Actions**，新增以下兩個 Secrets：

| Secret 名稱 | 內容說明 |
| :--- | :--- |
| `DOCKERHUB_USERNAME` | 您的 Docker Hub 帳號名稱 |
| `DOCKERHUB_TOKEN` | 您的 Docker Hub Personal Access Token（需具備 Read & Write 權限） |

並確認您已在 Docker Hub 上建立名為 `aihot-docker` 的 Repository。

### 2. 觸發自動建置
- **手動打包**：前往 GitHub 倉庫的 **Actions** 分頁，選擇 **Build AIHOT to Docker Hub**，點擊 **Run workflow**。約 3~5 分鐘即可在 Docker Hub 看到新產出的映像檔。
- **排程打包**：每週日自動追蹤官方 main 分支最新更新並自動打包。

---

## Unraid 部署指南

### 1. 建立資料夾
在 Unraid 的終端機或檔案管理器建立目錄：
```bash
mkdir -p /mnt/user/appdata/aihot/data
mkdir -p /mnt/user/appdata/aihot/db
```

### 2. 配置環境變數
下載或複製本倉庫的 `.env.example` 為 `.env`，放置於 `/mnt/user/appdata/aihot/.env`，並修改：
- `SITE_URL`：填寫您的 Unraid 實際訪問 IP 或網址（如 `http://192.168.1.100:3000`）。
- `ADMIN_PASSWORD`：管理員登入密碼（至少 12 位）。
- `LLM_API_KEY`：填入您的 LLM API Key。
- `COLLECT_ENABLED=true` 與 `MODEL_CALLS_ENABLED=true`。

### 3. 使用 Docker Compose Manager 啟動
將本倉庫的 `docker-compose.yml` 複製到 Unraid 專案中，執行：
```bash
docker compose up -d
```
啟動後即可透過瀏覽器造訪：
- 前台首頁：`http://<Unraid_IP>:3000`
- 管理後台：`http://<Unraid_IP>:3000/admin`
