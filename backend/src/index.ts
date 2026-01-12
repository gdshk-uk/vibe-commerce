/**
 * Vibe Commerce API - Cloudflare Workers Entry Point
 * Built with Hono framework for high performance edge routing
 *
 * Deployment: Configured and ready for production
 * Version: 1.0.0
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { Env } from './types/env';
import { cors } from './middleware/cors';
import { errorHandler } from './middleware/error-handler';

// Import route handlers
import usersRoutes from './routes/users';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import adminProductsRoutes from './routes/admin/products';

// Initialize Hono app with typed environment
const app = new Hono<{ Bindings: Env }>();

// ============================================================
// Global Middleware
// ============================================================

// Request logging
app.use('*', logger());

// CORS configuration
app.use('*', cors);

// ============================================================
// Health Check & Meta Endpoints
// ============================================================

app.get('/', (c) => {
  return c.json({
    name: 'Vibe Commerce API',
    version: '1.0.0',
    status: 'operational',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: 'edge-deployed',
  });
});

// ============================================================
// API Routes
// ============================================================

// Mount route handlers
app.route('/api/users', usersRoutes);
app.route('/api/products', productsRoutes);
app.route('/api/orders', ordersRoutes);

// Admin routes
app.route('/api/admin/products', adminProductsRoutes);

// ============================================================
// 404 Handler
// ============================================================

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.path} not found`,
      },
    },
    404
  );
});

// ============================================================
// Global Error Handler
// ============================================================

app.onError(errorHandler);

// ============================================================
// Export Worker
// ============================================================

export default app;
