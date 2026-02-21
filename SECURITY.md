# Security Guide - Gold Rule

This document describes the security measures implemented in the project and how to keep them updated.

## 🔒 Implemented Security Measures

### 1. Authentication and Authorization

#### JWT (JSON Web Tokens)
- ✅ Tokens signed with HS256 algorithm
- ✅ Tokens stored in HttpOnly cookies (not accessible via JavaScript)
- ✅ Cookies with `Secure` flag in production
- ✅ Cookies with `SameSite=Lax` for CSRF protection
- ✅ Configurable token expiration (default: 2 hours)

#### Authentication Middleware
- ✅ Token verification on all protected routes
- ✅ Automatic redirect to login when not authenticated
- ✅ API route protection with 401 response

### 2. CSRF Protection (Cross-Site Request Forgery)

- ✅ Double Submit Cookie pattern implementation
- ✅ CSRF token generated per session
- ✅ Mandatory validation on POST, PUT, PATCH, DELETE methods
- ✅ `/api/csrf-token` endpoint to get token on frontend
- ✅ Constant-time comparison to prevent timing attacks

**How to use in frontend:**
```typescript
// Get CSRF token
const response = await fetch('/api/csrf-token');
const { csrfToken } = await response.json();

// Include in requests
fetch('/api/transactions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

### 3. Rate Limiting

- ✅ Rate limiting by IP for login (5 attempts / 15 minutes)
- ✅ Rate limiting by email for login (3 attempts / 15 minutes)
- ✅ Rate limiting by IP for registration (3 attempts / 15 minutes)
- ✅ Automatic cleanup of expired entries
- ✅ In-memory implementation (consider Redis for production)

**Configuration:**
- Login: 5 attempts per 15 minutes per IP
- Login by email: 3 attempts per 15 minutes
- Registration: 3 attempts per 15 minutes per IP

### 4. Input Validation

- ✅ Email format validation
- ✅ Password strength validation
- ✅ String sanitization to prevent XSS
- ✅ Transaction type validation
- ✅ Numeric value validation (amount)
- ✅ Date validation
- ✅ Size limits for all fields
- ✅ Content-Type validation on requests

**XSS Sanitization:**
- Removal of HTML tags (`<`, `>`)
- Removal of JavaScript protocols (`javascript:`)
- Removal of event handlers (`onclick=`, `onerror=`, etc.)
- Escape of special characters

### 5. HTTP Security Headers

Configured in `next.config.ts`:
- ✅ `Strict-Transport-Security` (HSTS)
- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Content-Security-Policy` (CSP)
- ✅ `Permissions-Policy`

### 6. CORS (Cross-Origin Resource Sharing)

- ✅ Explicit configuration of allowed origins
- ✅ Support for preflight requests (OPTIONS)
- ✅ Credentials headers configured
- ✅ Origin validation before allowing requests

**Configuration:**
Set `ALLOWED_ORIGINS` in `.env`:
```env
ALLOWED_ORIGINS=https://yoursite.com,https://www.yoursite.com
```

### 7. Password Protection

- ✅ Hash with bcrypt (10 rounds)
- ✅ Password strength validation
- ✅ Minimum of 6 characters
- ✅ Maximum of 128 characters
- ✅ Common password pattern verification

### 8. Protection Against Timing Attacks

- ✅ Constant-time comparison for CSRF tokens
- ✅ Password hash comparison with constant time
- ✅ Dummy hash comparison on login to prevent user enumeration

### 9. Secure Logging

- ✅ Automatic sanitization of sensitive data in logs
- ✅ Removal of passwords, tokens, and secrets from logs
- ✅ Stack traces only in development
- ✅ Sanitized context before logging

### 10. Resource Authorization

- ✅ Resource ownership verification (transactions, categories)
- ✅ Use of composite keys in Prisma (`id_userId`)
- ✅ Category belongs to user validation before use

## 🛡️ Best Practices

### Environment Variables

**Never commit:**
- `.env`
- `.env.local`
- Files with secrets

**Required variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing (minimum 32 characters)

**Optional variables:**
- `NODE_ENV` - Environment (development/production)
- `ALLOWED_ORIGINS` - Allowed origins for CORS (comma-separated)

### JWT_SECRET Generation

```bash
# Using OpenSSL
openssl rand -base64 32

# Or using the project script
npm run generate:jwt-secret
```

### Dependency Updates

Run regularly:
```bash
npm audit
npm audit fix
```

### Security Verification

```bash
# Check environment variables
npm run check:env

# Check system health
npm run check:health
```

## 🚨 Security Checklist for Deploy

- [ ] `JWT_SECRET` configured and secure (minimum 32 characters)
- [ ] `NODE_ENV=production` in production
- [ ] `ALLOWED_ORIGINS` configured correctly
- [ ] `Secure` cookies enabled (automatic in production)
- [ ] HTTPS enabled
- [ ] Rate limiting configured appropriately
- [ ] Logs do not expose sensitive information
- [ ] Dependencies updated (`npm audit`)
- [ ] Database with regular backups
- [ ] Firewall configured
- [ ] Active security monitoring

## 🔄 Recommended Future Improvements

### Short Term
1. **Refresh Tokens**: Implement refresh tokens to improve session management
2. **2FA (Two-Factor Authentication)**: Add two-factor authentication
3. **Audit Logging**: Log all critical user actions

### Medium Term
1. **Redis for Rate Limiting**: Migrate rate limiting to Redis to support multiple instances
2. **WAF (Web Application Firewall)**: Implement WAF for additional protection
3. **IP Whitelisting**: Allow IP whitelist for admin

### Long Term
1. **Penetration Testing**: Regular penetration tests
2. **Security Monitoring**: Security monitoring system
3. **Compliance**: Verify compliance with LGPD/GDPR

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

## 🐛 Reporting Vulnerabilities

If you find a security vulnerability, please:
1. **DO NOT** open a public issue
2. Contact the development team directly
3. Provide sufficient details to reproduce the problem
4. Wait for confirmation before public disclosure

