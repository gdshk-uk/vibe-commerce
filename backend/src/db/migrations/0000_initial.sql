-- Vibe Commerce Platform - Initial Database Migration
-- Creates all core tables for Phase 1
-- Generated: 2026-01-12

-- ============================================================
-- Users Table
-- Stores platform user profiles linked to Clerk authentication
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  profile_image_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- Products Table
-- Stores product catalog with vector embeddings for AI search
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL CHECK(price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
  image_urls TEXT NOT NULL DEFAULT '[]',
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_stock' CHECK(status IN ('in_stock', 'out_of_stock', 'pre_order')),
  vector_embedding TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- ============================================================
-- Orders Table
-- Records user purchase orders with status tracking
-- Row Level Security (RLS) will be enforced in application layer
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  total_amount REAL NOT NULL CHECK(total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'shipped', 'completed', 'cancelled')),
  shipping_address TEXT NOT NULL,
  billing_address TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ============================================================
-- Order Items Table
-- Details specific products and quantities within each order
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price REAL NOT NULL CHECK(unit_price >= 0),
  total_price REAL NOT NULL CHECK(total_price >= 0),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================================
-- AI Interaction Logs Table
-- Records Gemini AI agent interactions and recommendations
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_interaction_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  interaction_type TEXT NOT NULL CHECK(interaction_type IN ('search', 'recommendation', 'conversation')),
  query_text TEXT,
  response_text TEXT,
  related_product_ids TEXT NOT NULL DEFAULT '[]',
  input_embedding TEXT,
  output_embedding TEXT,
  session_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_session_id ON ai_interaction_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_interaction_type ON ai_interaction_logs(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_interaction_logs(created_at);

-- ============================================================
-- Seed Data (Optional - for development)
-- ============================================================

-- Sample Products
INSERT OR IGNORE INTO products (id, name, description, price, stock_quantity, image_urls, category, brand, status, created_at, updated_at) VALUES
('prod-001', 'Premium Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 299.99, 50, '["https://example.com/headphones1.jpg"]', 'Electronics', 'AudioTech', 'in_stock', datetime('now'), datetime('now')),
('prod-002', 'Smart Fitness Watch', 'Advanced fitness tracker with heart rate monitoring', 199.99, 100, '["https://example.com/watch1.jpg"]', 'Electronics', 'FitTech', 'in_stock', datetime('now'), datetime('now')),
('prod-003', 'Organic Cotton T-Shirt', 'Comfortable and sustainable cotton t-shirt', 29.99, 200, '["https://example.com/tshirt1.jpg"]', 'Clothing', 'EcoWear', 'in_stock', datetime('now'), datetime('now'));
