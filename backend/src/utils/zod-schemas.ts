/**
 * Zod Validation Schemas
 * Defines validation rules for API requests
 */

import { z } from 'zod';

/**
 * Product creation schema
 */
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  stockQuantity: z.number().int().nonnegative('Stock quantity must be non-negative'),
  lowStockThreshold: z.number().int().nonnegative('Low stock threshold must be non-negative').default(10),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  imageUrls: z.array(z.string().url('Invalid image URL')).default([]),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
});

/**
 * Product update schema (all fields optional)
 */
export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  category: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
});

/**
 * Query parameters for product listing
 */
export const productListQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('20'),
  category: z.string().optional(),
  brand: z.string().optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  search: z.string().optional(),
  lowStock: z.string().transform(val => val === 'true').optional(),
});

/**
 * R2 upload request schema
 */
export const uploadRequestSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().min(1, 'Content type is required'),
  productId: z.string().uuid('Invalid product ID').optional(),
});

// Type exports
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type UploadRequest = z.infer<typeof uploadRequestSchema>;
