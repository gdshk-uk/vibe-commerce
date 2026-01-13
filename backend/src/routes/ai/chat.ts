/**
 * AI Chat API Routes
 * Handles AI-powered chat conversations with SSE streaming
 */

import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { Env } from '../../types/env';
import { clerkAuth } from '../../middleware/auth';
import { aiRateLimit } from '../../middleware/rate-limit';
import { AppError } from '../../middleware/error-handler';
import { aiChatRequestSchema, recommendationsSchema } from '../../utils/ai-validation';
import { generateChatStream, generateEmbedding } from '../../services/gemini';
import { createDrizzleClient } from '../../db/client';
import { aiInteractionLogs, products, orders } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { cosineSimilarity, findTopKSimilar } from '../../services/vectorize';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication and rate limiting to all AI routes
app.use('*', clerkAuth);
app.use('*', aiRateLimit);

/**
 * POST /api/ai/chat
 * Stream AI chat responses using Server-Sent Events
 */
app.post('/chat', async (c) => {
  const body = await c.req.json();
  const validated = aiChatRequestSchema.parse(body);
  const auth = c.get('auth');

  if (!auth) {
    throw new AppError('UNAUTHORIZED', 'Authentication required');
  }

  // Convert conversation history to Gemini format
  const history = validated.conversationHistory.map((msg) => ({
    role: msg.role,
    parts: msg.content,
  }));

  // Generate session ID for logging
  const sessionId = crypto.randomUUID();

  // Stream the AI response
  return stream(c, async (stream) => {
    try {
      let fullResponse = '';

      // Set SSE headers
      c.header('Content-Type', 'text/event-stream');
      c.header('Cache-Control', 'no-cache');
      c.header('Connection', 'keep-alive');

      // Send initial connection message
      await stream.write('data: {"type":"connected"}\n\n');

      // Stream AI response chunks
      for await (const chunk of generateChatStream(
        c.env.GEMINI_API_KEY,
        validated.message,
        history,
        validated.context
      )) {
        fullResponse += chunk;
        await stream.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      }

      // Send completion message
      await stream.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);

      // Log interaction asynchronously (don't await to not block response)
      const db = createDrizzleClient(c.env.DB);
      db.insert(aiInteractionLogs)
        .values({
          userId: auth.userId,
          interactionType: 'conversation',
          queryText: validated.message,
          responseText: fullResponse,
          sessionId,
        })
        .run()
        .catch((err) => console.error('Failed to log AI interaction:', err));
    } catch (error) {
      console.error('AI chat stream error:', error);
      await stream.write(
        `data: ${JSON.stringify({ type: 'error', message: 'Failed to generate response' })}\n\n`
      );
    }
  });
});

/**
 * GET /api/ai/recommendations
 * Get personalized product recommendations
 */
app.get('/recommendations', async (c) => {
  const query = c.req.query();
  const validated = recommendationsSchema.parse({
    limit: query.limit ? parseInt(query.limit) : 5,
    excludeProductIds: query.excludeProductIds
      ? JSON.parse(query.excludeProductIds)
      : undefined,
    category: query.category,
  });

  const auth = c.get('auth');
  if (!auth) {
    throw new AppError('UNAUTHORIZED', 'Authentication required');
  }

  const db = createDrizzleClient(c.env.DB);

  // Get user's recent interactions to build preference profile
  const recentInteractions = await db
    .select()
    .from(aiInteractionLogs)
    .where(eq(aiInteractionLogs.userId, auth.userId))
    .orderBy(desc(aiInteractionLogs.createdAt))
    .limit(10)
    .all();

  // Get user's recent orders
  const recentOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, auth.userId))
    .orderBy(desc(orders.createdAt))
    .limit(5)
    .all();

  // Build user preference vector from interactions and orders
  // For now, use a simple approach: combine recent search queries
  const recentQueries = recentInteractions
    .filter((log) => log.queryText)
    .map((log) => log.queryText!)
    .slice(0, 5);

  if (recentQueries.length === 0) {
    // No interaction history, return random popular products
    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.status, 'active'))
      .limit(validated.limit)
      .all();

    return c.json({
      success: true,
      data: {
        products: allProducts,
        reason: 'popular',
      },
    });
  }

  // Generate embedding for user preferences
  const preferenceText = recentQueries.join(' ');
  const preferenceVector = await generateEmbedding(
    c.env.GEMINI_API_KEY,
    preferenceText
  );

  // Get all products with vectors
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.status, 'active'))
    .all();

  // Filter products with valid vectors
  const productsWithVectors = allProducts
    .filter((p) => p.vectorEmbedding && Array.isArray(p.vectorEmbedding))
    .map((p) => ({
      id: p.id,
      vector: p.vectorEmbedding as number[],
      data: p,
    }));

  // Find most similar products
  const recommendations = findTopKSimilar(
    preferenceVector,
    productsWithVectors,
    validated.limit * 2 // Get more to allow for filtering
  );

  // Filter out excluded products
  const filtered = recommendations
    .filter((rec) => !validated.excludeProductIds?.includes(rec.id))
    .slice(0, validated.limit);

  // Log recommendation
  db.insert(aiInteractionLogs)
    .values({
      userId: auth.userId,
      interactionType: 'recommendation',
      relatedProductIds: filtered.map((r) => r.id),
      sessionId: crypto.randomUUID(),
    })
    .run()
    .catch((err) => console.error('Failed to log recommendation:', err));

  return c.json({
    success: true,
    data: {
      products: filtered.map((rec) => rec.data),
      reason: 'personalized',
    },
  });
});

export default app;
