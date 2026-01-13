/**
 * Batch Product Vectorization Script
 * Generates vector embeddings for all products without embeddings
 *
 * Usage: npx tsx scripts/vectorize-products.ts
 */

import { createDrizzleClient } from '../src/db/client';
import { products } from '../src/db/schema';
import { generateBatchEmbeddings } from '../src/services/gemini';
import { combineProductFields } from '../src/services/vectorize';
import { eq, isNull } from 'drizzle-orm';

interface Env {
  DB: D1Database;
  GEMINI_API_KEY: string;
}

/**
 * Main vectorization function
 */
async function vectorizeProducts() {
  console.log('🚀 Starting batch product vectorization...\n');

  // Check for required environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY environment variable is required');
    console.error('   Please set it in your .dev.vars file or environment');
    process.exit(1);
  }

  // Note: This script requires database connection from wrangler dev
  console.log('⚠️  This script requires a running wrangler dev server');
  console.log('   Run in another terminal: npm run dev\n');

  try {
    // For local testing, we'll create a mock D1 database using better-sqlite3
    const Database = require('better-sqlite3');
    const fs = require('fs');
    const path = require('path');

    // Find the database file
    const dbDir = path.join(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
    const dbFiles = fs.readdirSync(dbDir).filter((f: string) => f.endsWith('.sqlite'));

    if (dbFiles.length === 0) {
      console.error('❌ Error: No database file found');
      console.error('   Please run migrations first: npm run db:migrate:local');
      process.exit(1);
    }

    const dbPath = path.join(dbDir, dbFiles[0]);
    console.log(`📁 Using database: ${dbFiles[0]}\n`);

    const sqlite = new Database(dbPath);

    // Create a D1-compatible interface
    const mockD1: any = {
      prepare: (sql: string) => {
        const stmt = sqlite.prepare(sql);
        return {
          bind: (...params: any[]) => {
            return {
              all: () => {
                const results = stmt.all(...params);
                return Promise.resolve({ results, success: true });
              },
              run: () => {
                const info = stmt.run(...params);
                return Promise.resolve({ success: true, meta: info });
              },
              first: () => {
                const result = stmt.get(...params);
                return Promise.resolve(result || null);
              },
            };
          },
          all: () => {
            const results = stmt.all();
            return Promise.resolve({ results, success: true });
          },
          run: () => {
            const info = stmt.run();
            return Promise.resolve({ success: true, meta: info });
          },
          first: () => {
            const result = stmt.get();
            return Promise.resolve(result || null);
          },
        };
      },
    };

    const db = createDrizzleClient(mockD1);

    // Get all products without vector embeddings
    console.log('📊 Fetching products without embeddings...');
    const productsToVectorize = await db
      .select()
      .from(products)
      .where(isNull(products.vectorEmbedding))
      .all();

    if (productsToVectorize.length === 0) {
      console.log('✅ All products already have vector embeddings!');
      sqlite.close();
      return;
    }

    console.log(`📦 Found ${productsToVectorize.length} products to vectorize\n`);

    // Prepare text for embeddings
    const productTexts = productsToVectorize.map((product) =>
      combineProductFields({
        name: product.name,
        description: product.description,
        category: product.category,
        brand: product.brand,
      })
    );

    console.log('🔮 Generating embeddings with Gemini API...');
    console.log('   (This may take a moment)\n');

    // Generate embeddings in batches of 10 to avoid rate limits
    const batchSize = 10;
    let processedCount = 0;

    for (let i = 0; i < productTexts.length; i += batchSize) {
      const batch = productTexts.slice(i, i + batchSize);
      const batchProducts = productsToVectorize.slice(i, i + batchSize);

      console.log(`⏳ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(productTexts.length / batchSize)}...`);

      try {
        const embeddings = await generateBatchEmbeddings(apiKey, batch);

        // Update each product with its embedding
        for (let j = 0; j < batchProducts.length; j++) {
          const product = batchProducts[j];
          const embedding = embeddings[j];

          await db
            .update(products)
            .set({
              vectorEmbedding: embedding,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(products.id, product.id))
            .run();

          processedCount++;
          console.log(`   ✓ ${product.name} (${product.id})`);
        }

        // Small delay between batches to respect rate limits
        if (i + batchSize < productTexts.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`   ❌ Error processing batch: ${error}`);
        console.error('   Skipping to next batch...\n');
      }
    }

    sqlite.close();

    console.log(`\n✨ Vectorization complete!`);
    console.log(`   Processed: ${processedCount}/${productsToVectorize.length} products`);
    console.log(`   Success rate: ${((processedCount / productsToVectorize.length) * 100).toFixed(1)}%`);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
vectorizeProducts().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
