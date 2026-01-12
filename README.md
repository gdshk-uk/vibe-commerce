# Vibe Commerce

> A high-end, agentic e-commerce platform showcasing Vibe Coding excellence

An edge-optimized, AI-powered e-commerce platform built on Cloudflare's global network with Next.js 16, Clerk authentication, and Gemini AI integration.

[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)

## 🌟 Features

- ⚡ **Zero Cold Starts** - Edge-first architecture with Cloudflare Workers & Pages
- 🔐 **Enterprise Security** - Clerk authentication with JWT verification and Row Level Security
- 🤖 **AI-Powered** - Gemini-driven semantic search and personalized recommendations
- 📊 **Edge Database** - Cloudflare D1 for low-latency global data access
- 🚀 **Performance** - React 19 with Compiler, optimized for Cloudflare Pages
- 🛡️ **Type Safe** - Full TypeScript coverage across frontend and backend

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- Cloudflare account with Workers & Pages access
- Clerk account for authentication
- Git for version control

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd vibe-commerce

# Install all dependencies
npm install

# Install workspace dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

**Backend** (`backend/.dev.vars`):
```bash
cd backend
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your Clerk credentials
```

**Frontend** (`frontend/.env.local`):
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your Clerk and API URLs
```

### 3. Run Database Migration

```bash
cd backend
npm run db:migrate:local
```

This creates all required tables in your D1 database.

### 4. Start Development Servers

```bash
# Terminal 1 - Backend API
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit **http://localhost:3000** to see the application.

## 📁 Project Structure

```
vibe-commerce/
├── backend/                      # Cloudflare Workers API
│   ├── src/
│   │   ├── db/                   # Drizzle ORM schemas & migrations
│   │   ├── middleware/           # Auth, CORS, error handling
│   │   ├── routes/               # API route handlers
│   │   ├── utils/                # Security & validation utilities
│   │   └── index.ts              # Worker entry point
│   ├── wrangler.toml             # Cloudflare Workers config
│   └── package.json
│
├── frontend/                     # Next.js 16 Application
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── (auth)/           # Auth pages (sign-in/up)
│   │   │   ├── (dashboard)/      # Protected dashboard
│   │   │   ├── layout.tsx        # Root layout with ClerkProvider
│   │   │   └── page.tsx          # Landing page
│   │   └── lib/                  # Utilities & API client
│   ├── middleware.ts             # Clerk route protection
│   ├── next.config.ts            # Cloudflare Pages optimized
│   └── package.json
│
├── shared/                       # Shared types & constants
│   ├── types/                    # TypeScript interfaces
│   └── constants/                # API routes & error codes
│
├── docs/                         # Documentation
│   ├── MASTER_BLUEPRINT.md       # Architecture & design
│   ├── PHASE_1_SETUP.md          # Setup instructions
│   └── SECURITY_PROTOCOLS.md     # Security implementation
│
└── .github/
    └── workflows/                # CI/CD pipelines
```

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│      Cloudflare Global Network      │
│  (300+ Cities, Zero Cold Starts)    │
└───────────┬─────────────────────────┘
            │
   ┌────────┴────────┐
   │                 │
┌──▼──────────┐  ┌──▼─────────────┐
│ Pages (SSG) │  │ Workers (API)   │
│ Next.js 16  │  │ Hono Framework  │
│ React 19    │  │ Clerk JWT Auth  │
└─────────────┘  └────────┬────────┘
                          │
                 ┌────────▼────────┐
                 │ D1 Database     │
                 │ Drizzle ORM     │
                 │ Row Level       │
                 │ Security (RLS)  │
                 └─────────────────┘
```

## 📚 Development Roadmap

### ✅ Phase 1: Infrastructure & Security (COMPLETED)

- [x] Next.js 16 with App Router & React 19
- [x] Cloudflare Workers with Hono framework
- [x] Cloudflare D1 database setup (ID: `f2b58f88-d1d8-4ca5-8685-c9c474cc49b2`)
- [x] Drizzle ORM integration
- [x] Clerk authentication with JWT verification
- [x] Row Level Security (RLS) implementation
- [x] API routes: users, products, orders
- [x] Frontend: auth pages, dashboard, landing
- [x] CI/CD workflows for automated deployment
- [x] Comprehensive documentation

### 📅 Phase 2: E-Commerce Features (NEXT)

- [ ] Product listing and detail pages
- [ ] Shopping cart functionality
- [ ] Checkout flow with order creation
- [ ] User profile management
- [ ] Order history and tracking

### 🤖 Phase 3: AI Integration

- [ ] Gemini API integration
- [ ] Vector embeddings for products
- [ ] Semantic search implementation
- [ ] Personalized recommendations
- [ ] AI interaction logging

### 🎯 Phase 4: Optimization & Production

- [ ] Performance optimization
- [ ] Comprehensive test coverage
- [ ] Production deployment
- [ ] Monitoring and observability

## 🔒 Security

This platform implements enterprise-grade security:

- **Clerk JWT Verification** - All protected endpoints verify JWT tokens
- **Row Level Security (RLS)** - Users can only access their own data
- **HTTPS Enforced** - All communications encrypted with TLS 1.3
- **CORS Protection** - Whitelisted origins only
- **Input Validation** - All user input sanitized and validated
- **Security Headers** - CSP, HSTS, X-Frame-Options, etc.
- **No Secrets in Code** - Environment variables and Cloudflare Secrets

See [SECURITY_PROTOCOLS.md](docs/SECURITY_PROTOCOLS.md) for detailed security implementation.

## 🧪 API Reference

All API endpoints (except `/health`) require Clerk JWT authentication via `Authorization: Bearer <token>` header.

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| GET | `/api/users/me` | Get current user profile | Yes |
| POST | `/api/users` | Create user profile | Yes |
| GET | `/api/products` | List products | Optional |
| GET | `/api/products/:id` | Get product details | Optional |
| POST | `/api/products` | Create product (admin) | Yes |
| GET | `/api/orders` | List user orders (RLS) | Yes |
| GET | `/api/orders/:id` | Get order details (RLS) | Yes |
| POST | `/api/orders` | Create new order | Yes |

See [PHASE_1_SETUP.md](docs/PHASE_1_SETUP.md) for detailed API documentation.

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19 with React Compiler
- **Styling**: Tailwind CSS 4
- **Authentication**: Clerk
- **Language**: TypeScript 5.6
- **Deployment**: Cloudflare Pages

### Backend
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **ORM**: Drizzle ORM
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: Clerk (JWT verification)
- **Language**: TypeScript 5.6

### AI (Phase 3)
- **Model**: Google Gemini
- **Use Cases**: Semantic search, recommendations

## 📖 Documentation

- **[MASTER_BLUEPRINT.md](docs/MASTER_BLUEPRINT.md)** - Complete system architecture and design
- **[PHASE_1_SETUP.md](docs/PHASE_1_SETUP.md)** - Step-by-step setup and deployment guide
- **[SECURITY_PROTOCOLS.md](docs/SECURITY_PROTOCOLS.md)** - Detailed security implementation

## 🚢 Deployment

### Automated (GitHub Actions)

Push to `main` branch triggers automatic deployment:
- Frontend → Cloudflare Pages
- Backend → Cloudflare Workers

### Manual Deployment

**Backend:**
```bash
cd backend
npm run deploy
```

**Frontend:**
```bash
cd frontend
npm run build
npm run deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Ensure all checks pass:
- TypeScript type checking
- ESLint linting
- Build succeeds

## 📄 License

UNLICENSED - For demonstration purposes by Vibe Coding

## 👥 Authors

**Vibe Coding Team**

## 🙏 Acknowledgments

- Powered by [Cloudflare](https://cloudflare.com)
- Authentication by [Clerk](https://clerk.com)
- AI by [Google Gemini](https://ai.google.dev)
- Built with [Next.js](https://nextjs.org)
