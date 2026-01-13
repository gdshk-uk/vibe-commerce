/**
 * Simple Product Vectorization Script
 * Uses direct SQLite queries for better compatibility
 */

import { generateBatchEmbeddings } from '../src/services/gemini';
import { combineProductFields } from '../src/services/vectorize';

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

async function vectorizeProducts() {
  console.log('🚀 Starting batch product vectorization...\n');

  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('❌ Error: GEMINI_API_KEY environment variable is required');
    console.error('   Please run: npm run test-gemini first\n');
    process.exit(1);
  }

  try {
    // Find database file
    const dbDir = path.join(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
    const dbFiles = fs.readdirSync(dbDir).filter((f: string) => f.endsWith('.sqlite'));

    if (dbFiles.length === 0) {
      console.error('❌ Error: No database file found');
      console.error('   Please run migrations first: npm run db:migrate:local\n');
      process.exit(1);
    }

    const dbPath = path.join(dbDir, dbFiles[0]);
    console.log(`📁 Database: ${dbFiles[0]}\n`);

    const db = Database(dbPath);

    // Get products without embeddings
    console.log('📊 Fetching products without embeddings...');
    const products = db
      .prepare('SELECT id, name, description, category, brand FROM products WHERE vector_embedding IS NULL')
      .all();

    if (products.length === 0) {
      console.log('✅ All products already have vector embeddings!\n');
      db.close();
      return;
    }

    console.log(`📦 Found ${products.length} products to vectorize\n`);

    // Prepare text for embeddings
    const productTexts = products.map((product: any) =>
      combineProductFields({
        name: product.name,
        description: product.description,
        category: product.category,
        brand: product.brand,
      })
    );

    console.log('🔮 Generating embeddings with Gemini API...');
    console.log('   (This may take a moment)\n');

    // Generate embeddings in batches
    const batchSize = 10;
    let processedCount = 0;

    for (let i = 0; i < productTexts.length; i += batchSize) {
      const batch = productTexts.slice(i, i + batchSize);
      const batchProducts = products.slice(i, i + batchSize);

      console.log(`⏳ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(productTexts.length / batchSize)}...`);

      try {
        const embeddings = await generateBatchEmbeddings(apiKey, batch);

        // Update each product
        const updateStmt = db.prepare(
          'UPDATE products SET vector_embedding = ?, updated_at = ? WHERE id = ?'
        );

        for (let j = 0; j < batchProducts.length; j++) {
          const product = batchProducts[j];
          const embedding = embeddings[j];

          updateStmt.run(
            JSON.stringify(embedding),
            new Date().toISOString(),
            product.id
          );

          processedCount++;
          console.log(`   ✓ ${product.name} (${product.id})`);
        }

        // Small delay between batches
        if (i + batchSize < productTexts.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`   ❌ Error processing batch: ${error.message}`);
        console.error('   Skipping to next batch...\n');
      }
    }

    db.close();

    console.log(`\n✨ Vectorization complete!`);
    console.log(`   Processed: ${processedCount}/${products.length} products`);
    console.log(`   Success rate: ${((processedCount / products.length) * 100).toFixed(1)}%\n`);

    if (processedCount === products.length) {
      console.log('🎉 All products vectorized successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. Run: npm run check-products (to verify)');
      console.log('   2. Start backend: npm run dev');
      console.log('   3. Start frontend: cd ../frontend && npm run dev');
      console.log('   4. Visit: http://localhost:3000/ai-demo\n');
    }
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message || error);
    process.exit(1);
  }
}

// Run
vectorizeProducts();
