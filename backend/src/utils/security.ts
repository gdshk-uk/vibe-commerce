/**
 * Security utility functions
 * Implements additional security measures per MASTER_BLUEPRINT.md
 */

/**
 * Row Level Security (RLS) Helper
 * Ensures user can only access their own data
 */
export function enforceRLS(requestedUserId: string, authenticatedUserId: string) {
  if (requestedUserId !== authenticatedUserId) {
    throw new Error('Forbidden: Cannot access resources of other users');
  }
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate secure random session ID
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, use Cloudflare Workers KV or Durable Objects
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
