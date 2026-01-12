/**
 * User entity types for Vibe Commerce platform
 * Linked to Clerk authentication system
 */

export interface User {
  id: string;
  clerkId: string;
  email: string;
  displayName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  clerkId: string;
  email: string;
  displayName?: string;
  profileImageUrl?: string;
}

export interface UpdateUserInput {
  displayName?: string;
  profileImageUrl?: string;
}

export type UserResponse = User;
