/**
 * R2 Upload Service
 * Handles image uploads to Cloudflare R2
 */

import { R2Bucket } from '@cloudflare/workers-types';

/**
 * Generate a unique filename with UUID
 */
function generateUniqueFilename(originalFilename: string, productId?: string): string {
  const uuid = crypto.randomUUID();
  const extension = originalFilename.split('.').pop();
  const sanitizedName = originalFilename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50);

  if (productId) {
    return `products/${productId}/${uuid}-${sanitizedName}`;
  }

  return `products/temp/${uuid}-${sanitizedName}`;
}

/**
 * Generate presigned URL for R2 upload
 *
 * @param bucket - R2 Bucket instance
 * @param filename - Original filename
 * @param contentType - MIME type
 * @param productId - Optional product ID for organized storage
 * @returns Object with upload URL and final file key
 */
export async function generatePresignedUploadUrl(
  bucket: R2Bucket,
  filename: string,
  contentType: string,
  productId?: string
): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
  const fileKey = generateUniqueFilename(filename, productId);

  // R2 presigned URL generation (valid for 1 hour)
  const expiresIn = 3600; // 1 hour in seconds

  // Note: R2 presigned URLs require additional configuration
  // For now, we'll use direct upload endpoint
  // In production, configure R2 custom domain or Workers route

  const uploadUrl = `/api/admin/products/upload/${encodeURIComponent(fileKey)}`;
  const publicUrl = `/assets/${fileKey}`;

  return {
    uploadUrl,
    fileKey,
    publicUrl,
  };
}

/**
 * Upload file directly to R2
 *
 * @param bucket - R2 Bucket instance
 * @param fileKey - File key in R2
 * @param fileData - File data as ArrayBuffer
 * @param contentType - MIME type
 */
export async function uploadToR2(
  bucket: R2Bucket,
  fileKey: string,
  fileData: ArrayBuffer,
  contentType: string
): Promise<void> {
  await bucket.put(fileKey, fileData, {
    httpMetadata: {
      contentType,
    },
  });
}

/**
 * Delete file from R2
 *
 * @param bucket - R2 Bucket instance
 * @param fileKey - File key to delete
 */
export async function deleteFromR2(
  bucket: R2Bucket,
  fileKey: string
): Promise<void> {
  await bucket.delete(fileKey);
}

/**
 * Get file from R2
 *
 * @param bucket - R2 Bucket instance
 * @param fileKey - File key to retrieve
 */
export async function getFromR2(
  bucket: R2Bucket,
  fileKey: string
): Promise<R2ObjectBody | null> {
  return await bucket.get(fileKey);
}

/**
 * Validate image file type
 */
export function isValidImageType(contentType: string): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  return validTypes.includes(contentType.toLowerCase());
}

/**
 * Validate file size (max 10MB)
 */
export function isValidFileSize(sizeInBytes: number): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return sizeInBytes <= maxSize;
}
