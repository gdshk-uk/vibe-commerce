/**
 * Drizzle ORM Client Configuration for Cloudflare D1
 */

import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Create and configure Drizzle ORM client for D1 database
 * @param db - D1Database instance from Cloudflare Workers env
 * @returns Configured Drizzle client
 */
export function createDrizzleClient(db: D1Database) {
  return drizzle(db, { schema });
}

// Export schema for use in queries
export { schema };
