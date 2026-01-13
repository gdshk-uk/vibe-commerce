# Backend Scripts

## Product Vectorization Scripts

### Prerequisites

1. **Get Gemini API Key**
   - Visit: https://aistudio.google.com/app/apikey
   - Create or sign in with your Google account
   - Generate a new API key

2. **Set Environment Variables**
   - Edit `/workspaces/vibe-commerce/backend/.dev.vars`
   - Replace `your_gemini_api_key_here` with your actual API key:
     ```
     GEMINI_API_KEY=AIzaSy...your_actual_key
     ```

### Available Scripts

#### Check Product Status
Check which products have embeddings and which need vectorization:

```bash
cd /workspaces/vibe-commerce/backend
npx tsx scripts/check-products.ts
```

#### Vectorize Products
Generate vector embeddings for all products without embeddings:

```bash
cd /workspaces/vibe-commerce/backend
export $(cat .dev.vars | xargs) && npx tsx scripts/vectorize-products.ts
```

Or add to package.json scripts:

```bash
npm run vectorize
```

### How It Works

1. **check-products.ts**:
   - Displays current vectorization status
   - Lists products needing embeddings
   - No API calls, just database query

2. **vectorize-products.ts**:
   - Fetches products without embeddings
   - Generates embeddings using Gemini API
   - Processes in batches of 10 to respect rate limits
   - Updates database with generated vectors
   - Shows progress and completion status

### Expected Output

```
🚀 Starting batch product vectorization...

📁 Using database: 05026242a41d24db22ff436223f81c3be44ac61465b8bbc25388857829ba2187.sqlite

📊 Fetching products without embeddings...
📦 Found 3 products to vectorize

🔮 Generating embeddings with Gemini API...
   (This may take a moment)

⏳ Processing batch 1/1...
   ✓ Premium Wireless Headphones (prod-001)
   ✓ Smart Fitness Watch (prod-002)
   ✓ Organic Cotton T-Shirt (prod-003)

✨ Vectorization complete!
   Processed: 3/3 products
   Success rate: 100.0%
```

### Troubleshooting

**Error: GEMINI_API_KEY environment variable is required**
- Make sure you've set the API key in `.dev.vars`
- Use the `export $(cat .dev.vars | xargs)` command to load variables

**Error: No database file found**
- Run migrations first: `npm run db:migrate:local`

**API Rate Limit Errors**
- The script automatically batches requests
- Adds 1-second delay between batches
- Free tier: 60 requests per minute

### Next Steps

After vectorization is complete:
1. Verify with `npx tsx scripts/check-products.ts`
2. Test semantic search: `GET /api/search?query=wireless audio`
3. Test AI chat: `POST /api/ai/chat`
