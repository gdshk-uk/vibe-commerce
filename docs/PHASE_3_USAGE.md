# Phase 3: AI Agent & Search - 使用指南

本指南說明如何使用和測試 Vibe Commerce 的 Phase 3 AI 功能。

## 📋 功能總覽

### 1. AI 聊天助手 (AI Chat)
- **位置**: 所有頁面右下角的懸浮按鈕
- **功能**:
  - 自然語言對話
  - 商品推薦
  - 購物諮詢
  - SSE 串流回應（即時打字效果）
- **技術**: Gemini 1.5 Flash + Server-Sent Events

### 2. 語義搜尋 (Semantic Search)
- **位置**: Dashboard 頁面、AI Demo 頁面
- **功能**:
  - 自然語言搜尋
  - 向量相似度匹配
  - 混合搜尋（向量 + 關鍵字）
  - 相似度評分顯示
- **技術**: Gemini Embeddings + 餘弦相似度

### 3. 個人化推薦 (Recommendations)
- **位置**: Dashboard 頁面、AI Demo 頁面
- **功能**:
  - 基於瀏覽歷史的推薦
  - 個人化商品建議
  - 熱門商品展示
- **技術**: 向量嵌入 + 用戶互動記錄

---

## 🚀 快速開始

### 前置需求

1. **後端配置**
   ```bash
   cd backend

   # 1. 設定環境變數
   # 編輯 .dev.vars 文件，加入 Gemini API Key
   GEMINI_API_KEY=your_actual_api_key_here

   # 2. 執行資料庫 migration
   npm run db:migrate:local

   # 3. 為商品生成向量嵌入
   export $(cat .dev.vars | xargs) && npx tsx scripts/vectorize-products.ts

   # 4. 啟動後端服務
   npm run dev
   ```

2. **前端配置**
   ```bash
   cd frontend

   # 1. 安裝依賴
   npm install

   # 2. 設定環境變數（.env.local）
   NEXT_PUBLIC_API_URL=http://localhost:8787
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret

   # 3. 啟動前端服務
   npm run dev
   ```

### 訪問 AI 功能

1. **註冊/登入帳號**
   - 訪問 http://localhost:3000
   - 註冊或登入 Clerk 帳號
   - AI 功能需要身份驗證

2. **測試語義搜尋**
   - 訪問 Dashboard: http://localhost:3000/dashboard
   - 在搜尋框輸入自然語言查詢
   - 例如: "wireless headphones with noise cancelling"

3. **測試 AI 聊天**
   - 點擊右下角的懸浮聊天按鈕
   - 輸入問題，例如:
     - "What are your best-selling products?"
     - "I need a gift for my friend who loves tech"
     - "Show me affordable headphones"

4. **查看推薦商品**
   - Dashboard 頁面會自動顯示個人化推薦
   - 基於你的搜尋和互動歷史

---

## 🎨 組件使用方式

### AIChat 組件

```tsx
import { AIChat } from '@/components/ai';

export default function Page() {
  return (
    <>
      {/* 你的頁面內容 */}
      <AIChat />
    </>
  );
}
```

**特點**:
- 自動檢測登入狀態
- SSE 串流即時回應
- 打字動畫效果
- 對話歷史記錄

### SemanticSearch 組件

```tsx
import { SemanticSearch } from '@/components/ai';

export default function Page() {
  return (
    <SemanticSearch
      placeholder="Search for products..."
      onResultsChange={(products) => console.log(products)}
      className="max-w-2xl"
    />
  );
}
```

**Props**:
- `placeholder`: 搜尋框提示文字
- `onResultsChange`: 結果改變回調
- `autoFocus`: 自動聚焦
- `className`: 自訂樣式

### ProductRecommendations 組件

```tsx
import { ProductRecommendations } from '@/components/ai';

export default function Page() {
  return (
    <ProductRecommendations
      title="Recommended for You"
      limit={4}
      excludeProductIds={['prod-001']}
      category="Electronics"
    />
  );
}
```

**Props**:
- `title`: 標題文字
- `limit`: 推薦商品數量
- `excludeProductIds`: 排除的商品 ID
- `category`: 指定類別

---

## 🧪 測試頁面

訪問 **AI Demo 頁面** 查看所有功能:
```
http://localhost:3000/ai-demo
```

此頁面包含:
- 語義搜尋示範
- AI 聊天使用說明
- 推薦商品展示
- Phase 3 功能列表

---

## 🔧 API 端點

### 1. AI 聊天
```
POST /api/ai/chat
Authorization: Bearer {clerk_token}

Body:
{
  "message": "What are your best products?",
  "conversationHistory": [],
  "context": {
    "currentProductId": "prod-001"
  }
}

Response: Server-Sent Events stream
```

### 2. 語義搜尋
```
GET /api/search?query=wireless+headphones&limit=10
Authorization: Bearer {clerk_token} (optional)

Response:
{
  "success": true,
  "data": {
    "products": [...],
    "total": 10,
    "method": "hybrid"
  }
}
```

### 3. 個人化推薦
```
GET /api/ai/recommendations?limit=5
Authorization: Bearer {clerk_token}

Response:
{
  "success": true,
  "data": {
    "products": [...],
    "reason": "personalized"
  }
}
```

---

## 📊 速率限制

為保護 API 和控制成本，設置了以下速率限制:

- **AI 聊天**: 20 次請求 / 15 分鐘
- **語義搜尋**: 60 次請求 / 分鐘

超過限制會返回 429 錯誤，並提供 `Retry-After` header。

---

## 🎯 使用場景

### 場景 1: 用戶搜尋商品
```
用戶輸入: "comfortable running shoes"
→ 語義搜尋將查詢轉換為向量
→ 匹配相似商品（即使不含確切關鍵字）
→ 返回最相關的結果
```

### 場景 2: 用戶詢問 AI 助手
```
用戶: "I need a gift for my tech-savvy friend under $200"
→ AI 理解需求和預算限制
→ 提供個性化商品推薦
→ 解釋推薦理由
```

### 場景 3: 個人化首頁
```
用戶登入 → 系統分析瀏覽歷史
→ 生成用戶偏好向量
→ 推薦相似商品
→ 顯示在 Dashboard
```

---

## 🐛 故障排除

### 問題 1: AI 聊天無法連接
**解決方案**:
- 檢查後端是否運行 (http://localhost:8787)
- 確認 Clerk token 有效
- 查看瀏覽器 Console 錯誤

### 問題 2: 搜尋返回空結果
**解決方案**:
- 確認商品已經向量化
- 執行: `npx tsx scripts/check-products.ts`
- 如果沒有向量，執行向量化腳本

### 問題 3: Rate Limit Error
**解決方案**:
- 等待重試時間（查看 `Retry-After` header）
- 減少請求頻率
- 調整 `backend/src/middleware/rate-limit.ts` 配置

### 問題 4: Gemini API 錯誤
**解決方案**:
- 確認 API Key 正確
- 檢查 API 配額: https://aistudio.google.com/app/apikey
- 查看 Gemini API 狀態

---

## 📈 效能優化

### 建議

1. **向量快取**
   - 商品向量在資料庫中持久化
   - 只在商品更新時重新生成

2. **批次處理**
   - 向量化腳本使用批次請求
   - 減少 API 調用次數

3. **邊緣計算**
   - 所有 AI 邏輯在 Cloudflare Workers 執行
   - 低延遲、高可用性

4. **速率限制**
   - 防止 API 費用激增
   - 保護系統穩定性

---

## 🎓 更多資源

- **Gemini API 文檔**: https://ai.google.dev/docs
- **Phase 3 規格**: `/docs/PHASE_3_SPEC.md`
- **後端腳本說明**: `/backend/scripts/README.md`
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/

---

## ✅ 功能檢查清單

使用此清單確認所有功能正常運作:

- [ ] 後端服務運行 (localhost:8787)
- [ ] 前端服務運行 (localhost:3000)
- [ ] 資料庫 migrations 已執行
- [ ] 商品已經向量化
- [ ] 可以登入 Clerk 帳號
- [ ] AI 聊天按鈕顯示並可點擊
- [ ] 聊天回應正常串流
- [ ] 語義搜尋返回結果
- [ ] 推薦商品正常顯示
- [ ] 速率限制正常工作

---

如有問題，請查看:
- 後端日誌: `backend` 終端輸出
- 前端日誌: 瀏覽器 DevTools Console
- API 錯誤: Network tab 中的請求詳情
