# 🔐 Environment Configuration Guide

This guide explains how to configure environment variables for the Sportification Backend application.

## 📋 Table of Contents

- [Environment Files](#environment-files)
- [Priority and Loading](#priority-and-loading)
- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Environment-Specific Configuration](#environment-specific-configuration)
- [Security Best Practices](#security-best-practices)
- [Validation](#validation)
- [Troubleshooting](#troubleshooting)

---

## 🗂️ Environment Files

The application supports multiple environment files:

```
.env.development    # Development environment (committed to repo)
.env.test          # Test/CI environment (committed to repo)
.env.production    # Production template (committed to repo)
.env.example       # Documentation reference (committed to repo)

.env               # Local overrides (NOT committed - add to .gitignore)
.env.*.local       # Local overrides per environment (NOT committed)
```

### File Purposes

| File | Purpose | Committed? | Usage |
|------|---------|-----------|-------|
| `.env.development` | Development defaults | ✅ Yes | Local development |
| `.env.test` | Test configuration | ✅ Yes | CI/CD, local testing |
| `.env.production` | Production template | ✅ Yes | Production deployment guide |
| `.env.example` | Documentation | ✅ Yes | Reference for all variables |
| `.env` | Local overrides | ❌ No | Personal local settings |
| `.env.*.local` | Environment-specific local | ❌ No | Override per environment |

---

## 🔄 Priority and Loading

The application loads environment variables in this priority order:

1. **`.env.{NODE_ENV}.local`** - Highest priority (your local overrides)
2. **`.env.{NODE_ENV}`** - Environment-specific defaults
3. **`.env`** - General fallback
4. **Process environment** - System environment variables

### Example

```bash
# If NODE_ENV=development, the app will load (in order):
# 1. .env.development.local (if exists)
# 2. .env.development
# 3. .env (if exists)
```

### Setting NODE_ENV

```bash
# Linux/macOS
export NODE_ENV=development
npm run dev

# Windows PowerShell
$env:NODE_ENV="development"
npm run dev

# Using npm scripts (recommended)
npm run dev           # Automatically sets NODE_ENV=development
npm test              # Automatically sets NODE_ENV=test
npm run start:prod    # Automatically sets NODE_ENV=production
```

---

## ✅ Required Variables

These variables **must** be set for the application to start:

### Core Configuration

```bash
NODE_ENV=development              # Environment: development, test, production
MONGODB_URI=mongodb://...         # MongoDB connection string
JWT_SECRET=<min-32-chars>         # JWT signing secret (min 32 characters)
JWT_REFRESH_SECRET=<min-32-chars> # JWT refresh token secret (min 32 characters)
```

### Generating Secrets

Use these commands to generate secure secrets:

```bash
# Generate JWT secrets (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate JWT secrets (OpenSSL)
openssl rand -base64 32

# Generate JWT secrets (Python)
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🔧 Optional Variables

### Application

```bash
APP_NAME="Sports Companion API"   # Application name
APP_VERSION="1.0.0"                # Application version
PORT=3000                          # Server port (default: 3000)
API_PREFIX="/api/v1"               # API route prefix
FRONTEND_URL="http://localhost:3000" # Frontend URL for CORS
```

### Database

```bash
MONGODB_MAX_POOL_SIZE=10           # Max connection pool size
MONGODB_MIN_POOL_SIZE=2            # Min connection pool size
MONGODB_SOCKET_TIMEOUT=45000       # Socket timeout (ms)
MONGODB_SERVER_SELECTION_TIMEOUT=5000 # Server selection timeout (ms)
MONGODB_HEARTBEAT_FREQUENCY=10000  # Heartbeat frequency (ms)
```

### JWT

```bash
JWT_EXPIRES_IN="7d"                # Access token expiration
JWT_REFRESH_EXPIRES_IN="30d"       # Refresh token expiration
JWT_ALGORITHM="HS256"              # JWT algorithm
```

### CORS

```bash
CORS_ORIGIN="http://localhost:3000,http://localhost:5173" # Allowed origins (comma-separated)
CORS_CREDENTIALS=true              # Allow credentials
```

### Redis

```bash
REDIS_URL="redis://localhost:6379" # Redis connection URL
REDIS_MAX_RETRIES=3                # Max retry attempts
REDIS_ENABLE_READY_CHECK=true      # Enable ready check
```

### Session

```bash
SESSION_SECRET=<min-32-chars>      # Session signing secret
SESSION_COOKIE_NAME="sportification.sid" # Session cookie name
SESSION_TTL=3600                   # Session TTL (seconds)
SESSION_REDIS_PREFIX="session:"    # Redis key prefix
SESSION_COOKIE_SECURE=true         # Secure cookie (HTTPS only)
COOKIE_DOMAIN=".example.com"       # Cookie domain
```

### Rate Limiting

```bash
RATE_LIMIT_WINDOW_MS=900000        # Rate limit window (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100        # Max requests per window
RATE_LIMIT_SKIP_SUCCESSFUL=false   # Skip successful requests
RATE_LIMIT_SKIP_FAILED=false       # Skip failed requests
```

### Email

```bash
EMAIL_SERVICE="gmail"              # Email service provider
EMAIL_HOST="smtp.gmail.com"        # SMTP host
EMAIL_PORT=587                     # SMTP port
EMAIL_SECURE=false                 # Use TLS
EMAIL_USER="your-email@gmail.com"  # Email username
EMAIL_PASS="your-app-password"     # Email password/app password
EMAIL_FROM="noreply@sportification.com" # Default from address
```

### OAuth

```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="/api/v1/auth/google/callback"

# GitHub OAuth
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
GITHUB_CALLBACK_URL="/api/v1/auth/github/callback"

# Facebook OAuth
FACEBOOK_CLIENT_ID="your-app-id"
FACEBOOK_CLIENT_SECRET="your-app-secret"
FACEBOOK_CALLBACK_URL="/api/v1/auth/facebook/callback"
```

### Security

```bash
BCRYPT_ROUNDS=12                   # Bcrypt hashing rounds (10-15)
SECURITY_ENABLE_CSRF=false         # Enable CSRF protection
SECURITY_ENABLE_RATE_LIMITING=true # Enable rate limiting
SECURITY_ENABLE_HELMET=true        # Enable Helmet security headers
```

### Logging

```bash
LOG_LEVEL="info"                   # Log level: error, warn, info, debug
LOG_FILE_PATH="logs/app.log"       # Log file path
LOG_ENABLE_CONSOLE=true            # Enable console logging
LOG_ENABLE_FILE=true               # Enable file logging
```

### Features

```bash
FEATURE_SOCKET_IO=true             # Enable Socket.IO
FEATURE_SWAGGER=true               # Enable Swagger docs
FEATURE_METRICS=false              # Enable metrics collection
FEATURE_HEALTH_CHECK=true          # Enable health check endpoint
MFA_ENABLED=true                   # Enable MFA
MFA_ISSUER="Sportification"        # MFA issuer name
```

### AWS (Production)

```bash
AWS_REGION="us-east-1"             # AWS region
AWS_ACCESS_KEY_ID="your-key-id"    # AWS access key (use IAM roles in production)
AWS_SECRET_ACCESS_KEY="your-secret" # AWS secret key
AWS_S3_BUCKET="sportification-uploads" # S3 bucket name
```

---

## 🌍 Environment-Specific Configuration

### Development (.env.development)

```bash
NODE_ENV=development
MONGODB_URI=mongodb://mongodb:27017/sportification_dev
JWT_SECRET=dev-secret-change-me-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-me
REDIS_URL=redis://redis:6379
LOG_LEVEL=debug
FEATURE_SWAGGER=true
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### Test (.env.test)

```bash
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27018/sportification_test
JWT_SECRET=test-secret-for-testing-only
JWT_REFRESH_SECRET=test-refresh-secret-for-testing
REDIS_URL=redis://localhost:6380
LOG_LEVEL=error
BCRYPT_ROUNDS=4  # Faster for tests
FEATURE_SWAGGER=false
```

### Production (.env.production)

```bash
NODE_ENV=production
MONGODB_URI=${MONGODB_URI}  # From AWS Secrets Manager
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
SESSION_SECRET=${SESSION_SECRET}
REDIS_URL=${REDIS_URL}
LOG_LEVEL=info
SESSION_COOKIE_SECURE=true
CORS_CREDENTIALS=true
SECURITY_ENABLE_HELMET=true
SECURITY_ENABLE_RATE_LIMITING=true
```

---

## 🔒 Security Best Practices

### DO ✅

1. **Use strong secrets** (32+ random characters)
2. **Rotate secrets regularly** (every 90 days recommended)
3. **Use AWS Secrets Manager** in production
4. **Keep `.env` and `.env.*.local` out of git**
5. **Use different secrets per environment**
6. **Enable HTTPS in production** (`SESSION_COOKIE_SECURE=true`)
7. **Restrict CORS origins** (specific domains, not `*`)
8. **Use IAM roles** instead of AWS keys when possible

### DON'T ❌

1. **Never commit secrets** to version control
2. **Never use default secrets** in production
3. **Never share secrets** via email/chat
4. **Never reuse secrets** across environments
5. **Never log sensitive values** (passwords, tokens)
6. **Never use weak secrets** (< 32 characters)
7. **Never disable security features** in production

### Secret Management

```bash
# Development: Use .env.development.local for personal secrets
cp .env.development .env.development.local
# Edit .env.development.local with your credentials

# Production: Use AWS Secrets Manager
aws secretsmanager create-secret \
  --name sportification/production/jwt-secret \
  --secret-string "$(openssl rand -base64 32)"
```

---

## ✅ Validation

The application validates environment variables on startup:

### What is Validated

- ✅ Required variables are present
- ✅ Variable types (string, number, boolean, URL, email)
- ✅ Value ranges (min/max for numbers)
- ✅ String lengths (min length for secrets)
- ✅ Enum values (e.g., NODE_ENV must be development/test/production)

### Validation Errors

If validation fails, you'll see detailed error messages:

```
❌ Environment validation failed:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. JWT_SECRET
   Error: Must be at least 32 characters long, got: 16
   Description: JWT signing secret (min 32 chars)

2. MONGODB_URI
   Error: Required variable is missing
   Description: MongoDB connection string

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Tip: Check your .env.development file
   See .env.example for reference configuration
```

---

## 🔍 Troubleshooting

### Application Won't Start

**Problem**: "Missing required environment variables"

**Solution**:

1. Check you have the correct `.env.{NODE_ENV}` file
2. Verify required variables are set
3. See `.env.example` for reference
4. Run `npm run dev` (sets NODE_ENV automatically)

---

### Database Connection Failed

**Problem**: "MongoNetworkError: connect ECONNREFUSED"

**Solution**:

1. Check `MONGODB_URI` is correct
2. Verify MongoDB is running:

   ```bash
   # Docker
   docker-compose up mongodb -d
   
   # Local
   mongosh mongodb://localhost:27017
   ```

3. Check firewall/network settings

---

### Redis Connection Warnings

**Problem**: "Redis connection error"

**Solution**:
Redis is optional for development:

```bash
# Start Redis (optional)
docker-compose up redis -d

# Or disable Redis-dependent features
SESSION_STORE=memory  # Use memory store instead
```

---

### OAuth Not Working

**Problem**: OAuth login fails or returns errors

**Solution**:

1. Check OAuth credentials are set:

   ```bash
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-secret
   ```

2. Verify callback URL matches OAuth app configuration
3. Check OAuth provider credentials are valid
4. Enable OAuth in provider console

---

### JWT Token Errors

**Problem**: "Invalid token" or "Token expired"

**Solution**:

1. Check `JWT_SECRET` and `JWT_REFRESH_SECRET` match across environments
2. Verify token expiration settings:

   ```bash
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   ```

3. Clear old tokens/cookies and login again

---

### Production Environment Issues

**Problem**: Environment variables not loading in production

**Solution**:

1. **AWS ECS**: Ensure secrets are in AWS Secrets Manager
2. **Docker**: Use `--env-file .env.production`
3. **System env**: Set variables in shell/system:

   ```bash
   export MONGODB_URI="mongodb://..."
   export JWT_SECRET="..."
   ```

4. Check Terraform/CloudFormation configured secrets correctly

---

## 📚 Additional Resources

- **Environment Files**: See `.env.example` for complete reference
- **DevOps Setup**: See `DEVOPS_SETUP.md` for production deployment
- **Architecture**: See `.github/copilot-instructions.md`
- **Security**: See `docs/features/security.md`

---

## 🆘 Getting Help

1. **Check logs**: `logs/app.log` or `docker-compose logs api`
2. **Validate config**: Errors shown on startup with fixes
3. **Documentation**: See docs/ directory
4. **Issues**: Create GitHub issue with environment (dev/test/prod)

---

**Last Updated**: October 11, 2025  
**Version**: 1.0.0
