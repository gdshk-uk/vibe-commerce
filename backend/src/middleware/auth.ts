/**
 * Clerk Authentication Middleware for Cloudflare Workers
 * Implements JWT verification according to security protocols in MASTER_BLUEPRINT.md
 */

import { verifyToken } from '@clerk/backend';
import { Context, Next } from 'hono';
import { Env } from '../types/env';

/**
 * Extended context with authenticated user information
 */
export interface AuthContext {
  userId: string;
  clerkId: string;
  sessionId?: string;
  email?: string;
}

/**
 * Clerk JWT verification middleware
 * Verifies signature, expiration, issuer, and audience
 * Extracts user ID for Row Level Security (RLS)
 */
export async function clerkAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      },
      401
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Verify JWT using Clerk's official verification
    // This checks:
    // - Signature verification using Clerk's public key
    // - Expiration time (exp)
    // - Issuer (iss)
    // - Audience (aud)
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });

    if (!payload || !payload.sub) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid token payload',
          },
        },
        401
      );
    }

    // Extract user information for RLS and authorization
    const authContext: AuthContext = {
      userId: payload.sub, // Clerk user ID
      clerkId: payload.sub,
      sessionId: payload.sid as string | undefined,
      email: (payload.email as string) || undefined,
    };

    // Store auth context in Hono context for use in route handlers
    c.set('auth', authContext);

    await next();
  } catch (error) {
    console.error('Token verification failed:', error);

    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message:
            error instanceof Error ? error.message : 'Token verification failed',
        },
      },
      401
    );
  }
}

/**
 * Optional authentication middleware
 * Attempts to authenticate but continues if no token is provided
 * Useful for endpoints that have different behavior for authenticated users
 */
export async function optionalAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without auth context
    await next();
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });

    if (payload && payload.sub) {
      const authContext: AuthContext = {
        userId: payload.sub,
        clerkId: payload.sub,
        sessionId: payload.sid as string | undefined,
        email: (payload.email as string) || undefined,
      };

      c.set('auth', authContext);
    }
  } catch (error) {
    // Token invalid but optional, continue without auth
    console.warn('Optional auth failed:', error);
  }

  await next();
}

/**
 * Helper to get authenticated user from context
 */
export function getAuthUser(c: Context): AuthContext | undefined {
  return c.get('auth');
}

/**
 * Helper to require authenticated user
 * Throws if user is not authenticated
 */
export function requireAuth(c: Context): AuthContext {
  const auth = c.get('auth') as AuthContext | undefined;

  if (!auth) {
    throw new Error('Authentication required');
  }

  return auth;
}
