/**
 * AI and Search Types
 */

/**
 * Chat message type
 */
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp?: Date;
}

/**
 * Chat context for AI assistant
 */
export interface ChatContext {
  currentProductId?: string;
  recentOrders?: string[];
  userPreferences?: string[];
}

/**
 * AI chat request
 */
export interface AIChatRequest {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'model'; content: string }>;
  context?: ChatContext;
}

/**
 * SSE event types
 */
export type SSEEventType = 'connected' | 'chunk' | 'done' | 'error';

/**
 * SSE event data
 */
export interface SSEEvent {
  type: SSEEventType;
  content?: string;
  message?: string;
}

/**
 * Product result with similarity score
 */
export interface SearchProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrls: string[];
  category: string;
  brand: string;
  status: 'active' | 'draft' | 'archived';
  similarity?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Search request parameters
 */
export interface SearchRequest {
  query: string;
  limit?: number;
  minSimilarity?: number;
  category?: string;
  brand?: string;
}

/**
 * Search response
 */
export interface SearchResponse {
  products: SearchProduct[];
  total: number;
  method: 'hybrid' | 'keyword' | 'keyword-fallback';
}

/**
 * Recommendations request parameters
 */
export interface RecommendationsRequest {
  limit?: number;
  excludeProductIds?: string[];
  category?: string;
}

/**
 * Recommendations response
 */
export interface RecommendationsResponse {
  products: SearchProduct[];
  reason: 'personalized' | 'popular';
}
