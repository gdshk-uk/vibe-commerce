/**
 * Rate Limiting Middleware
 * Prevents API abuse by limiting requests per user
 */

import { Context, Next } from 'hono';
import { Env } from '../types/env';
import { getAuthUser } from './auth';

/**
 * In-memory rate limit store (per Worker instance)
 * In production, consider using Durable Objects or KV for distributed rate limiting
 */
const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

/**
 * Default AI rate limit: 20 requests per 15 minutes
 */
const AI_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
};

/**
 * Search rate limit: 60 requests per minute
 */
const SEARCH_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
};

/**
 * Clean up expired entries (run periodically)
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Check if user has exceeded rate limit
 */
function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const key = userId;

  const userLimit = rateLimitStore.get(key);

  if (!userLimit || now > userLimit.resetTime) {
    // New window or expired
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Within existing window
  if (userLimit.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: userLimit.resetTime,
    };
  }

  // Increment count
  userLimit.count++;
  rateLimitStore.set(key, userLimit);

  return {
    allowed: true,
    remaining: config.maxRequests - userLimit.count,
    resetTime: userLimit.resetTime,
  };
}

/**
 * AI rate limit middleware
 * Limits AI-related requests (chat, embeddings)
 */
export async function aiRateLimit(c: Context<{ Bindings: Env }>, next: Next) {
  const auth = getAuthUser(c);

  if (!auth) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      401
    );
  }

  const result = checkRateLimit(`ai:${auth.userId}`, AI_RATE_LIMIT);

  // Set rate limit headers
  c.header('X-RateLimit-Limit', AI_RATE_LIMIT.maxRequests.toString());
  c.header('X-RateLimit-Remaining', result.remaining.toString());
  c.header('X-RateLimit-Reset', result.resetTime.toString());

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    c.header('Retry-After', retryAfter.toString());

    return c.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many AI requests. Please try again later.',
          retryAfter,
        },
      },
      429
    );
  }

  await next();
}

/**
 * Search rate limit middleware
 * Limits search-related requests
 */
export async function searchRateLimit(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  const auth = getAuthUser(c);

  // Use IP address for anonymous users
  const userId = auth?.userId || c.req.header('CF-Connecting-IP') || 'anonymous';

  const result = checkRateLimit(`search:${userId}`, SEARCH_RATE_LIMIT);

  // Set rate limit headers
  c.header('X-RateLimit-Limit', SEARCH_RATE_LIMIT.maxRequests.toString());
  c.header('X-RateLimit-Remaining', result.remaining.toString());
  c.header('X-RateLimit-Reset', result.resetTime.toString());

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    c.header('Retry-After', retryAfter.toString());

    return c.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many search requests. Please slow down.',
          retryAfter,
        },
      },
      429
    );
  }

  await next();
}

/**
 * Custom rate limit middleware factory
 */
export function createRateLimit(config: RateLimitConfig, prefix: string = '') {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const auth = getAuthUser(c);
    const userId =
      auth?.userId || c.req.header('CF-Connecting-IP') || 'anonymous';

    const result = checkRateLimit(`${prefix}:${userId}`, config);

    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', result.resetTime.toString());

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());

      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter,
          },
        },
        429
      );
    }

    await next();
  };
}
