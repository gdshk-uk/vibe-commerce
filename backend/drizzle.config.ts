import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: 'f2b58f88-d1d8-4ca5-8685-c9c474cc49b2',
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
} satisfies Config;
