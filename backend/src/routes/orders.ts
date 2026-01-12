/**
 * Orders API Routes
 * Handles order creation and management with Row Level Security (RLS)
 */

import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { Env } from '../types/env';
import { createDrizzleClient } from '../db/client';
import { orders, orderItems, products, users } from '../db/schema';
import { clerkAuth, requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { validateCreateOrder } from '../utils/validation';
import { enforceRLS } from '../utils/security';

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /api/orders
 * List orders for authenticated user (RLS enforced)
 */
app.get('/', clerkAuth, async (c) => {
  const auth = requireAuth(c);
  const db = createDrizzleClient(c.env.DB);

  // Get user's internal ID
  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, auth.clerkId))
    .get();

  if (!user) {
    throw new AppError('NOT_FOUND', 'User profile not found');
  }

  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  // RLS: Only fetch orders belonging to current user
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  return c.json({
    success: true,
    data: {
      orders: userOrders,
      total: userOrders.length,
      limit,
      offset,
    },
  });
});

/**
 * GET /api/orders/:id
 * Get order by ID (RLS enforced - user can only view own orders)
 */
app.get('/:id', clerkAuth, async (c) => {
  const auth = requireAuth(c);
  const orderId = c.req.param('id');
  const db = createDrizzleClient(c.env.DB);

  // Get user's internal ID
  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, auth.clerkId))
    .get();

  if (!user) {
    throw new AppError('NOT_FOUND', 'User profile not found');
  }

  // Get order
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .get();

  if (!order) {
    throw new AppError('NOT_FOUND', 'Order not found');
  }

  // RLS: Ensure user owns this order
  enforceRLS(order.userId, user.id);

  // Get order items
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .all();

  return c.json({
    success: true,
    data: {
      ...order,
      items,
    },
  });
});

/**
 * POST /api/orders
 * Create new order for authenticated user
 */
app.post('/', clerkAuth, async (c) => {
  const auth = requireAuth(c);
  const body = await c.req.json();
  const validatedData = validateCreateOrder(body);
  const db = createDrizzleClient(c.env.DB);

  // Get user's internal ID
  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, auth.clerkId))
    .get();

  if (!user) {
    throw new AppError(
      'NOT_FOUND',
      'User profile not found. Please create a profile first.'
    );
  }

  // Calculate total amount and validate products
  let totalAmount = 0;
  const orderItemsData = [];

  for (const item of validatedData.items) {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId))
      .get();

    if (!product) {
      throw new AppError('NOT_FOUND', `Product ${item.productId} not found`);
    }

    if (product.stockQuantity < item.quantity) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Insufficient stock for product ${product.name}`
      );
    }

    const itemTotal = product.price * item.quantity;
    totalAmount += itemTotal;

    orderItemsData.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
      totalPrice: itemTotal,
    });
  }

  // Create order
  const newOrder = await db
    .insert(orders)
    .values({
      userId: user.id,
      totalAmount,
      shippingAddress: validatedData.shippingAddress,
      billingAddress: validatedData.billingAddress,
      status: 'pending',
      paymentStatus: 'pending',
    })
    .returning()
    .get();

  // Create order items
  const createdItems = [];
  for (const itemData of orderItemsData) {
    const orderItem = await db
      .insert(orderItems)
      .values({
        orderId: newOrder.id,
        ...itemData,
      })
      .returning()
      .get();

    createdItems.push(orderItem);

    // Update product stock
    await db
      .update(products)
      .set({
        stockQuantity: (await db
          .select()
          .from(products)
          .where(eq(products.id, itemData.productId))
          .get())!.stockQuantity - itemData.quantity,
      })
      .where(eq(products.id, itemData.productId));
  }

  return c.json(
    {
      success: true,
      data: {
        ...newOrder,
        items: createdItems,
      },
    },
    201
  );
});

/**
 * PATCH /api/orders/:id/status
 * Update order status (admin only or user can cancel own pending orders)
 */
app.patch('/:id/status', clerkAuth, async (c) => {
  const auth = requireAuth(c);
  const orderId = c.req.param('id');
  const { status } = await c.req.json();
  const db = createDrizzleClient(c.env.DB);

  if (!status || !['pending', 'confirmed', 'shipped', 'completed', 'cancelled'].includes(status)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid order status');
  }

  // Get user's internal ID
  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, auth.clerkId))
    .get();

  if (!user) {
    throw new AppError('NOT_FOUND', 'User profile not found');
  }

  // Get order
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .get();

  if (!order) {
    throw new AppError('NOT_FOUND', 'Order not found');
  }

  // RLS: Ensure user owns this order
  enforceRLS(order.userId, user.id);

  // Users can only cancel their own pending orders
  if (order.userId === user.id && status === 'cancelled' && order.status === 'pending') {
    const updatedOrder = await db
      .update(orders)
      .set({
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId))
      .returning()
      .get();

    return c.json({
      success: true,
      data: updatedOrder,
    });
  }

  // Other status updates require admin privileges (not implemented in Phase 1)
  throw new AppError(
    'FORBIDDEN',
    'You do not have permission to update this order status'
  );
});

export default app;
