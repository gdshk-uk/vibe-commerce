/**
 * Clerk authentication types
 */

export interface ClerkUser {
  id: string;
  email_addresses: Array<{
    email_address: string;
    id: string;
  }>;
  first_name?: string;
  last_name?: string;
  image_url?: string;
}

export interface ClerkJWTPayload {
  sub: string; // Clerk user ID
  email?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface AuthContext {
  userId: string;
  clerkId: string;
  email?: string;
}
