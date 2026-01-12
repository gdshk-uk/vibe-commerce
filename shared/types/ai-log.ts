/**
 * AI Interaction Log types for Vibe Commerce platform
 * Used to track Gemini AI agent interactions and recommendations
 */

export type InteractionType = 'search' | 'recommendation' | 'conversation';

export interface AIInteractionLog {
  id: string;
  userId: string | null;
  interactionType: InteractionType;
  queryText: string | null;
  responseText: string | null;
  relatedProductIds: string[];
  inputEmbedding: number[] | null;
  outputEmbedding: number[] | null;
  sessionId: string;
  createdAt: string;
}

export interface CreateAILogInput {
  userId?: string;
  interactionType: InteractionType;
  queryText?: string;
  responseText?: string;
  relatedProductIds?: string[];
  inputEmbedding?: number[];
  outputEmbedding?: number[];
  sessionId: string;
}

export type AILogResponse = AIInteractionLog;
