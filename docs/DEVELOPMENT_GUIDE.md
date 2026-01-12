# 開發指南

## 階段 1：基礎設施設置與核心服務

### 1.1 環境配置

#### 前端環境設置

在 `/frontend/.env.local` 添加以下變數：

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
NEXT_PUBLIC_API_URL=http://localhost:8787
```

#### 後端環境設置

更新 `/backend/wrangler.toml`：

```toml
[env.development]
name = "backend-dev"
routes = [
  { pattern = "http://localhost:8787/*", zone_name = "example.com" }
]

[d1_databases]
binding = "DB"
database_name = "vibe-commerce-db-dev"
database_id = "your-database-id"

[vars]
CLERK_SECRET_KEY = "your_clerk_secret"
CLERK_PUBLISHABLE_KEY = "your_clerk_key"
```

### 1.2 本地開發啟動

#### 啟動前端開發伺服器

```bash
cd frontend
npm run dev
# 訪問 http://localhost:3000
```

#### 啟動後端開發伺服器

```bash
cd backend
npm run dev
# 訪問 http://localhost:8787
```

## 階段 2：前端與基本電子商務功能

### 2.1 建立基本頁面結構

前端將包含以下主要頁面：

- `/` - 首頁 (產品展示、推薦)
- `/products` - 產品列表頁
- `/products/[id]` - 產品詳情頁
- `/cart` - 購物車頁
- `/checkout` - 結帳頁
- `/orders` - 訂單歷史頁
- `/profile` - 使用者檔案頁

### 2.2 Clerk 整合

前端已通過 ClerkProvider 配置。需要：

1. 在 Clerk Dashboard 創建應用程式
2. 配置回呼 URL：`http://localhost:3000/auth-callback`
3. 取得 Publishable Key 並添加到 `.env.local`

## 階段 3：高級功能與 AI 整合

### 3.1 Gemini API 整合

後端將需要集成 Google Gemini API：

```typescript
// 在 backend/src/ai.ts 中
export async function generateEmbedding(text: string): Promise<number[]> {
  // 使用 Gemini API 生成文本向量嵌入
}

export async function semanticSearch(
  query: string,
  db: D1Database
): Promise<Product[]> {
  // 執行語義搜尋
}
```

### 3.2 向量儲存與查詢

D1 將儲存產品的向量嵌入。需要實施向量相似度搜尋邏輯。

## 階段 4：優化、測試與部署

### 4.1 測試

```bash
# 單元測試
npm run test

# 整合測試
npm run test:integration

# E2E 測試
npm run test:e2e
```

### 4.2 部署到生產環境

#### 部署前端到 Cloudflare Pages

```bash
cd frontend
npm run build
wrangler pages deploy dist
```

#### 部署後端到 Cloudflare Workers

```bash
cd backend
npm run deploy
```

## API 端點文檔

### 公開端點

- `GET /health` - 健康檢查

### 受保護端點（需要 Clerk 令牌）

#### 產品

- `GET /api/products` - 獲取所有產品
- `GET /api/products/:id` - 獲取產品詳情
- `POST /api/products/search` - 語義搜尋產品

#### 訂單

- `GET /api/orders` - 獲取使用者訂單
- `POST /api/orders` - 創建新訂單
- `GET /api/orders/:id` - 獲取訂單詳情

#### AI 互動

- `POST /api/ai/search` - AI 搜尋查詢
- `GET /api/ai/recommendations` - 獲取個性化推薦
- `POST /api/ai/logs` - 記錄 AI 互動

## 故障排除

### 常見問題

1. **Clerk 認證失敗**
   - 檢查 Publishable Key 是否正確
   - 驗證回呼 URL 配置

2. **D1 資料庫連接錯誤**
   - 確認 database_id 在 wrangler.toml 中正確設置
   - 檢查資料庫表是否存在

3. **跨域請求錯誤**
   - 確保後端已正確設置 CORS 頭

## 資源連結

- [Cloudflare Pages 文檔](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文檔](https://developers.cloudflare.com/d1/)
- [Clerk 文檔](https://clerk.com/docs)
- [Next.js 文檔](https://nextjs.org/docs)
