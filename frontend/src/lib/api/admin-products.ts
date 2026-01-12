/**
 * Admin Products API Client
 * Handles all product management API calls
 */

import { getApiUrl } from '../utils';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductListQuery,
  ProductListResponse,
  ProductResponse,
  UploadUrlRequest,
  UploadUrlResponse,
  LowStockStatsResponse,
  ApiError,
} from '@/types/admin';

/**
 * Get authorization token from Clerk
 */
async function getAuthToken(): Promise<string> {
  // This will be populated by Clerk's useAuth hook in the component
  // For now, we'll expect it to be passed or available globally
  const token = (window as any).__CLERK_TOKEN__;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const apiUrl = getApiUrl();

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error((data as ApiError).error?.message || 'API request failed');
  }

  return data;
}

/**
 * List all products with optional filters
 */
export async function listProducts(
  query?: ProductListQuery
): Promise<ProductListResponse> {
  const params = new URLSearchParams();

  if (query) {
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.category) params.append('category', query.category);
    if (query.brand) params.append('brand', query.brand);
    if (query.status) params.append('status', query.status);
    if (query.search) params.append('search', query.search);
    if (query.lowStock !== undefined)
      params.append('lowStock', query.lowStock.toString());
  }

  const queryString = params.toString();
  const endpoint = `/api/admin/products${queryString ? `?${queryString}` : ''}`;

  return apiRequest<ProductListResponse>(endpoint);
}

/**
 * Get single product by ID
 */
export async function getProduct(id: string): Promise<ProductResponse> {
  return apiRequest<ProductResponse>(`/api/admin/products/${id}`);
}

/**
 * Create new product
 */
export async function createProduct(
  data: CreateProductInput
): Promise<ProductResponse> {
  return apiRequest<ProductResponse>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update existing product
 */
export async function updateProduct(
  id: string,
  data: UpdateProductInput
): Promise<ProductResponse> {
  return apiRequest<ProductResponse>(`/api/admin/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete product (soft delete)
 */
export async function deleteProduct(
  id: string
): Promise<{ success: boolean; data: { message: string } }> {
  return apiRequest(`/api/admin/products/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get presigned URL for image upload
 */
export async function getUploadUrl(
  request: UploadUrlRequest
): Promise<UploadUrlResponse> {
  return apiRequest<UploadUrlResponse>('/api/admin/products/upload-url', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Upload image file
 */
export async function uploadImage(file: File, productId?: string): Promise<string> {
  // Get presigned URL
  const { data } = await getUploadUrl({
    filename: file.name,
    contentType: file.type,
    productId,
  });

  // Upload file to R2
  const token = await getAuthToken();
  const apiUrl = getApiUrl();

  const uploadResponse = await fetch(`${apiUrl}${data.uploadUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type,
      Authorization: `Bearer ${token}`,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image');
  }

  const uploadResult = await uploadResponse.json();
  return uploadResult.data.publicUrl;
}

/**
 * Get low stock statistics
 */
export async function getLowStockStats(): Promise<LowStockStatsResponse> {
  return apiRequest<LowStockStatsResponse>('/api/admin/products/stats/low-stock');
}
