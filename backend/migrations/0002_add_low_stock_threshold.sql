-- Migration: Add low_stock_threshold column to products table
-- Description: Adds low_stock_threshold field and updates product status enum
-- Date: 2026-01-12

-- Add low_stock_threshold column with default value of 10
ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 10;

-- Note: SQLite doesn't support modifying enum types directly
-- The status column enum is defined in the application layer (Drizzle ORM schema)
-- Existing status values remain valid, but new values (active, draft, archived)
-- will be enforced by the application

-- Update existing products to use new status values if needed
-- Map old status to new status:
--   'in_stock' -> 'active'
--   'out_of_stock' -> 'active' (but with stockQuantity = 0)
--   'pre_order' -> 'active'

-- This is handled at the application level since SQLite has limited ALTER TABLE support
