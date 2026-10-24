# AIHOT-Docker

自動追蹤官方上游 [KKKKhazix/AIHOT](https://github.com/KKKKhazix/AIHOT) 最新程式碼，透過 GitHub Actions 雲端自動編譯並推送到 Docker Hub，專供 **Unraid**、**Portainer** 或各類 Linux Docker 主機快速開箱部署。

✨ **原生支援 Anthropic Messages API**：內建自動補丁機制，無需任何第三方 Gateway，直接以官方 API 直連 Claude 系列模型（Claude 3.5 Sonnet / Haiku）！
✨ **完美支援 Portainer 外部路徑**：Compose 已全面改用外部絕對路徑讀取 `.env`，解決 Portainer Web 編輯器找不到檔案的痛點。

---

## Portainer / Unraid 部署指南

### 步驟 1：建立 NAS 資料夾與 .env 檔案
在 Unraid / 伺服器終端機執行：
```bash
# 建立目錄
mkdir -p /mnt/user/appdata/aihot/data
mkdir -p /mnt/user/appdata/aihot/db

# 下載或建立 .env 檔案至實體路徑
cp .env.example /mnt/user/appdata/aihot/.env
```
用編輯器修改 `/mnt/user/appdata/aihot/.env`：
- `SITE_URL`：填寫您的實際訪問 IP 或網址（如 `http://192.168.1.100:3000`）。
- `ADMIN_PASSWORD`：管理員登入密碼（至少 12 位）。
- `LLM_BASE_URL`：`https://api.anthropic.com`
- `LLM_API_KEY`：填入您的 `sk-ant-api03-...` 金鑰
- `LLM_MODEL`：`claude-3-5-sonnet-20241022` 或 `claude-3-haiku-20240307`
- `COLLECT_ENABLED=true` 與 `MODEL_CALLS_ENABLED=true`。

---

### 步驟 2：在 Portainer 中建立 Stack

1. 打開 Portainer Web 介面 -> 進入 **Stacks** -> 點擊 **Add stack**。
2. Name 填寫：`aihot`。
3. Build method 選擇 **Web editor**。
4. 直接將本倉庫的 [`docker-compose.yml`](docker-compose.yml) 內容複製貼上。
5. 點擊最下方的 **Deploy the stack**！

> **說明**：Compose 預設已配置 `env_file: - /mnt/user/appdata/aihot/.env`，所有容器會自動讀取您 NAS 實體路徑中的設定檔，完全不需要在 Portainer 介面中重複貼上環境變數。

---

### 步驟 3：訪問服務
啟動完成後，在瀏覽器打開：
- 前台首頁：`http://<NAS_IP>:3000`
- 管理後台：`http://<NAS_IP>:3000/admin`（輸入您的 `ADMIN_PASSWORD` 登入）

---

## 維護與更新

- **日常修改設定（如更換 API Key）**：
  直接修改 NAS 上的 `/mnt/user/appdata/aihot/.env`，然後在 Portainer 的 Containers 頁面將 `aihot-api` 和 `aihot-worker` 點擊 **Restart** 即可，1 秒生效！
- **更新最新程式碼**：
  在 Portainer 進入 `aihot` Stack 頁面，點擊 **Editor**，開啟 **Re-pull image and redeploy** 並點擊 **Update the stack** 即可自動升級至最新版本。
