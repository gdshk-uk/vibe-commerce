/**
 * Drizzle ORM Schema for Vibe Commerce Platform
 * Defines all database tables and relationships
 */

import { sql } from 'drizzle-orm';
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

/**
 * Users Table
 * Stores platform user profiles linked to Clerk authentication
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  profileImageUrl: text('profile_image_url'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

/**
 * Products Table
 * Stores all product details, inventory, and vector embeddings for AI search
 */
export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: real('price').notNull(),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  imageUrls: text('image_urls', { mode: 'json' })
    .notNull()
    .$type<string[]>()
    .default(sql`'[]'`),
  category: text('category').notNull(),
  brand: text('brand').notNull(),
  status: text('status', { enum: ['in_stock', 'out_of_stock', 'pre_order'] })
    .notNull()
    .default('in_stock'),
  vectorEmbedding: text('vector_embedding', { mode: 'json' }).$type<number[]>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

/**
 * Orders Table
 * Records user purchase orders with status tracking
 * Protected by Row Level Security (RLS)
 */
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  totalAmount: real('total_amount').notNull(),
  status: text('status', {
    enum: ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'],
  })
    .notNull()
    .default('pending'),
  shippingAddress: text('shipping_address').notNull(),
  billingAddress: text('billing_address').notNull(),
  paymentStatus: text('payment_status', {
    enum: ['pending', 'paid', 'failed', 'refunded'],
  })
    .notNull()
    .default('pending'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

/**
 * Order Items Table
 * Details specific products and quantities within each order
 */
export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull(),
});

/**
 * AI Interaction Logs Table
 * Records Gemini AI agent interactions, searches, and recommendations
 */
export const aiInteractionLogs = sqliteTable('ai_interaction_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id),
  interactionType: text('interaction_type', {
    enum: ['search', 'recommendation', 'conversation'],
  }).notNull(),
  queryText: text('query_text'),
  responseText: text('response_text'),
  relatedProductIds: text('related_product_ids', { mode: 'json' })
    .$type<string[]>()
    .default(sql`'[]'`),
  inputEmbedding: text('input_embedding', { mode: 'json' }).$type<number[]>(),
  outputEmbedding: text('output_embedding', { mode: 'json' }).$type<number[]>(),
  sessionId: text('session_id').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Type exports for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type AIInteractionLog = typeof aiInteractionLogs.$inferSelect;
export type NewAIInteractionLog = typeof aiInteractionLogs.$inferInsert;
