/**
 * Central export for all shared types
 */

export * from './user';
export * from './product';
export * from './order';
export * from './ai-log';

/**
 * Common API response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}
