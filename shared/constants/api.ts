/**
 * API constants for Vibe Commerce platform
 */

export const API_ROUTES = {
  USERS: '/api/users',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  AI_SEARCH: '/api/ai/search',
  AI_RECOMMENDATIONS: '/api/ai/recommendations',
} as const;

export const API_ERRORS = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
