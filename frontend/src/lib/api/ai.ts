/**
 * AI API Client
 * Handles AI chat, semantic search, and recommendations
 */

import { getApiUrl } from '../utils';
import type {
  AIChatRequest,
  SSEEvent,
  SearchRequest,
  SearchResponse,
  RecommendationsRequest,
  RecommendationsResponse,
} from '@/types/ai';
import type { ApiResponse } from '../api';

/**
 * Stream AI chat response using Server-Sent Events
 */
export async function streamAIChat(
  request: AIChatRequest,
  token: string,
  onChunk: (content: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  const url = `${getApiUrl()}/api/ai/chat`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if response is SSE
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/event-stream')) {
      throw new Error('Expected Server-Sent Events stream');
    }

    // Read SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete message in buffer

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) {
          continue;
        }

        try {
          const data = JSON.parse(line.substring(6)) as SSEEvent;

          switch (data.type) {
            case 'connected':
              // Connection established
              break;

            case 'chunk':
              if (data.content) {
                onChunk(data.content);
              }
              break;

            case 'done':
              onComplete();
              return;

            case 'error':
              onError(data.message || 'Unknown error');
              return;
          }
        } catch (err) {
          console.error('Failed to parse SSE message:', err);
        }
      }
    }

    onComplete();
  } catch (error) {
    console.error('AI chat stream error:', error);
    onError(error instanceof Error ? error.message : 'Failed to connect to AI');
  }
}

/**
 * Perform semantic search
 */
export async function semanticSearch(
  request: SearchRequest,
  token?: string
): Promise<ApiResponse<SearchResponse>> {
  const params = new URLSearchParams({
    query: request.query,
    ...(request.limit && { limit: request.limit.toString() }),
    ...(request.minSimilarity && { minSimilarity: request.minSimilarity.toString() }),
    ...(request.category && { category: request.category }),
    ...(request.brand && { brand: request.brand }),
  });

  const url = `${getApiUrl()}/api/search?${params}`;

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Search failed');
    }

    return data;
  } catch (error) {
    console.error('Semantic search error:', error);
    return {
      success: false,
      error: {
        code: 'SEARCH_FAILED',
        message: error instanceof Error ? error.message : 'Search failed',
      },
    };
  }
}

/**
 * Get personalized recommendations
 */
export async function getRecommendations(
  request: RecommendationsRequest,
  token: string
): Promise<ApiResponse<RecommendationsResponse>> {
  const params = new URLSearchParams({
    ...(request.limit && { limit: request.limit.toString() }),
    ...(request.excludeProductIds && {
      excludeProductIds: JSON.stringify(request.excludeProductIds),
    }),
    ...(request.category && { category: request.category }),
  });

  const url = `${getApiUrl()}/api/ai/recommendations?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get recommendations');
    }

    return data;
  } catch (error) {
    console.error('Recommendations error:', error);
    return {
      success: false,
      error: {
        code: 'RECOMMENDATIONS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to get recommendations',
      },
    };
  }
}

/**
 * Cancel an ongoing SSE stream
 */
export function createAbortController(): AbortController {
  return new AbortController();
}
