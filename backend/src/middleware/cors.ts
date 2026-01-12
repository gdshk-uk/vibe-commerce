/**
 * CORS Middleware for Cloudflare Workers
 * Configures Cross-Origin Resource Sharing for frontend communication
 */

import { Context, Next } from 'hono';
import { cors as honoCors } from 'hono/cors';

/**
 * CORS configuration for production
 * Restricts origins to known frontend domains
 */
export const cors = honoCors({
  origin: (origin) => {
    // In development, allow localhost
    if (
      origin?.includes('localhost') ||
      origin?.includes('127.0.0.1') ||
      origin?.includes('.pages.dev')
    ) {
      return origin;
    }

    // In production, only allow specific domains
    const allowedOrigins = [
      'https://vibe-commerce.com',
      'https://www.vibe-commerce.com',
      // Add your Cloudflare Pages domain here
    ];

    if (origin && allowedOrigins.includes(origin)) {
      return origin;
    }

    // Reject other origins
    return '';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 hours
  credentials: true,
});

/**
 * Custom CORS middleware with additional security headers
 */
export async function corsWithSecurityHeaders(c: Context, next: Next) {
  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204, {
      'Access-Control-Allow-Origin': c.req.header('Origin') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
  }

  await next();

  // Add security headers to all responses
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
}
