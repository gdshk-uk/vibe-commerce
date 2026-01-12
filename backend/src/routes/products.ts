/**
 * Products API Routes
 * Handles product catalog operations
 */

import { Hono } from 'hono';
import { eq, like, and, gte, lte, desc } from 'drizzle-orm';
import { Env } from '../types/env';
import { createDrizzleClient } from '../db/client';
import { products } from '../db/schema';
import { clerkAuth, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { validateCreateProduct } from '../utils/validation';

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /api/products
 * List products with optional filters
 * Public endpoint (no auth required)
 */
app.get('/', optionalAuth, async (c) => {
  const db = createDrizzleClient(c.env.DB);

  // Parse query parameters
  const category = c.req.query('category');
  const brand = c.req.query('brand');
  const minPrice = c.req.query('minPrice');
  const maxPrice = c.req.query('maxPrice');
  const status = c.req.query('status');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  // Build query conditions
  const conditions = [];
  if (category) conditions.push(eq(products.category, category));
  if (brand) conditions.push(eq(products.brand, brand));
  if (minPrice) conditions.push(gte(products.price, parseFloat(minPrice)));
  if (maxPrice) conditions.push(lte(products.price, parseFloat(maxPrice)));
  if (status) conditions.push(eq(products.status, status as any));

  // Execute query
  const productList = await db
    .select()
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  // Get total count (simplified - in production, use COUNT query)
  const total = productList.length;

  return c.json({
    success: true,
    data: {
      products: productList,
      total,
      limit,
      offset,
    },
  });
});

/**
 * GET /api/products/:id
 * Get product by ID
 * Public endpoint
 */
app.get('/:id', optionalAuth, async (c) => {
  const productId = c.req.param('id');
  const db = createDrizzleClient(c.env.DB);

  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!product) {
    throw new AppError('NOT_FOUND', 'Product not found');
  }

  return c.json({
    success: true,
    data: product,
  });
});

/**
 * POST /api/products
 * Create new product (admin only - auth required)
 */
app.post('/', clerkAuth, async (c) => {
  const body = await c.req.json();
  const validatedData = validateCreateProduct(body);
  const db = createDrizzleClient(c.env.DB);

  const newProduct = await db
    .insert(products)
    .values({
      name: validatedData.name,
      description: validatedData.description,
      price: validatedData.price,
      stockQuantity: validatedData.stockQuantity,
      imageUrls: validatedData.imageUrls,
      category: validatedData.category,
      brand: validatedData.brand,
      status: validatedData.status,
    })
    .returning()
    .get();

  return c.json(
    {
      success: true,
      data: newProduct,
    },
    201
  );
});

/**
 * PUT /api/products/:id
 * Update product (admin only - auth required)
 */
app.put('/:id', clerkAuth, async (c) => {
  const productId = c.req.param('id');
  const body = await c.req.json();
  const db = createDrizzleClient(c.env.DB);

  // Check if product exists
  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!existingProduct) {
    throw new AppError('NOT_FOUND', 'Product not found');
  }

  // Update product
  const updatedProduct = await db
    .update(products)
    .set({
      name: body.name || existingProduct.name,
      description: body.description || existingProduct.description,
      price: body.price !== undefined ? body.price : existingProduct.price,
      stockQuantity:
        body.stockQuantity !== undefined
          ? body.stockQuantity
          : existingProduct.stockQuantity,
      imageUrls: body.imageUrls || existingProduct.imageUrls,
      category: body.category || existingProduct.category,
      brand: body.brand || existingProduct.brand,
      status: body.status || existingProduct.status,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(products.id, productId))
    .returning()
    .get();

  return c.json({
    success: true,
    data: updatedProduct,
  });
});

/**
 * DELETE /api/products/:id
 * Delete product (admin only - auth required)
 */
app.delete('/:id', clerkAuth, async (c) => {
  const productId = c.req.param('id');
  const db = createDrizzleClient(c.env.DB);

  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!existingProduct) {
    throw new AppError('NOT_FOUND', 'Product not found');
  }

  await db.delete(products).where(eq(products.id, productId));

  return c.json({
    success: true,
    data: { message: 'Product deleted successfully' },
  });
});

export default app;
