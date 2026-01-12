/**
 * Admin-related TypeScript type definitions
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrls: string[];
  category: string;
  brand: string;
  status: 'active' | 'draft' | 'archived';
  vectorEmbedding?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  category: string;
  brand: string;
  imageUrls?: string[];
  status?: 'active' | 'draft' | 'archived';
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  category?: string;
  brand?: string;
  imageUrls?: string[];
  status?: 'active' | 'draft' | 'archived';
}

export interface ProductListQuery {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  status?: 'active' | 'draft' | 'archived';
  search?: string;
  lowStock?: boolean;
}

export interface ProductListResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ProductResponse {
  success: boolean;
  data: Product;
}

export interface UploadUrlRequest {
  filename: string;
  contentType: string;
  productId?: string;
}

export interface UploadUrlResponse {
  success: boolean;
  data: {
    uploadUrl: string;
    fileKey: string;
    publicUrl: string;
  };
}

export interface LowStockStatsResponse {
  success: boolean;
  data: {
    count: number;
    products: Product[];
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
