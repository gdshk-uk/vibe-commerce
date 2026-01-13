/**
 * AI Validation Schemas
 * Zod schemas for AI-related API requests
 */

import { z } from 'zod';

/**
 * Sanitize prompt text to remove potential harmful content
 */
export function sanitizePrompt(text: string): string {
  // Remove excessive whitespace
  let sanitized = text.trim().replace(/\s+/g, ' ');

  // Remove common SQL injection patterns (basic protection)
  sanitized = sanitized.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/gi, '');

  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  return sanitized;
}

/**
 * Chat message schema
 */
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string().min(1).max(2000),
});

/**
 * AI chat request schema
 */
export const aiChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message is too long')
    .transform(sanitizePrompt),
  conversationHistory: z
    .array(chatMessageSchema)
    .max(10, 'Conversation history is too long')
    .optional()
    .default([]),
  context: z
    .object({
      currentProductId: z.string().uuid().optional(),
      recentOrders: z.array(z.string()).max(5).optional(),
      userPreferences: z.array(z.string()).max(10).optional(),
    })
    .optional(),
});

/**
 * Semantic search request schema
 */
export const semanticSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(500, 'Search query is too long')
    .transform(sanitizePrompt),
  limit: z
    .number()
    .int()
    .positive()
    .max(50, 'Limit cannot exceed 50')
    .default(10),
  minSimilarity: z
    .number()
    .min(0)
    .max(1)
    .default(0.5),
  category: z.string().optional(),
  brand: z.string().optional(),
});

/**
 * Product vectorization request schema
 */
export const vectorizeProductSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  forceRegenerate: z.boolean().optional().default(false),
});

/**
 * Batch vectorization request schema
 */
export const batchVectorizeSchema = z.object({
  productIds: z
    .array(z.string().uuid())
    .min(1, 'At least one product ID required')
    .max(100, 'Cannot vectorize more than 100 products at once'),
});

/**
 * AI recommendations request schema
 */
export const recommendationsSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(20, 'Limit cannot exceed 20')
    .default(5),
  excludeProductIds: z.array(z.string().uuid()).optional(),
  category: z.string().optional(),
});

/**
 * AI interaction log creation schema
 */
export const createAILogSchema = z.object({
  interactionType: z.enum(['search', 'recommendation', 'conversation']),
  queryText: z.string().optional(),
  responseText: z.string().optional(),
  relatedProductIds: z.array(z.string().uuid()).optional(),
  sessionId: z.string().min(1),
});

// Type exports
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type AIChatRequest = z.infer<typeof aiChatRequestSchema>;
export type SemanticSearchRequest = z.infer<typeof semanticSearchSchema>;
export type VectorizeProductRequest = z.infer<typeof vectorizeProductSchema>;
export type BatchVectorizeRequest = z.infer<typeof batchVectorizeSchema>;
export type RecommendationsRequest = z.infer<typeof recommendationsSchema>;
export type CreateAILogRequest = z.infer<typeof createAILogSchema>;
