# Phase 1: Infrastructure & Security - Setup Guide

This document provides step-by-step instructions for setting up and deploying the Vibe Commerce platform Phase 1 infrastructure.

## Overview

Phase 1 establishes the complete foundation for the Vibe Commerce platform:

- ✅ Cloudflare Workers API backend with Hono framework
- ✅ Cloudflare D1 database with Drizzle ORM
- ✅ Next.js 16 frontend optimized for Cloudflare Pages
- ✅ Clerk authentication with JWT verification
- ✅ Row Level Security (RLS) implementation
- ✅ CI/CD workflows for automated deployment

## Prerequisites

Before starting, ensure you have:

1. **Cloudflare Account** with Workers and Pages access
2. **Clerk Account** for authentication
3. **Node.js** 18+ and npm 9+ installed
4. **Git** for version control
5. **GitHub Account** (for CI/CD workflows)

## Database Setup

### 1. Cloudflare D1 Database

The D1 database ID is already configured: `f2b58f88-d1d8-4ca5-8685-c9c474cc49b2`

To verify the database connection:

```bash
cd backend
wrangler d1 info DB --name=vibe-commerce-db
```

### 2. Run Database Migration

Execute the initial migration to create all tables:

```bash
cd backend

# For local development
npm run db:migrate:local

# For production
npm run db:migrate
```

This creates the following tables:
- `users` - User profiles linked to Clerk
- `products` - Product catalog with vector embeddings
- `orders` - User orders with RLS protection
- `order_items` - Order line items
- `ai_interaction_logs` - AI agent interaction tracking

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create `.dev.vars` file for local development:

```bash
cp .dev.vars.example .dev.vars
```

Update with your credentials:

```env
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_D1_TOKEN=your_d1_token
```

### 3. Test Locally

```bash
npm run dev
```

The API will be available at `http://localhost:8787`

Test endpoints:
- `GET /health` - Health check
- `GET /api/products` - List products (requires auth)
- `GET /api/orders` - List user orders (requires auth, RLS enforced)

### 4. Deploy to Production

```bash
npm run deploy
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Update with your credentials:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_API_URL=http://localhost:8787
```

For production:

```env
NEXT_PUBLIC_API_URL=https://api.vibe-commerce.com
```

### 3. Test Locally

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

### 5. Deploy to Cloudflare Pages

**Important:** Configure Cloudflare Pages build settings correctly:

In your Cloudflare Pages project settings:

**Build Configuration:**
- **Framework preset**: Next.js
- **Build command**: `cd frontend && npm install && npm run build`
- **Build output directory**: `frontend/.next`
- **Root directory**: `/` (keep default)

**Environment Variables:**
Add these in Cloudflare Pages → Settings → Environment variables:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

**Alternative: Use GitHub Actions** (recommended)
The workflow in `.github/workflows/deploy-frontend.yml` handles deployment automatically when you push to main.

## Clerk Authentication Setup

### 1. Create Clerk Application

1. Go to [clerk.com](https://clerk.com)
2. Create a new application
3. Choose "Next.js" as the framework
4. Copy your API keys

### 2. Configure Clerk Settings

In your Clerk Dashboard:

**Paths:**
- Sign-in URL: `/sign-in`
- Sign-up URL: `/sign-up`
- After sign-in: `/dashboard`
- After sign-up: `/dashboard`

**Enable authentication methods:**
- Email/Password
- Google OAuth (optional)
- GitHub OAuth (optional)

### 3. Configure Webhook (Optional)

For syncing user data to your database:

1. In Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-worker.workers.dev/api/webhook/clerk`
3. Subscribe to: `user.created`, `user.updated`

## CI/CD Setup

### 1. GitHub Secrets

Add the following secrets to your GitHub repository:

```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_API_URL
```

### 2. Workflows

Three workflows are configured:

1. **CI Workflow** - Runs on all PRs and pushes
   - Type checking
   - Linting
   - Build verification

2. **Deploy Frontend** - Deploys to Cloudflare Pages
   - Triggered on main branch changes to `frontend/`

3. **Deploy Backend** - Deploys to Cloudflare Workers
   - Triggered on main branch changes to `backend/`

## Testing the Setup

### 1. Test Authentication Flow

1. Navigate to `http://localhost:3000`
2. Click "Get Started" → Create account
3. Complete Clerk signup
4. Verify redirect to `/dashboard`

### 2. Test API Endpoints

```bash
# Get Clerk token (from browser DevTools → Application → Clerk)
export TOKEN="your_clerk_jwt_token"

# Test authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8787/api/users/me

# Test products endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8787/api/products
```

### 3. Test Row Level Security

Create two users and verify:
- User A can only see their own orders
- User A cannot access User B's orders
- API returns 403 Forbidden for unauthorized access

## Architecture Overview

```
┌─────────────────────┐
│   Cloudflare Pages  │
│    (Next.js 16)     │
└──────────┬──────────┘
           │
           │ HTTPS + JWT
           │
┌──────────▼──────────┐
│ Cloudflare Workers  │
│   (Hono + Clerk)    │
└──────────┬──────────┘
           │
           │ Drizzle ORM
           │
┌──────────▼──────────┐
│   Cloudflare D1     │
│   (SQLite + RLS)    │
└─────────────────────┘
```

## Security Checklist

- ✅ Clerk JWT verification on all protected routes
- ✅ Row Level Security (RLS) enforced in API layer
- ✅ CORS configured with allowed origins
- ✅ Security headers configured
- ✅ HTTPS enforced
- ✅ Environment variables secured
- ✅ No secrets in source code
- ✅ Rate limiting implemented

## Monitoring and Debugging

### Cloudflare Workers Logs

```bash
wrangler tail
```

### Database Queries

```bash
wrangler d1 execute vibe-commerce-db --command="SELECT * FROM users LIMIT 5"
```

### Next.js Development Logs

Check the terminal where `npm run dev` is running.

## Next Steps

With Phase 1 complete, you can proceed to:

**Phase 2:** Frontend development and basic e-commerce features
- Product listing pages
- Shopping cart functionality
- Checkout flow
- User profile management

**Phase 3:** AI integration with Gemini
- Semantic product search
- Personalized recommendations
- AI shopping assistant

## Troubleshooting

### Common Issues

**1. Database migration fails**
- Verify D1 database ID in `wrangler.toml`
- Check Cloudflare API token permissions

**2. Clerk authentication not working**
- Verify environment variables are set
- Check Clerk dashboard URLs match your setup
- Ensure middleware.ts is in the root directory

**3. CORS errors**
- Update allowed origins in `backend/src/middleware/cors.ts`
- Verify API_URL in frontend environment

**4. Type errors**
- Run `npm install` in both frontend and backend
- Clear `.next` and rebuild

## Support

For issues or questions:
- Check the MASTER_BLUEPRINT.md for architecture details
- Review SECURITY_PROTOCOLS.md for security implementation
- Consult Cloudflare Workers documentation
- Refer to Next.js 16 documentation
- Check Clerk documentation for authentication issues
