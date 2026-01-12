/**
 * Data validation utilities
 * Provides schema validation for API requests
 */

import { isValidEmail, isValidUUID } from './security';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate user creation input
 */
export function validateCreateUser(data: unknown): {
  clerkId: string;
  email: string;
  displayName?: string;
  profileImageUrl?: string;
} {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('body', 'Request body must be an object');
  }

  const input = data as Record<string, unknown>;

  if (!input.clerkId || typeof input.clerkId !== 'string') {
    throw new ValidationError('clerkId', 'clerkId is required and must be a string');
  }

  if (!input.email || typeof input.email !== 'string') {
    throw new ValidationError('email', 'email is required and must be a string');
  }

  if (!isValidEmail(input.email)) {
    throw new ValidationError('email', 'Invalid email format');
  }

  return {
    clerkId: input.clerkId,
    email: input.email,
    displayName:
      typeof input.displayName === 'string' ? input.displayName : undefined,
    profileImageUrl:
      typeof input.profileImageUrl === 'string'
        ? input.profileImageUrl
        : undefined,
  };
}

/**
 * Validate product creation input
 */
export function validateCreateProduct(data: unknown) {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('body', 'Request body must be an object');
  }

  const input = data as Record<string, unknown>;

  if (!input.name || typeof input.name !== 'string') {
    throw new ValidationError('name', 'name is required and must be a string');
  }

  if (!input.description || typeof input.description !== 'string') {
    throw new ValidationError(
      'description',
      'description is required and must be a string'
    );
  }

  if (typeof input.price !== 'number' || input.price < 0) {
    throw new ValidationError(
      'price',
      'price is required and must be a positive number'
    );
  }

  if (
    typeof input.stockQuantity !== 'number' ||
    input.stockQuantity < 0 ||
    !Number.isInteger(input.stockQuantity)
  ) {
    throw new ValidationError(
      'stockQuantity',
      'stockQuantity must be a non-negative integer'
    );
  }

  if (!Array.isArray(input.imageUrls)) {
    throw new ValidationError('imageUrls', 'imageUrls must be an array');
  }

  if (!input.category || typeof input.category !== 'string') {
    throw new ValidationError(
      'category',
      'category is required and must be a string'
    );
  }

  if (!input.brand || typeof input.brand !== 'string') {
    throw new ValidationError('brand', 'brand is required and must be a string');
  }

  return {
    name: input.name,
    description: input.description,
    price: input.price,
    stockQuantity: input.stockQuantity,
    imageUrls: input.imageUrls as string[],
    category: input.category,
    brand: input.brand,
    status:
      input.status &&
      ['in_stock', 'out_of_stock', 'pre_order'].includes(input.status as string)
        ? (input.status as 'in_stock' | 'out_of_stock' | 'pre_order')
        : 'in_stock',
  };
}

/**
 * Validate order creation input
 */
export function validateCreateOrder(data: unknown) {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('body', 'Request body must be an object');
  }

  const input = data as Record<string, unknown>;

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new ValidationError(
      'items',
      'items is required and must be a non-empty array'
    );
  }

  // Validate each item
  for (const item of input.items) {
    if (typeof item !== 'object' || item === null) {
      throw new ValidationError('items', 'Each item must be an object');
    }

    const orderItem = item as Record<string, unknown>;

    if (!orderItem.productId || typeof orderItem.productId !== 'string') {
      throw new ValidationError('items.productId', 'productId is required');
    }

    if (!isValidUUID(orderItem.productId)) {
      throw new ValidationError('items.productId', 'Invalid productId format');
    }

    if (
      typeof orderItem.quantity !== 'number' ||
      orderItem.quantity <= 0 ||
      !Number.isInteger(orderItem.quantity)
    ) {
      throw new ValidationError(
        'items.quantity',
        'quantity must be a positive integer'
      );
    }
  }

  if (!input.shippingAddress || typeof input.shippingAddress !== 'string') {
    throw new ValidationError(
      'shippingAddress',
      'shippingAddress is required'
    );
  }

  if (!input.billingAddress || typeof input.billingAddress !== 'string') {
    throw new ValidationError('billingAddress', 'billingAddress is required');
  }

  return {
    items: input.items as Array<{ productId: string; quantity: number }>,
    shippingAddress: input.shippingAddress,
    billingAddress: input.billingAddress,
  };
}
