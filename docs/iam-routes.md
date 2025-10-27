# IAM Module Route Registration

The IAM module consists of three separate route groups:

## 1. Authentication Routes
**Base Path**: `/api/v1/auth`  
**File**: `src/modules/iam/api/routes/index.ts`  
**Endpoints**:
- POST /register - User registration
- POST /login - User login
- POST /refresh-token - Token refresh
- POST /logout - User logout (authenticated)
- GET /profile - Get user profile (authenticated)
- PUT /change-password - Change password (authenticated)
- DELETE /deactivate - Deactivate account (authenticated)

## 2. API Key Management Routes
**Base Path**: `/api/v1/api-keys`  
**File**: `src/modules/iam/api/routes/apiKeys.ts`  
**Endpoints** (All authenticated):
- POST / - Create API key
- GET / - List user's API keys
- GET /stats - Get API key statistics
- GET /:keyId - Get specific API key
- PATCH /:keyId - Update API key
- DELETE /:keyId - Delete API key
- POST /:keyId/regenerate - Regenerate API key

## 3. Security & Audit Routes
**Base Path**: `/api/v1/security`  
**File**: `src/modules/iam/api/routes/security.ts`  
**Endpoints** (All authenticated):
- GET /dashboard - Security dashboard
- GET /audit-logs - Audit logs with filtering
- GET /metrics - Security metrics
- GET /alerts - Security alerts
- POST /alerts/:alertId/acknowledge - Acknowledge alert

## Route Registration

All routes are registered in `src/app.ts`:

```typescript
// 1. IAM module registration (auth routes at /api/v1/auth)
const modules = [iamModule, usersModule, matchesModule, ...];
modules.forEach(module => {
  app.use(module.getBasePath(), module.getRouter());
});

// 2. API Keys routes - separate registration at /api/v1/api-keys
app.use(`${apiPrefix}/api-keys`, apiKeyRoutes);

// 3. Security routes - separate registration at /api/v1/security
app.use(`${apiPrefix}/security`, securityRoutes);
```

**Note**: API Keys and Security routes are registered separately from the main IAM module to allow for different middleware configurations and future modularization.

## Security

All routes have:
- ✅ Rate limiting (auth limiter: 20 req/15min)
- ✅ Request validation (express-validator)
- ✅ Error handling (asyncHandler)
- ✅ Authentication middleware (where needed)
- ✅ Swagger documentation

## Total IAM Endpoints

- **Public**: 3 endpoints (register, login, refresh-token)
- **Authenticated**: 16 endpoints
- **Total**: 19 endpoints
