/**
 * Semantic Search API Routes
 * Handles vector-based and hybrid product search
 */

import { Hono } from 'hono';
import { eq, like, and, sql } from 'drizzle-orm';
import { Env } from '../types/env';
import { optionalAuth } from '../middleware/auth';
import { searchRateLimit } from '../middleware/rate-limit';
import { AppError } from '../middleware/error-handler';
import { semanticSearchSchema, vectorizeProductSchema } from '../utils/ai-validation';
import { generateEmbedding } from '../services/gemini';
import { createDrizzleClient } from '../db/client';
import { products, aiInteractionLogs } from '../db/schema';
import { findTopKSimilar, combineProductFields } from '../services/vectorize';

const app = new Hono<{ Bindings: Env }>();

// Apply rate limiting to search routes
app.use('*', searchRateLimit);

/**
 * GET /api/search
 * Hybrid search: combines full-text search with semantic vector search
 */
app.get('/', optionalAuth, async (c) => {
  const query = c.req.query();
  const validated = semanticSearchSchema.parse({
    query: query.query || '',
    limit: query.limit ? parseInt(query.limit) : 10,
    minSimilarity: query.minSimilarity ? parseFloat(query.minSimilarity) : 0.5,
    category: query.category,
    brand: query.brand,
  });

  const db = createDrizzleClient(c.env.DB);
  const auth = c.get('auth');

  try {
    // Step 1: Generate embedding for search query
    const queryVector = await generateEmbedding(
      c.env.GEMINI_API_KEY,
      validated.query
    );

    // Step 2: Get products with filtering
    const conditions = [eq(products.status, 'active')];
    if (validated.category) {
      conditions.push(eq(products.category, validated.category));
    }
    if (validated.brand) {
      conditions.push(eq(products.brand, validated.brand));
    }

    const allProducts = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .all();

    // Step 3: Perform vector similarity search
    const productsWithVectors = allProducts
      .filter((p) => p.vectorEmbedding && Array.isArray(p.vectorEmbedding))
      .map((p) => ({
        id: p.id,
        vector: p.vectorEmbedding as number[],
        data: p,
      }));

    const vectorResults = findTopKSimilar(
      queryVector,
      productsWithVectors,
      validated.limit * 2
    ).filter((result) => result.similarity >= validated.minSimilarity);

    // Step 4: Perform keyword search for products without vectors
    const keywordQuery = `%${validated.query}%`;
    const keywordResults = allProducts
      .filter((p) => !p.vectorEmbedding)
      .filter(
        (p) =>
          p.name.toLowerCase().includes(validated.query.toLowerCase()) ||
          p.description?.toLowerCase().includes(validated.query.toLowerCase()) ||
          p.category.toLowerCase().includes(validated.query.toLowerCase()) ||
          p.brand.toLowerCase().includes(validated.query.toLowerCase())
      );

    // Step 5: Combine results (vector results take priority)
    const vectorProductIds = new Set(vectorResults.map((r) => r.id));
    const combinedResults = [
      ...vectorResults.map((r) => ({ ...r.data, similarity: r.similarity })),
      ...keywordResults
        .filter((p) => !vectorProductIds.has(p.id))
        .map((p) => ({ ...p, similarity: 0.3 })),
    ].slice(0, validated.limit);

    // Log search interaction
    if (auth) {
      db.insert(aiInteractionLogs)
        .values({
          userId: auth.userId,
          interactionType: 'search',
          queryText: validated.query,
          relatedProductIds: combinedResults.map((p) => p.id),
          sessionId: crypto.randomUUID(),
        })
        .run()
        .catch((err) => console.error('Failed to log search:', err));
    }

    return c.json({
      success: true,
      data: {
        products: combinedResults,
        total: combinedResults.length,
        method: vectorResults.length > 0 ? 'hybrid' : 'keyword',
      },
    });
  } catch (error) {
    console.error('Search error:', error);

    // Fallback to simple keyword search
    const keywordQuery = `%${validated.query}%`;
    const conditions = [eq(products.status, 'active')];
    if (validated.category) {
      conditions.push(eq(products.category, validated.category));
    }
    if (validated.brand) {
      conditions.push(eq(products.brand, validated.brand));
    }

    const fallbackResults = await db
      .select()
      .from(products)
      .where(
        and(
          ...conditions,
          sql`${products.name} LIKE ${keywordQuery} OR ${products.description} LIKE ${keywordQuery}`
        )
      )
      .limit(validated.limit)
      .all();

    return c.json({
      success: true,
      data: {
        products: fallbackResults,
        total: fallbackResults.length,
        method: 'keyword-fallback',
      },
    });
  }
});

/**
 * POST /api/search/vectorize
 * Manually trigger product vectorization (admin only)
 */
app.post('/vectorize', async (c) => {
  const body = await c.req.json();
  const validated = vectorizeProductSchema.parse(body);

  const db = createDrizzleClient(c.env.DB);

  // Get product
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, validated.productId))
    .get();

  if (!product) {
    throw new AppError('NOT_FOUND', 'Product not found');
  }

  // Check if already has vector and not forcing regenerate
  if (product.vectorEmbedding && !validated.forceRegenerate) {
    return c.json({
      success: true,
      data: {
        message: 'Product already has vector embedding',
        productId: product.id,
      },
    });
  }

  // Generate vector embedding
  const productText = combineProductFields(product);
  const embedding = await generateEmbedding(c.env.GEMINI_API_KEY, productText);

  // Update product with vector
  await db
    .update(products)
    .set({
      vectorEmbedding: embedding,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(products.id, validated.productId))
    .run();

  return c.json({
    success: true,
    data: {
      message: 'Product vectorized successfully',
      productId: product.id,
      vectorLength: embedding.length,
    },
  });
});

export default app;
