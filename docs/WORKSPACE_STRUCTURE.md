# 工作區結構

## 目錄概述

```
vibe-commerce/
├── frontend/                 # Next.js 16+ 前端應用程式 (Cloudflare Pages)
│   ├── src/
│   │   └── app/              # Next.js App Router
│   ├── public/               # 靜態資產
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   └── .env.local            # 環境變數
│
├── backend/                  # Cloudflare Workers 後端應用程式
│   ├── src/
│   │   └── index.ts          # Workers 入點
│   ├── wrangler.toml         # Wrangler 配置
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── docs/                     # 文檔
│   └── MASTER_BLUEPRINT.md   # 系統架構藍圖
│
└── .gitignore
```

## 各組件說明

### 前端 (Frontend)

- **框架**：Next.js 16+ with TypeScript
- **樣式**：Tailwind CSS 4
- **認證**：Clerk Auth
- **位置**：`/workspaces/vibe-commerce/frontend`
- **主要文件**：
  - `src/app/layout.tsx` - 根佈局（已配置 ClerkProvider）
  - `src/app/page.tsx` - 首頁
  - `.env.local` - 環境變數（需要添加 Clerk 密鑰）

### 後端 (Backend)

- **框架**：Cloudflare Workers
- **數據庫**：Cloudflare D1
- **語言**：TypeScript
- **位置**：`/workspaces/vibe-commerce/backend`
- **主要文件**：
  - `src/index.ts` - Workers 主程式
  - `wrangler.toml` - Wrangler 配置（含 D1 綁定）

## 開發準備

### 必需操作

1. **配置 Clerk Auth**
   - 在 Clerk Dashboard 創建應用程式
   - 複製 API 密鑰到前端 `.env.local` 和後端 `wrangler.toml`

2. **初始化 D1 資料庫**
   - 在 Cloudflare Dashboard 創建 D1 資料庫
   - 更新 `backend/wrangler.toml` 中的 `database_id`

3. **安裝依賴**
   - 前端：已通過 create-next-app 安裝
   - 後端：執行 `npm install` 在 `/backend` 目錄

## 下一步

- 建立資料庫模式和遷移
- 實施 API 端點和中介軟體
- 開發前端 UI 組件
- 集成 Gemini API 進行 AI 功能
