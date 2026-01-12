/**
 * Error Handling Middleware for Cloudflare Workers
 * Provides consistent error responses and logging
 */

import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Standardized error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Error codes mapping to HTTP status codes
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  DATABASE_ERROR: 500,
  RATE_LIMIT_EXCEEDED: 429,
} as const;

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public code: keyof typeof ERROR_CODES,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }

  toResponse(): ErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }

  getStatusCode(): number {
    return ERROR_CODES[this.code] || 500;
  }
}

/**
 * Global error handler middleware
 * Catches all errors and formats them consistently
 */
export function errorHandler(err: Error, c: Context) {
  console.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  // Handle custom AppError
  if (err instanceof AppError) {
    return c.json(err.toResponse(), err.getStatusCode());
  }

  // Handle Hono HTTPException
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: 'HTTP_ERROR',
          message: err.message,
        },
      },
      err.status
    );
  }

  // Handle unknown errors
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message:
          c.env?.ENVIRONMENT === 'production'
            ? 'An internal error occurred'
            : err.message,
        details:
          c.env?.ENVIRONMENT === 'production'
            ? undefined
            : {
                name: err.name,
                stack: err.stack,
              },
      },
    },
    500
  );
}

/**
 * Helper to throw AppError
 */
export function throwError(
  code: keyof typeof ERROR_CODES,
  message: string,
  details?: unknown
): never {
  throw new AppError(code, message, details);
}
