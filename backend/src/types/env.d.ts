/**
 * Environment types for Cloudflare Workers
 */

export interface Env {
  // D1 Database binding
  DB: D1Database;

  // Environment variables
  ENVIRONMENT: string;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  GEMINI_API_KEY?: string;
}
