/**
 * Admin Products API Routes
 * Handles product management for administrators
 * All routes require admin role
 */

import { Hono } from 'hono';
import { eq, like, and, sql, desc } from 'drizzle-orm';
import { Env } from '../../types/env';
import { createDrizzleClient } from '../../db/client';
import { products } from '../../db/schema';
import { isAdmin } from '../../middleware/rbac';
import { AppError } from '../../middleware/error-handler';
import {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
  uploadRequestSchema,
} from '../../utils/zod-schemas';
import {
  generatePresignedUploadUrl,
  uploadToR2,
  deleteFromR2,
  isValidImageType,
  isValidFileSize,
} from '../../services/r2-upload';

const app = new Hono<{ Bindings: Env }>();

// Apply admin middleware to all routes
app.use('*', isAdmin);

/**
 * GET /api/admin/products
 * List all products with pagination and filters
 */
app.get('/', async (c) => {
  const db = createDrizzleClient(c.env.DB);
  const query = c.req.query();

  // Validate query parameters
  const validated = productListQuerySchema.parse({
    page: query.page || '1',
    limit: query.limit || '20',
    category: query.category,
    brand: query.brand,
    status: query.status,
    search: query.search,
    lowStock: query.lowStock,
  });

  const offset = (validated.page - 1) * validated.limit;

  // Build query conditions
  const conditions = [];

  if (validated.category) {
    conditions.push(eq(products.category, validated.category));
  }

  if (validated.brand) {
    conditions.push(eq(products.brand, validated.brand));
  }

  if (validated.status) {
    conditions.push(eq(products.status, validated.status));
  }

  if (validated.search) {
    conditions.push(
      sql`${products.name} LIKE ${`%${validated.search}%`} OR ${products.description} LIKE ${`%${validated.search}%`}`
    );
  }

  if (validated.lowStock) {
    conditions.push(sql`${products.stockQuantity} <= ${products.lowStockThreshold}`);
  }

  // Execute query
  const productList = await db
    .select()
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(products.updatedAt))
    .limit(validated.limit)
    .offset(offset)
    .all();

  // Get total count
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .get();

  const total = totalResult?.count || 0;

  return c.json({
    success: true,
    data: {
      products: productList,
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total,
        totalPages: Math.ceil(total / validated.limit),
      },
    },
  });
});

/**
 * POST /api/admin/products
 * Create new product
 */
app.post('/', async (c) => {
  const body = await c.req.json();
  const validated = createProductSchema.parse(body);
  const db = createDrizzleClient(c.env.DB);

  const newProduct = await db
    .insert(products)
    .values({
      name: validated.name,
      description: validated.description || '',
      price: validated.price,
      stockQuantity: validated.stockQuantity,
      lowStockThreshold: validated.lowStockThreshold,
      imageUrls: validated.imageUrls,
      category: validated.category,
      brand: validated.brand,
      status: validated.status,
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
 * GET /api/admin/products/:id
 * Get single product by ID
 */
app.get('/:id', async (c) => {
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
 * PATCH /api/admin/products/:id
 * Update product
 */
app.patch('/:id', async (c) => {
  const productId = c.req.param('id');
  const body = await c.req.json();
  const validated = updateProductSchema.parse(body);
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

  // Build update object (only include provided fields)
  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };

  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.price !== undefined) updateData.price = validated.price;
  if (validated.stockQuantity !== undefined) updateData.stockQuantity = validated.stockQuantity;
  if (validated.lowStockThreshold !== undefined) updateData.lowStockThreshold = validated.lowStockThreshold;
  if (validated.category !== undefined) updateData.category = validated.category;
  if (validated.brand !== undefined) updateData.brand = validated.brand;
  if (validated.imageUrls !== undefined) updateData.imageUrls = validated.imageUrls;
  if (validated.status !== undefined) updateData.status = validated.status;

  // Update product
  const updatedProduct = await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, productId))
    .returning()
    .get();

  return c.json({
    success: true,
    data: updatedProduct,
  });
});

/**
 * DELETE /api/admin/products/:id
 * Delete product (soft delete by archiving)
 */
app.delete('/:id', async (c) => {
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

  // Soft delete by setting status to archived
  await db
    .update(products)
    .set({ status: 'archived', updatedAt: new Date().toISOString() })
    .where(eq(products.id, productId));

  return c.json({
    success: true,
    data: { message: 'Product archived successfully' },
  });
});

/**
 * POST /api/admin/products/upload-url
 * Generate presigned URL for image upload
 */
app.post('/upload-url', async (c) => {
  const body = await c.req.json();
  const validated = uploadRequestSchema.parse(body);

  // Validate file type
  if (!isValidImageType(validated.contentType)) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid file type. Only images are allowed (JPEG, PNG, WebP, GIF)'
    );
  }

  const bucket = c.env.ASSETS;
  const { uploadUrl, fileKey, publicUrl } = await generatePresignedUploadUrl(
    bucket,
    validated.filename,
    validated.contentType,
    validated.productId
  );

  return c.json({
    success: true,
    data: {
      uploadUrl,
      fileKey,
      publicUrl,
    },
  });
});

/**
 * POST /api/admin/products/upload/:key
 * Direct upload to R2
 */
app.post('/upload/:key', async (c) => {
  const fileKey = decodeURIComponent(c.req.param('key'));
  const contentType = c.req.header('Content-Type') || 'application/octet-stream';

  // Validate file type
  if (!isValidImageType(contentType)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid file type');
  }

  // Get file data
  const arrayBuffer = await c.req.arrayBuffer();

  // Validate file size
  if (!isValidFileSize(arrayBuffer.byteLength)) {
    throw new AppError('VALIDATION_ERROR', 'File size exceeds 10MB limit');
  }

  const bucket = c.env.ASSETS;
  await uploadToR2(bucket, fileKey, arrayBuffer, contentType);

  return c.json({
    success: true,
    data: {
      fileKey,
      publicUrl: `/assets/${fileKey}`,
    },
  });
});

/**
 * GET /api/admin/products/stats/low-stock
 * Get low stock statistics
 */
app.get('/stats/low-stock', async (c) => {
  const db = createDrizzleClient(c.env.DB);

  const lowStockProducts = await db
    .select()
    .from(products)
    .where(
      and(
        sql`${products.stockQuantity} <= ${products.lowStockThreshold}`,
        eq(products.status, 'active')
      )
    )
    .all();

  return c.json({
    success: true,
    data: {
      count: lowStockProducts.length,
      products: lowStockProducts,
    },
  });
});

export default app;
