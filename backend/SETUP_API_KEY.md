# 🚀 快速設定 Gemini API Key

## 📝 三步驟設定

### 步驟 1: 取得免費 API Key（2 分鐘）

1. **訪問**: https://aistudio.google.com/app/apikey
2. **登入** 你的 Google 帳號
3. **點擊** "Create API key" 按鈕
4. **複製** 生成的 Key（格式: `AIzaSy...`，39 字元）

### 步驟 2: 設定 API Key（1 分鐘）

**選項 A: 使用命令行（推薦）**
```bash
cd /workspaces/vibe-commerce/backend

# 開啟編輯器
nano .dev.vars

# 找到這一行：
# GEMINI_API_KEY=your_gemini_api_key_here
#
# 替換為：
# GEMINI_API_KEY=AIzaSy...你的實際Key
#
# 按 Ctrl+O 儲存，Ctrl+X 退出
```

**選項 B: 或者直接替換**
```bash
cd /workspaces/vibe-commerce/backend

# 替換為你的實際 API Key
sed -i 's/your_gemini_api_key_here/AIzaSy...你的Key/' .dev.vars
```

### 步驟 3: 測試連接（30 秒）

```bash
cd /workspaces/vibe-commerce/backend

# 載入環境變數
export $(cat .dev.vars | xargs)

# 測試 Gemini API 連接
npm run test-gemini
```

**預期輸出**:
```
🔮 Testing Gemini API connection...

✅ API Key found
   Length: 39 characters
   Starts with: AIzaSy...

🧪 Testing embedding generation...
   Sending test text: "wireless headphones"

✅ Success! Gemini API is working correctly
   Vector length: 768 dimensions
   Response time: 250ms
   First 5 values: [0.0234, -0.0156, 0.0423, ...]

🎉 Gemini API test passed!

📋 Next steps:
   1. Run: npm run vectorize
   2. This will generate embeddings for all products
   3. Then you can test the AI features in the frontend
```

---

## 🎯 執行向量化

API Key 測試通過後，執行：

```bash
cd /workspaces/vibe-commerce/backend

# 確保環境變數已載入
export $(cat .dev.vars | xargs)

# 檢查商品狀態
npm run check-products

# 執行向量化（為 3 個商品生成 embeddings）
npm run vectorize
```

**預期輸出**:
```
🚀 Starting batch product vectorization...

📁 Using database: 05026242...sqlite

📊 Fetching products without embeddings...
📦 Found 3 products to vectorize

🔮 Generating embeddings with Gemini API...

⏳ Processing batch 1/1...
   ✓ Premium Wireless Headphones (prod-001)
   ✓ Smart Fitness Watch (prod-002)
   ✓ Organic Cotton T-Shirt (prod-003)

✨ Vectorization complete!
   Processed: 3/3 products
   Success rate: 100.0%
```

---

## ✅ 驗證成功

```bash
# 再次檢查商品狀態
npm run check-products
```

**預期輸出**:
```
📦 Total products: 3
✅ With embeddings: 3    ← 全部完成！
❌ Without embeddings: 0
```

---

## 🐛 常見問題

### Q: 測試失敗 - "API_KEY_INVALID"
**A**: API Key 格式錯誤或已失效
- 確認 Key 格式: `AIzaSy` 開頭，39 字元
- 重新生成: https://aistudio.google.com/app/apikey

### Q: 測試失敗 - "QUOTA_EXCEEDED"
**A**: 超過免費額度（很少見）
- 免費額度: 1,500 次請求/天
- 我們只需要 3 次請求
- 等待幾分鐘後重試

### Q: 測試失敗 - "Network Error"
**A**: 網路連接問題
- 檢查網路連接
- 確認沒有防火牆阻擋

### Q: `.dev.vars` 找不到
**A**: 文件可能被刪除
- 從 `.env.example` 複製: `cp .env.example .dev.vars`
- 或查看 `backend/.dev.vars`

---

## 📋 完整命令清單

```bash
# 1. 設定 API Key（手動編輯）
cd /workspaces/vibe-commerce/backend
nano .dev.vars

# 2. 載入環境變數
export $(cat .dev.vars | xargs)

# 3. 測試連接
npm run test-gemini

# 4. 檢查商品
npm run check-products

# 5. 執行向量化
npm run vectorize

# 6. 驗證結果
npm run check-products

# 7. 啟動後端（開發模式）
npm run dev
```

---

## 🎉 完成！

設定完成後，你就可以：
- ✅ 使用語義搜尋
- ✅ 使用 AI 聊天助手
- ✅ 獲得個人化推薦

**下一步**: 啟動前端並訪問 http://localhost:3000/ai-demo
