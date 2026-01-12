/**
 * Users API Routes
 * Handles user profile operations
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { Env } from '../types/env';
import { createDrizzleClient } from '../db/client';
import { users } from '../db/schema';
import { clerkAuth, requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { validateCreateUser } from '../utils/validation';
import { enforceRLS } from '../utils/security';

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /api/users/me
 * Get current user profile
 */
app.get('/me', clerkAuth, async (c) => {
  const auth = requireAuth(c);
  const db = createDrizzleClient(c.env.DB);

  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, auth.clerkId))
    .get();

  if (!user) {
    throw new AppError('NOT_FOUND', 'User profile not found');
  }

  return c.json({
    success: true,
    data: user,
  });
});

/**
 * GET /api/users/:id
 * Get user by ID (admin only or own profile)
 */
app.get('/:id', clerkAuth, async (c) => {
  const auth = requireAuth(c);
  const userId = c.req.param('id');
  const db = createDrizzleClient(c.env.DB);

  const user = await db.select().from(users).where(eq(users.id, userId)).get();

  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  // Enforce RLS: users can only view their own profile
  enforceRLS(user.clerkId, auth.clerkId);

  return c.json({
    success: true,
    data: user,
  });
});

/**
 * POST /api/users
 * Create new user profile (typically called after Clerk signup)
 */
app.post('/', clerkAuth, async (c) => {
  const auth = requireAuth(c);
  const body = await c.req.json();
  const validatedData = validateCreateUser(body);
  const db = createDrizzleClient(c.env.DB);

  // Ensure user is creating their own profile
  enforceRLS(validatedData.clerkId, auth.clerkId);

  // Check if user already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, validatedData.clerkId))
    .get();

  if (existing) {
    throw new AppError('CONFLICT', 'User profile already exists');
  }

  const newUser = await db
    .insert(users)
    .values({
      clerkId: validatedData.clerkId,
      email: validatedData.email,
      displayName: validatedData.displayName || null,
      profileImageUrl: validatedData.profileImageUrl || null,
    })
    .returning()
    .get();

  return c.json(
    {
      success: true,
      data: newUser,
    },
    201
  );
});

/**
 * PUT /api/users/:id
 * Update user profile
 */
app.put('/:id', clerkAuth, async (c) => {
  const auth = requireAuth(c);
  const userId = c.req.param('id');
  const body = await c.req.json();
  const db = createDrizzleClient(c.env.DB);

  // Get existing user
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!existingUser) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  // Enforce RLS
  enforceRLS(existingUser.clerkId, auth.clerkId);

  // Update user
  const updatedUser = await db
    .update(users)
    .set({
      displayName: body.displayName || existingUser.displayName,
      profileImageUrl: body.profileImageUrl || existingUser.profileImageUrl,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId))
    .returning()
    .get();

  return c.json({
    success: true,
    data: updatedUser,
  });
});

export default app;
