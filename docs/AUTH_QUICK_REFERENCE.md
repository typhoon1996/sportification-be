# 🔐 Authentication & Authorization Quick Reference

> Quick guide for implementing and testing protected routes

## 🚀 Quick Start

### Get an Access Token

```bash
# 1. Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }'

# 2. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'

# Save the accessToken from response
```

### Use Protected Endpoint

```bash
curl -X GET http://localhost:3000/api/v1/matches \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📋 Route Protection Patterns

### Pattern 1: Basic Authentication (Any User)

```typescript
import { authenticate } from '@/shared/middleware/auth';

router.get('/resource', authenticate, controller.get);
```

### Pattern 2: Role-Based Authorization

```typescript
import { authenticate, authorize } from '@/shared/middleware/auth';

// Admin only
router.delete('/resource/:id', 
  authenticate, 
  authorize(['admin']), 
  controller.delete
);

// Admin or Moderator
router.post('/resource', 
  authenticate, 
  authorize(['admin', 'moderator']), 
  controller.create
);
```

### Pattern 3: Global Router Protection

```typescript
const router = Router();

// Protect entire router
router.use(authenticate);

// All routes below require authentication
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
```

### Pattern 4: Ownership Verification

```typescript
// In controller
export class ResourceController {
  updateResource = asyncHandler(async (req: AuthRequest, res: Response) => {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      throw new NotFoundError('Resource');
    }
    
    // Verify ownership or admin
    if (resource.createdBy.toString() !== req.userId && 
        !['admin', 'moderator'].includes(req.user.role)) {
      throw new ForbiddenError('Only resource owner or admin can update');
    }
    
    // Update logic...
  });
}
```

---

## 🎭 Role Matrix

| Action | User | Moderator | Admin |
|--------|------|-----------|-------|
| View public content | ✅ | ✅ | ✅ |
| Create content | ✅ | ✅ | ✅ |
| Update own content | ✅ | ✅ | ✅ |
| Delete own content | ✅ | ✅ | ✅ |
| View all users | ❌ | ✅ | ✅ |
| Delete any match/team/tournament | ❌ | ✅ | ✅ |
| Create/update venues | ❌ | ✅ | ✅ |
| Delete venues | ❌ | ❌ | ✅ |
| Access admin analytics | ❌ | ❌ | ✅ |
| System configuration | ❌ | ❌ | ✅ |

---

## 🧪 Testing Cheat Sheet

### Test Authentication

```bash
# ❌ No token (should get 401)
curl http://localhost:3000/api/v1/matches

# ✅ With token (should work)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/v1/matches

# ❌ Invalid token (should get 401)
curl -H "Authorization: Bearer invalid" http://localhost:3000/api/v1/matches

# ❌ Expired token (should get 401)
curl -H "Authorization: Bearer expired_token" http://localhost:3000/api/v1/matches
```

### Test Role-Based Authorization

```bash
# Regular user tries admin endpoint (should get 403)
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:3000/api/v1/admin/analytics/dashboard

# Admin tries admin endpoint (should work)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/v1/admin/analytics/dashboard
```

### Test Rate Limiting

```bash
# Make 101 requests quickly (101st should get 429)
for i in {1..101}; do
  curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/v1/matches
done
```

---

## 📦 Common HTTP Status Codes

| Code | Meaning | Cause | Solution |
|------|---------|-------|----------|
| 200 | OK | Request succeeded | - |
| 201 | Created | Resource created | - |
| 400 | Bad Request | Invalid input | Check request body/params |
| 401 | Unauthorized | No/invalid token | Login or refresh token |
| 403 | Forbidden | Insufficient permissions | Check user role |
| 404 | Not Found | Resource doesn't exist | Check ID |
| 409 | Conflict | Business rule violation | Check request validity |
| 429 | Too Many Requests | Rate limit exceeded | Wait and retry |
| 500 | Internal Error | Server error | Check logs |

---

## 🔑 Token Management

### Access Token

```typescript
// Expires: 7 days
// Location: Authorization header
// Format: Bearer <token>

// Usage
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

### Refresh Token

```typescript
// Expires: 30 days
// Used to get new access token

// Refresh flow
POST /api/v1/auth/refresh-token
{
  "refreshToken": "your_refresh_token"
}

// Response includes new access token
```

### Token Expiry Handling

```typescript
// Detect expired token
if (error.response?.status === 401 && 
    error.response?.data?.code === 'TOKEN_EXPIRED') {
  
  // Attempt refresh
  const newToken = await refreshAccessToken();
  
  // Retry original request
  retryWithNewToken(newToken);
}
```

---

## 🛠️ Middleware Order

Always apply middleware in this order:

```typescript
router.post('/resource',
  rateLimiter,        // 1. Rate limiting
  authenticate,       // 2. Authentication
  authorize(['admin']), // 3. Authorization
  validation,         // 4. Input validation
  validateRequest,    // 5. Validation error handling
  controller.method   // 6. Business logic
);
```

---

## 💡 Best Practices

### ✅ DO

```typescript
// Use authenticate middleware
router.get('/protected', authenticate, controller.get);

// Use authorize for role checks
router.delete('/resource/:id', 
  authenticate, 
  authorize(['admin', 'moderator']),
  controller.delete
);

// Verify ownership in controller
if (resource.createdBy.toString() !== req.userId) {
  throw new ForbiddenError('Not authorized');
}

// Use typed request
async (req: AuthRequest, res: Response) => {
  const userId = req.userId; // TypeScript knows this exists
}
```

### ❌ DON'T

```typescript
// Don't trust client-provided user ID
const userId = req.body.userId; // ❌ Can be spoofed

// Don't check roles in business logic
if (user.role === 'admin') { /* ... */ } // ❌ Use authorize middleware

// Don't forget to authenticate
router.delete('/resource/:id', controller.delete); // ❌ Missing authenticate

// Don't use plain Request type
async (req: Request, res: Response) => {
  const userId = req.userId; // ❌ TypeScript error
}
```

---

## 🔍 Debugging Tips

### Check Token

```typescript
// Decode JWT (without verification) to inspect contents
import jwt from 'jsonwebtoken';

const decoded = jwt.decode(token);
console.log('Token payload:', decoded);
// { userId: '...', iat: ..., exp: ... }
```

### Log Authentication

```typescript
import logger from '@/shared/utils/logger';

logger.debug('Auth attempt', { 
  userId: req.userId,
  path: req.path,
  method: req.method 
});
```

### Test Middleware Locally

```typescript
// Create mock request/response
const mockReq = {
  headers: {
    authorization: 'Bearer test-token'
  }
} as Request;

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
} as unknown as Response;

const mockNext = jest.fn();

await authenticate(mockReq, mockRes, mockNext);
```

---

## 📚 Reference Links

- **Full Documentation**: `/docs/ROUTE_PROTECTION_SUMMARY.md`
- **Implementation Guide**: `/docs/ROUTE_PROTECTION_IMPLEMENTATION.md`
- **Auth Middleware**: `src/shared/middleware/auth.ts`
- **User Model**: `src/modules/users/domain/models/User.ts`
- **JWT Utilities**: `src/shared/lib/auth/jwt.ts`

---

## 🆘 Common Issues

### Issue: "Access token is required"

**Cause**: No Authorization header
**Fix**: Add `Authorization: Bearer <token>` header

### Issue: "Invalid access token"

**Cause**: Malformed or corrupted token
**Fix**: Login again to get new token

### Issue: "Access token has expired"

**Cause**: Token older than 7 days
**Fix**: Use refresh token endpoint

### Issue: "Insufficient permissions"

**Cause**: User role doesn't match required roles
**Fix**: Check route requirements and user role

### Issue: "Too many requests"

**Cause**: Rate limit exceeded
**Fix**: Wait for rate limit window to reset

---

**Quick Tip**: Use the browser extension "ModHeader" to easily add Authorization headers when testing in browser!
