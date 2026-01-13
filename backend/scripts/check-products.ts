/**
 * Check Products Script
 * Displays products and their vectorization status
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

async function checkProducts() {
  console.log('🔍 Checking product vectorization status...\n');

  try {
    // Find the database file
    const dbDir = path.join(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
    const dbFiles = fs.readdirSync(dbDir).filter((f: string) => f.endsWith('.sqlite'));

    if (dbFiles.length === 0) {
      console.error('❌ Error: No database file found');
      console.error('   Please run migrations first: npm run db:migrate:local');
      process.exit(1);
    }

    const dbPath = path.join(dbDir, dbFiles[0]);
    console.log(`📁 Database: ${dbFiles[0]}\n`);

    const sqlite = new Database(dbPath);

    // Get all products
    const products = sqlite
      .prepare('SELECT id, name, brand, category, vector_embedding FROM products')
      .all();

    console.log(`📦 Total products: ${products.length}\n`);

    const withEmbeddings = products.filter((p: any) => p.vector_embedding !== null).length;
    const withoutEmbeddings = products.length - withEmbeddings;

    console.log(`✅ With embeddings: ${withEmbeddings}`);
    console.log(`❌ Without embeddings: ${withoutEmbeddings}\n`);

    if (withoutEmbeddings > 0) {
      console.log('Products needing vectorization:');
      products
        .filter((p: any) => p.vector_embedding === null)
        .forEach((p: any) => {
          console.log(`  • ${p.name} (${p.brand} - ${p.category})`);
        });
    }

    sqlite.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProducts();
