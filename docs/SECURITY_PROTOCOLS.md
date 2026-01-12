# Security Protocols - Vibe Commerce Platform

This document details the security implementation for the Vibe Commerce platform, aligned with the security requirements outlined in MASTER_BLUEPRINT.md.

## Security Architecture Overview

The platform implements a multi-layered security approach:

1. **Edge-level Authentication** - Clerk JWT verification at Workers layer
2. **Application-level Authorization** - Row Level Security (RLS) enforcement
3. **Data Protection** - Encrypted communications and secure data storage
4. **Rate Limiting** - Protection against abuse
5. **Security Headers** - Defense-in-depth HTTP security

## 1. Clerk Authentication & Edge Verification

### Implementation

Location: `backend/src/middleware/auth.ts`

#### JWT Verification Process

Every protected API request undergoes the following verification:

```typescript
1. Extract JWT from Authorization header
2. Verify JWT signature using Clerk's public key
3. Verify expiration time (exp claim)
4. Verify issuer (iss claim)
5. Verify audience (aud claim)
6. Extract user ID (sub claim) for RLS
```

#### Code Flow

```typescript
// 1. Middleware extracts token
const token = request.headers.get('Authorization')?.replace('Bearer ', '');

// 2. Verify using Clerk SDK
const payload = await verifyToken(token, {
  secretKey: env.CLERK_SECRET_KEY
});

// 3. Extract user context for RLS
const authContext = {
  userId: payload.sub,
  clerkId: payload.sub,
  email: payload.email
};

// 4. Store in request context for route handlers
context.set('auth', authContext);
```

### Security Guarantees

✅ **Token Tampering Prevention** - Cryptographic signature verification
✅ **Replay Attack Protection** - Expiration time enforcement
✅ **Man-in-the-Middle Protection** - HTTPS-only communications
✅ **Token Revocation** - Clerk handles token invalidation

### Protected Routes

All routes under `/api/*` require authentication except:
- `/health` - Health check endpoint
- `GET /api/products` - Public product listing (optional auth)

## 2. Row Level Security (RLS)

### Implementation

Location: `backend/src/utils/security.ts`, enforced in route handlers

### RLS Enforcement Strategy

Since Cloudflare D1 doesn't natively support PostgreSQL-style RLS, we implement RLS at the application layer:

#### Pattern 1: User-Owned Resources

```typescript
// Fetch user's internal ID from clerk ID
const user = await db
  .select()
  .from(users)
  .where(eq(users.clerkId, auth.clerkId))
  .get();

// Query only user's own data
const orders = await db
  .select()
  .from(orders)
  .where(eq(orders.userId, user.id))  // RLS enforcement
  .all();
```

#### Pattern 2: Explicit Access Control

```typescript
// Get resource
const order = await db
  .select()
  .from(orders)
  .where(eq(orders.id, orderId))
  .get();

// Verify ownership
enforceRLS(order.userId, user.id);  // Throws if mismatch
```

### RLS Coverage

| Table | RLS Rule | Enforcement |
|-------|----------|-------------|
| `users` | User can only access own profile | ✅ Application layer |
| `orders` | User can only access own orders | ✅ Application layer |
| `order_items` | User can only access items from own orders | ✅ Via orders table |
| `ai_interaction_logs` | User can only access own logs | ✅ Application layer |
| `products` | Public read access | N/A |

### RLS Helper Function

```typescript
export function enforceRLS(
  requestedUserId: string,
  authenticatedUserId: string
) {
  if (requestedUserId !== authenticatedUserId) {
    throw new Error('Forbidden: Cannot access resources of other users');
  }
}
```

## 3. Data Protection

### In Transit

- ✅ **HTTPS Enforced** - All communications encrypted with TLS 1.3
- ✅ **HSTS Header** - Strict-Transport-Security prevents downgrade attacks
- ✅ **Certificate Validation** - Cloudflare-managed certificates

### At Rest

- ✅ **D1 Encryption** - Cloudflare encrypts data at rest
- ✅ **No Plaintext Secrets** - Environment variables for sensitive data
- ✅ **Secure Password Handling** - Clerk manages password hashing (Argon2)

### Sensitive Data Handling

**Never stored in database:**
- Credit card numbers (use payment provider tokenization)
- Raw passwords (Clerk handles authentication)
- API keys or secrets

**Encrypted in transit:**
- JWT tokens
- User PII (email, names, addresses)
- Order information

## 4. Input Validation & Sanitization

Location: `backend/src/utils/validation.ts`

### Validation Strategy

All user input is validated before processing:

```typescript
// Example: Order creation validation
export function validateCreateOrder(data: unknown) {
  // Type checking
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('body', 'Invalid request format');
  }

  // Required fields
  if (!input.items || !Array.isArray(input.items)) {
    throw new ValidationError('items', 'Items array required');
  }

  // UUID validation
  if (!isValidUUID(item.productId)) {
    throw new ValidationError('productId', 'Invalid product ID');
  }

  // Range validation
  if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
    throw new ValidationError('quantity', 'Must be positive integer');
  }
}
```

### Sanitization

```typescript
// Remove potential XSS vectors
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>'"]/g, '')
    .substring(0, 1000);  // Length limit
}
```

## 5. CORS Configuration

Location: `backend/src/middleware/cors.ts`

### Allowed Origins

```typescript
const allowedOrigins = [
  'https://vibe-commerce.com',
  'https://www.vibe-commerce.com',
  // Development
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Cloudflare Pages preview
  '*.pages.dev'
];
```

### CORS Headers

```typescript
'Access-Control-Allow-Origin': verifiedOrigin
'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
'Access-Control-Allow-Headers': 'Content-Type, Authorization'
'Access-Control-Max-Age': '86400'
'Access-Control-Allow-Credentials': 'true'
```

## 6. Security Headers

Location: `frontend/next.config.ts` and `backend/src/middleware/cors.ts`

### Response Headers

```typescript
'X-Content-Type-Options': 'nosniff'
'X-Frame-Options': 'DENY'
'X-XSS-Protection': '1; mode=block'
'Referrer-Policy': 'strict-origin-when-cross-origin'
'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
```

### Protection Against

- ✅ **XSS** - Content-Type enforcement, sanitization
- ✅ **Clickjacking** - X-Frame-Options: DENY
- ✅ **MIME Sniffing** - X-Content-Type-Options: nosniff
- ✅ **Information Leakage** - Referrer-Policy control

## 7. Rate Limiting

Location: `backend/src/utils/security.ts`

### Implementation

```typescript
export function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 60000
): boolean {
  // Simple in-memory rate limiting
  // Production: Use Cloudflare Workers KV or Durable Objects
}
```

### Rate Limits

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| Authentication endpoints | 10 requests | 1 minute |
| General API | 100 requests | 1 minute |
| Public product listing | 200 requests | 1 minute |

## 8. Error Handling

Location: `backend/src/middleware/error-handler.ts`

### Security Considerations

```typescript
// Production: Hide stack traces
return c.json({
  success: false,
  error: {
    code: 'INTERNAL_ERROR',
    message: env.ENVIRONMENT === 'production'
      ? 'An internal error occurred'
      : err.message  // Detailed in development
  }
}, 500);
```

### Error Logging

- ✅ Errors logged to Cloudflare Workers logs
- ✅ No sensitive data in error messages
- ✅ Stack traces hidden in production

## 9. Database Security

### Connection Security

- ✅ **Cloudflare D1 Bindings** - No connection strings exposed
- ✅ **Automatic Connection Pooling** - Managed by Cloudflare
- ✅ **Query Parameterization** - Drizzle ORM prevents SQL injection

### SQL Injection Prevention

Drizzle ORM automatically parameterizes all queries:

```typescript
// Safe - parameterized query
await db.select()
  .from(products)
  .where(eq(products.id, productId));  // ✅ Safe

// Never do this:
await db.execute(`SELECT * FROM products WHERE id = '${id}'`);  // ❌ Unsafe
```

## 10. Secrets Management

### Environment Variables

**Backend (.dev.vars)**
```env
CLERK_SECRET_KEY=sk_***  # Never commit to git
CLERK_PUBLISHABLE_KEY=pk_***
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_***  # Public, safe to expose
CLERK_SECRET_KEY=sk_***  # Server-side only
```

### Cloudflare Workers Secrets

```bash
# Production secrets via Wrangler
wrangler secret put CLERK_SECRET_KEY
wrangler secret put GEMINI_API_KEY
```

### GitHub Actions Secrets

All sensitive values stored as GitHub Secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLERK_SECRET_KEY`
- Never in workflow files

## Security Checklist

### Phase 1 Security Compliance

- ✅ Clerk JWT verification on all protected endpoints
- ✅ Row Level Security (RLS) enforced for user data
- ✅ HTTPS enforced (Cloudflare manages certificates)
- ✅ CORS configured with whitelisted origins
- ✅ Security headers implemented
- ✅ Input validation and sanitization
- ✅ SQL injection prevention via ORM
- ✅ XSS prevention
- ✅ CSRF protection (via SameSite cookies)
- ✅ Rate limiting implemented
- ✅ Secrets management (no hardcoded secrets)
- ✅ Error messages don't leak sensitive data

### Future Enhancements (Phase 2+)

- ⏳ Content Security Policy (CSP)
- ⏳ Subresource Integrity (SRI)
- ⏳ Advanced rate limiting with Durable Objects
- ⏳ Audit logging
- ⏳ Intrusion detection
- ⏳ DDoS protection (Cloudflare provides baseline)

## Incident Response

### Security Issue Protocol

1. **Identify** - Log and categorize security event
2. **Contain** - Disable affected endpoints if necessary
3. **Investigate** - Review logs and determine impact
4. **Remediate** - Deploy fix via CI/CD
5. **Verify** - Test fix in staging
6. **Document** - Record incident and resolution

### Monitoring

- Cloudflare Workers logs
- Clerk authentication logs
- API error rates and patterns
- Unusual access patterns

## Compliance

### Data Protection

- **GDPR Considerations** - User data deletion via Clerk
- **Data Residency** - Cloudflare global edge network
- **User Privacy** - Minimal data collection

### Best Practices

- OWASP Top 10 mitigation
- Least privilege access
- Defense in depth
- Regular security updates

## Contact

For security concerns or to report vulnerabilities:
- **Email**: security@vibe-commerce.com (example)
- **Responsible Disclosure**: Follow coordinated disclosure practices
