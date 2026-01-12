/**
 * Role-Based Access Control (RBAC) Middleware
 * Implements admin authorization using Clerk publicMetadata
 */

import { verifyToken } from '@clerk/backend';
import { Context, Next } from 'hono';
import { Env } from '../types/env';
import { AuthContext } from './auth';

/**
 * Admin-only middleware
 * Verifies JWT and checks that user has admin role in publicMetadata
 */
export async function isAdmin(c: Context<{ Bindings: Env }>, next: Next) {
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

  const token = authHeader.substring(7);

  try {
    // Verify JWT using Clerk
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

    // Check for admin role in publicMetadata
    const publicMetadata = (payload as any).publicMetadata || {};
    const userRole = publicMetadata.role;

    if (userRole !== 'admin') {
      return c.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        },
        403
      );
    }

    // Store auth context
    const authContext: AuthContext = {
      userId: payload.sub,
      clerkId: payload.sub,
      sessionId: payload.sid as string | undefined,
      email: (payload.email as string) || undefined,
    };

    c.set('auth', authContext);

    await next();
  } catch (error) {
    console.error('Admin auth failed:', error);

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
