/**
 * Product entity types for Vibe Commerce platform
 * Includes vector embeddings for AI semantic search
 */

export type ProductStatus = 'in_stock' | 'out_of_stock' | 'pre_order';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrls: string[];
  category: string;
  brand: string;
  status: ProductStatus;
  vectorEmbedding: number[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrls: string[];
  category: string;
  brand: string;
  status?: ProductStatus;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  imageUrls?: string[];
  category?: string;
  brand?: string;
  status?: ProductStatus;
}

export interface ProductSearchQuery {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  limit?: number;
  offset?: number;
}

export type ProductResponse = Product;
export type ProductListResponse = {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
};
