# Phase 2: Admin Dashboard & Product Management - Specification

本文件詳細規劃 Vibe Commerce 平台的 Phase 2 開發，專注於管理後台、商品管理系統、基於 Clerk 的 RBAC 權限體系以及 Cloudflare R2 儲存整合。

## 1. 管理後台功能規劃 (Admin Dashboard)

管理後台旨在為管理員提供高效的商品生命週期管理工具。

### 商品清單 (Product Listing)
*   **功能**: 顯示所有商品的概覽列表。
*   **關鍵屬性**: 名稱、SKU、價格、當前庫存、狀態（上架/下架）、最後更新時間。
*   **篩選與搜尋**: 
    *   名稱/SKU 關鍵字搜尋。
    *   類別 (Category) 與 品牌 (Brand) 過濾。
    *   庫存狀態篩選（在庫、低庫存、缺貨）。
*   **分頁**: 每頁 20 筆資料，支援分頁導航。

### 商品新增/編輯 (Product CRUD)
*   **富文本編輯**: 商品描述支援基礎 Markdown 或 HTML 格式。
*   **多圖管理**: 支援上傳多張商品圖片，並可拖拽排序，設定首圖。
*   **變體管理**: 支援商品規格（如顏色、尺寸）的設置與獨立庫存管理（選配項目）。
*   **即時預覽**: 在編輯過程中可預覽商品在前端的展示效果。

### 庫存預警邏輯 (Low Stock Alert)
*   **預警閾值 (`low_stock_threshold`)**: 每個商品可獨立設置預警水位。
*   **預警邏輯**:
    *   當 `stock_quantity <= low_stock_threshold` 時，標記為「低庫存 (Low Stock)」。
    *   管理後台 Dashboard 顯示「低庫存商品總數」與「待補貨清單」快捷卡片。
    *   商品清單中以醒目顏色（如橙色）標識預警商品。

---

## 2. RBAC 權限體系 (Clerk Integration)

利用 Clerk 的 `publicMetadata` 來實作基於角色的存取控制 (RBAC)。

### Metadata 結構
所有使用者的 Clerk Metadata 將包含 `role` 欄位：
```typescript
// Clerk User Metadata
{
  "publicMetadata": {
    "role": "admin" | "customer"
  }
}
```

### 權限區分機制
*   **Admin (管理員)**:
    *   可存取 `/admin/*` 前端路由。
    *   可發送請求至 `/api/admin/*` 後端路由。
    *   擁有 CRUD 商品、查看所有訂單、管理用戶的權限。
*   **Customer (一般客戶)**:
    *   預設角色（Metadata 缺失時視為 Customer）。
    *   僅能存取 `/dashboard/*` 個人中心。
    *   無法存取任何管理端路由或 API。

### 安全檢查流程
1.  **前端**: 在 `middleware.ts` 攔截 `/admin` 路徑，讀取 Clerk Session 中的 `role`。
2.  **後端**: 建立 `isAdmin` Middleware，驗證 JWT 並檢查 `clerk.publicMetadata.role === 'admin'`。

---

## 3. 儲存邏輯與 R2 整合 (Storage Strategy)

使用 Cloudflare R2 存儲商品圖片，確保高性能與低成本。

### R2 配置 (Wrangler)
*   **Bucket Name**: `vibe-commerce-assets`
*   **Public Access**: 禁止直接公開存取 Bucket，一律透過 Worker 或 Custom Domain。

### 圖片上傳流程
1.  **授權**: 管理員發送請求獲取 R2 預簽名網址 (Presigned URL)。
2.  **上傳**: 客戶端直接將圖片上傳至 R2，減輕 Worker 負擔。
3.  **命名規範**: `products/{productId}/{uuid}-{filename}`。

### 防盜鏈邏輯 (Hotlink Protection)
*   **Cloudflare WAF**: 設置 WAF 規則，僅允許來自 `vibe-commerce.com` 或 `localhost` (開發環境) 的 `Referer` 請求。
*   **轉換服務**: 使用 Cloudflare Images 或 Workers 進行圖片即時縮放與轉檔 (WebP)，並在該層級進行身份驗證校驗。

---

## 4. API 設計 (Admin Products)

所有管理端 API 以 `/api/admin/products` 為前綴，需經過 `isAdmin` 驗證。

### 資料驗證 (Zod Schema)
定義於 `shared/utils/validation.ts` (規劃中)：

#### Create/Update Product Schema
```typescript
{
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  stock_quantity: z.number().int().nonnegative(),
  low_stock_threshold: z.number().int().nonnegative().default(10),
  category: z.string(),
  images: z.array(z.string().url()),
  status: z.enum(['active', 'draft', 'archived'])
}
```

### API 節點定義

| 節點 | 方法 | 功能 | 權限 |
| :--- | :--- | :--- | :--- |
| `/api/admin/products` | GET | 獲取商品清單 (含分頁、篩選) | Admin |
| `/api/admin/products` | POST | 建立新商品 | Admin |
| `/api/admin/products/:id` | GET | 獲取單一商品詳情 | Admin |
| `/api/admin/products/:id` | PATCH | 更新商品資訊/庫存 | Admin |
| `/api/admin/products/:id` | DELETE | 刪除/封存商品 | Admin |
| `/api/admin/products/upload-url` | POST | 獲取圖片上傳預簽名網址 | Admin |

### 回應格式規範
*   **成功**: `{ success: true, data: { ... }, meta: { total: 100 } }`
*   **失敗**: `{ success: false, error: { message: "Error Message", code: "ERROR_CODE" } }`

---

## 5. 待執行清單 (Phase 2 TODOs)
- [ ] 在 `backend/wrangler.toml` 新增 R2 Bucket 綁定。
- [ ] 擴展 `backend/src/db/schema.ts` 以包含 `low_stock_threshold`。
- [ ] 實作後端 `isAdmin` Middleware。
- [ ] 在 `frontend/src/app` 建立 `(admin)` 路由組與 Layout。
- [ ] 整合 R2 圖片上傳服務與防盜鏈 WAF 規則。
