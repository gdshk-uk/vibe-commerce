# 如何取得 Gemini API Key（免費）

## 🚀 快速步驟

### 1. 訪問 Google AI Studio
```
https://aistudio.google.com/app/apikey
```

### 2. 登入 Google 帳號
- 使用你的 Google 帳號登入
- 任何 Gmail 帳號都可以

### 3. 建立 API Key
1. 點擊 **"Get API key"** 或 **"Create API key"** 按鈕
2. 選擇或建立一個 Google Cloud 專案
   - 如果沒有專案，點擊 **"Create API key in new project"**
3. API Key 會立即生成

### 4. 複製 API Key
- 格式類似: `AIzaSyABC123...` (39 字元)
- **重要**: 立即複製並保存，離開頁面後無法再次查看完整的 Key

## 📊 免費額度（2026年1月）

Gemini API 提供慷慨的免費額度：

| 功能 | 免費額度 |
|------|---------|
| **Gemini 1.5 Flash** | 15 RPM (每分鐘請求數) |
| **Gemini 1.5 Pro** | 2 RPM |
| **Text Embedding** | 1,500 RPM |
| **每日請求** | 1,500 次 |

**我們的使用量**:
- 向量化 3 個商品: ~3 次請求
- AI 聊天: 每次對話 1 次請求
- 語義搜尋: 每次搜尋 1 次請求

✅ **完全在免費額度內！**

## 🔒 安全性注意事項

### ⚠️ 重要提醒
1. **不要分享** API Key 給他人
2. **不要提交** 到 Git repository（已在 .gitignore）
3. **不要公開** 在網頁前端代碼中
4. **定期輪替** API Key（建議每 90 天）

### 🛡️ 安全設定
在 Google Cloud Console 中可以設定：
- API Key 使用限制
- IP 白名單
- HTTP referrer 限制
- 使用配額監控

## 📝 設定到專案

### 方法 1: 使用文字編輯器
```bash
cd /workspaces/vibe-commerce/backend
nano .dev.vars
```

將以下行：
```
GEMINI_API_KEY=your_gemini_api_key_here
```

改為：
```
GEMINI_API_KEY=AIzaSyABC123...你的實際Key
```

### 方法 2: 使用命令行
```bash
cd /workspaces/vibe-commerce/backend
echo "GEMINI_API_KEY=AIzaSyABC123...你的實際Key" >> .dev.vars
```

## ✅ 驗證設定

```bash
cd /workspaces/vibe-commerce/backend

# 載入環境變數
export $(cat .dev.vars | xargs)

# 檢查是否已設定
echo $GEMINI_API_KEY

# 應該顯示: AIzaSy... (你的 API Key)
```

## 🔄 如果需要新的 Key

如果 Key 洩漏或過期：
1. 訪問: https://aistudio.google.com/app/apikey
2. 點擊舊 Key 旁的 **"Delete"**
3. 點擊 **"Create API key"** 建立新的
4. 更新 `.dev.vars` 文件

## 📞 需要協助？

- **API Key 管理**: https://aistudio.google.com/app/apikey
- **使用配額查看**: https://console.cloud.google.com/apis/dashboard
- **Gemini API 文檔**: https://ai.google.dev/docs

---

**下一步**: 設定好 API Key 後，執行向量化腳本：
```bash
npm run vectorize
```
