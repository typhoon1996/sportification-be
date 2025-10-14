# 🔒 Route Protection Summary

**Last Updated**: October 13, 2025  
**Status**: ✅ All routes protected with authentication and role-based authorization

---

## Overview

All routes in the Sportification Backend are now protected with authentication and role-based authorization. This document provides a comprehensive overview of the protection levels for each module.

## Authentication & Authorization Levels

### 🔐 Authentication Levels

- **Public**: No authentication required (very limited)
- **Authenticated**: Requires valid JWT token
- **Role-based**: Requires specific role(s)

### 👥 Roles

1. **user** - Default role for all registered users
2. **moderator** - Can manage content and moderate users
3. **admin** - Full system access

---

## Module-by-Module Breakdown

### 1. IAM Module (`/api/v1/auth`)

| Endpoint | Method | Auth Required | Roles | Description |
|----------|--------|---------------|-------|-------------|
| `/register` | POST | ❌ Public | - | User registration |
| `/login` | POST | ❌ Public | - | User login |
| `/refresh-token` | POST | ❌ Public | - | Refresh access token |
| `/logout` | POST | ✅ Required | Any | User logout |
| `/profile` | GET | ✅ Required | Any | Get user profile |
| `/change-password` | PUT | ✅ Required | Any | Change password |
| `/deactivate` | DELETE | ✅ Required | Any | Deactivate account |

**Notes**:

- Rate limiting applied to all auth routes (20 requests/15 minutes)
- Only registration, login, and token refresh are public
- All other routes require authentication

---

### 2. Users Module (`/api/v1/users`)

| Endpoint | Method | Auth Required | Roles | Description |
|----------|--------|---------------|-------|-------------|
| `/` | GET | ✅ Required | admin, moderator | List all users |
| `/search` | GET | ✅ Required | Any | Search users |
| `/:id` | GET | ✅ Required | Any | Get user by ID |
| `/profile` | PUT | ✅ Required | Any | Update own profile |
| `/:id/friends` | GET | ✅ Required | Any | Get user friends |
| `/:friendId/friend` | POST | ✅ Required | Any | Add friend |
| `/:friendId/friend` | DELETE | ✅ Required | Any | Remove friend |

**Notes**:

- All routes require authentication
- User listing restricted to admin/moderator only
- Users can only update their own profile

---

### 3. Matches Module (`/api/v1/matches`)

| Endpoint | Method | Auth Required | Roles | Description |
|----------|--------|---------------|-------|-------------|
| `/` | POST | ✅ Required | Any | Create match |
| `/` | GET | ✅ Required | Any | List matches |
| `/:id` | GET | ✅ Required | Any | Get match details |
| `/:id/join` | POST | ✅ Required | Any | Join match |
| `/:id/leave` | POST | ✅ Required | Any | Leave match |
| `/:id/score` | PUT | ✅ Required | Any* | Update score |
| `/:id/status` | PUT | ✅ Required | Any* | Update status |
| `/:id` | DELETE | ✅ Required | admin, moderator | Delete match |

**Notes**:

- All routes require authentication
- Score/status updates should be verified in controller (creator/participants only)
- Only admin/moderator can delete matches

---

### 4. Tournaments Module (`/api/v1/tournaments`)

| Endpoint | Method | Auth Required | Roles | Description |
|----------|--------|---------------|-------|-------------|
| `/` | POST | ✅ Required | Any | Create tournament |
| `/` | GET | ✅ Required | Any | List tournaments |
| `/:id` | GET | ✅ Required | Any | Get tournament details |
| `/:id/join` | POST | ✅ Required | Any | Join tournament |
| `/:id/leave` | POST | ✅ Required | Any | Leave tournament |
| `/:id/start` | PUT | ✅ Required | Any* | Start tournament |
| `/:id` | PUT | ✅ Required | Any* | Update tournament |
| `/:id` | DELETE | ✅ Required | admin, moderator | Delete tournament |

**Notes**:

- All routes require authentication
- Start/update should verify ownership in controller
- Only admin/moderator can delete tournaments

---

### 5. Teams Module (`/api/v1/teams`)

| Endpoint | Method | Auth Required | Roles | Description |
|----------|--------|---------------|-------|-------------|
| `/` | POST | ✅ Required | Any | Create team |
| `/` | GET | ✅ Required | Any | List teams |
| `/:id` | GET | ✅ Required | Any | Get team details |
| `/:id/join` | POST | ✅ Required | Any | Join team |
| `/:id/leave` | POST | ✅ Required | Any | Leave team |
| `/:id` | PUT | ✅ Required | Any* | Update team |
| `/:id` | DELETE | ✅ Required | admin, moderator | Delete team |

**Notes**:

- All routes require authentication
- Update should verify ownership in controller
- Only admin/moderator can delete teams

---

### 6. Venues Module (`/api/v1/venues`)

| Endpoint | Method | Auth Required | Roles | Description |
|----------|--------|---------------|-------|-------------|
| `/` | POST | ✅ Required | admin, moderator | Create venue |
| `/` | GET | ✅ Required | Any | List venues |
| `/:id` | GET | ✅ Required | Any | Get venue details |
| `/:id` | PUT | ✅ Required | admin, moderator | Update venue |
| `/:id` | DELETE | ✅ Required | admin | Delete venue |

**Notes**:

- All routes require authentication
- Only admin/moderator can create/update venues
- Only admin can delete venues

---

### 7. Venue Bookings (`/api/v1/venues/bookings`)

| Endpoint | Method | Auth Required | Roles | Description |
|----------|--------|---------------|-------|-------------|
| `/check-availability` | POST | ✅ Required | Any | Check availability |
| `/` | POST | ✅ Required | Any | Create booking |
| `/` | GET | ✅ Required | admin, moderator | List all bookings |
| `/my-bookings` | GET | ✅ Required | Any | Get user's bookings |
| `/dashboard/stats` | GET | ✅ Required | admin, moderator | Get statistics |
| `/:id` | GET | ✅ Required | Any | Get booking details |
| `/:id` | PATCH | ✅ Required | Any* | Update booking |
| `/:id/cancel` | POST | ✅ Required | Any* | Cancel booking |
| `/:id/confirm-payment` | POST | ✅ Required | admin, moderator | Confirm payment |
| `/:id/checkin` | POST | ✅ Required | admin, moderator | Check-in |
| `/:id/checkout` | POST | ✅ Required | admin, moderator | Check-out |
| `/:id/no-show` | POST | ✅ Required | admin, moderator | Mark no-show |
| `/venue/:venueId` | GET | ✅ Required | Any | Get venue bookings |
| `/venue/:venueId/analytics` | GET | ✅ Required | admin, moderator | Get venue analytics |
| `/venue/:venueId/calendar` | GET | ✅ Required | Any | Get venue calendar |

**Notes**:

- All routes require authentication
- Update/cancel should verify ownership in controller
- Payment, check-in/out restricted to admin/moderator
- Analytics restricted to admin/moderator

---

### 8. Chat Module (`/api/v1/chat`)

| Endpoint | Method | Auth Required | Roles | Description |
|----------|--------|---------------|-------|-------------|
| `/` | POST | ✅ Required | Any | Create chat |
| `/` | GET | ✅ Required | Any | Get user chats |
| `/:chatId/messages` | GET | ✅ Required | Any | Get messages |
| `/:chatId/messages` | POST | ✅ Required | Any | Send message |

**Notes**:

- All routes require authentication
- Users can only access their own chats (verified in controller)

---

### 9. Notifications Module (`/api/v1/notifications`)

| Endpoint | Method | Auth Required | Roles | Description |
|----------|--------|---------------|-------|-------------|
| `/` | GET | ✅ Required | Any | Get notifications |
| `/:id` | GET | ✅ Required | Any | Get notification |
| `/:id/read` | PUT | ✅ Required | Any | Mark as read |
| `/read-all` | PUT | ✅ Required | Any | Mark all as read |
| `/:id` | DELETE | ✅ Required | Any | Delete notification |

**Notes**:

- All routes require authentication
- Users can only access their own notifications

---

### 10. Analytics Module (`/api/v1/analytics`)

| Endpoint | Method | Auth Required | Roles | Description |
|----------|--------|---------------|-------|-------------|
| `/overview` | GET | ✅ Required | Any | Get overview |
| `/users/:userId?` | GET | ✅ Required | Any | Get user analytics |
| `/matches/:matchId` | GET | ✅ Required | Any | Get match analytics |
| `/insights` | GET | ✅ Required | Any | Get insights |

**Notes**:

- All routes require authentication
- Users can access their own analytics
- Admin/moderator can access all analytics (verified in controller)

---

### 11. Admin Analytics (`/api/v1/admin`)

| Endpoint | Method | Auth Required | Roles | Description |
|----------|--------|---------------|-------|-------------|
| `/analytics/dashboard` | GET | ✅ Required | admin | Analytics dashboard |
| `/analytics/user-engagement` | GET | ✅ Required | admin | User engagement |
| `/analytics/performance` | GET | ✅ Required | admin | Performance metrics |
| `/analytics/business-intelligence` | GET | ✅ Required | admin | Business intelligence |
| `/analytics/system-health` | GET | ✅ Required | admin | System health |
| `/analytics/predictive` | GET | ✅ Required | admin | Predictive analytics |
| `/analytics/reports/custom` | POST | ✅ Required | admin | Custom reports |
| `/insights/application` | GET | ✅ Required | admin | Application insights |
| `/insights/user-behavior` | GET | ✅ Required | admin | User behavior |
| `/insights/business` | GET | ✅ Required | admin | Business insights |
| `/insights/predictive` | GET | ✅ Required | admin | Predictive insights |
| `/insights/competitive` | GET | ✅ Required | admin | Competitive insights |
| `/system/overview` | GET | ✅ Required | admin | System overview |
| `/users/management` | GET | ✅ Required | admin | User management |

**Notes**:

- All routes require authentication AND admin role
- Rate limiting applied (20 requests/15 minutes)
- Comprehensive admin-only analytics and insights

---

### 12. Security Module (`/api/v1/security`)

| Endpoint | Method | Auth Required | Roles | Description |
|----------|--------|---------------|-------|-------------|
| `/dashboard` | GET | ✅ Required | Any | Security dashboard |
| `/audit-logs` | GET | ✅ Required | Any* | Get audit logs |
| `/metrics` | GET | ✅ Required | Any* | Security metrics |
| `/alerts` | GET | ✅ Required | Any* | Security alerts |
| `/alerts/:alertId/acknowledge` | POST | ✅ Required | Any* | Acknowledge alert |

**Notes**:

- All routes require authentication
- Rate limiting applied (20 requests/15 minutes)
- Global data access should be restricted to admin in controller

---

### 13. API Keys Module (`/api/v1/api-keys`)

| Endpoint | Method | Auth Required | Roles | Description |
|----------|--------|---------------|-------|-------------|
| `/` | POST | ✅ Required | Any | Create API key |
| `/` | GET | ✅ Required | Any | List user's keys |
| `/stats` | GET | ✅ Required | Any | Get usage stats |
| `/:keyId` | GET | ✅ Required | Any | Get API key |
| `/:keyId` | PATCH | ✅ Required | Any | Update API key |
| `/:keyId` | DELETE | ✅ Required | Any | Delete API key |
| `/:keyId/regenerate` | POST | ✅ Required | Any | Regenerate key |

**Notes**:

- All routes require authentication
- Rate limiting applied (20 requests/15 minutes)
- Users can only manage their own API keys

---

## Security Measures

### 1. Authentication

- JWT-based authentication
- Access tokens expire in 7 days
- Refresh tokens expire in 30 days
- Tokens can be revoked

### 2. Authorization

- Role-based access control (RBAC)
- Three roles: user, admin, moderator
- Middleware: `authenticate`, `authorize(['role'])`

### 3. Rate Limiting

- Global: 100 requests/15 minutes
- Auth endpoints: 20 requests/15 minutes
- File uploads: 10 requests/15 minutes

### 4. Input Validation

- All routes have request validation
- express-validator for schema validation
- MongoDB injection protection (express-mongo-sanitize)
- XSS protection via helmet

### 5. Security Headers

- Helmet middleware for security headers
- CORS configuration (environment-specific)
- Content Security Policy
- X-Frame-Options: DENY

---

## Implementation Details

### Middleware Stack (Typical Route)

```typescript
router.post(
  '/endpoint',
  authenticate,                    // 1. Verify JWT token
  authorize(['admin', 'moderator']), // 2. Check role
  validationRules,                 // 3. Validate input
  validateRequest,                 // 4. Check validation results
  controller.method                // 5. Execute business logic
);
```

### Global Protection

```typescript
// Apply to entire router
router.use(authenticate);

// Then define routes
router.get('/', controller.list);
router.post('/', controller.create);
```

### Role Checking

```typescript
// In controller (for resource ownership)
if (resource.createdBy.toString() !== req.userId) {
  throw new ForbiddenError('Only resource owner can update');
}

// In middleware (for role)
authorize(['admin', 'moderator'])
```

---

## Testing Authentication

### 1. Register a User

```bash
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "Password123",
  "profile": { "firstName": "John", "lastName": "Doe" }
}
```

### 2. Login

```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "Password123"
}
```

Response includes:

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 3. Use Protected Endpoint

```bash
GET /api/v1/matches
Authorization: Bearer eyJhbGc...
```

---

## Migration Notes

### For Existing Clients

**⚠️ BREAKING CHANGES:**

1. **All routes now require authentication** (except auth endpoints)
   - Previously public routes now return 401 without token
   - Update clients to include `Authorization: Bearer <token>` header

2. **Some routes now require specific roles**
   - Admin/moderator roles for management endpoints
   - Regular users may get 403 Forbidden on restricted routes

3. **Rate limiting is enforced**
   - Clients should handle 429 Too Many Requests
   - Implement exponential backoff

### Recommended Client Updates

```typescript
// Add token to all requests
const apiClient = axios.create({
  baseURL: 'https://api.sportification.com',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Handle 401 - refresh token and retry
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Refresh token logic
      const newToken = await refreshAccessToken();
      error.config.headers['Authorization'] = `Bearer ${newToken}`;
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  }
);

// Handle 403 - insufficient permissions
if (error.response?.status === 403) {
  // Show "Access Denied" message
  showAccessDeniedDialog();
}
```

---

## Future Enhancements

### Planned Features

1. **Permission-based authorization** (fine-grained)
2. **API key authentication** (for external integrations)
3. **OAuth 2.0 support** (social login)
4. **Multi-factor authentication (MFA)**
5. **IP whitelisting** (for sensitive operations)
6. **Audit logging** (track all access)

### Timeline

- Q4 2025: Permission-based authorization
- Q1 2026: API key authentication
- Q2 2026: OAuth 2.0 and MFA

---

## Support

### Questions?

- Documentation: `/docs`
- API Docs: `http://localhost:3000/api/v1/docs`
- GitHub Issues: Report bugs and request features

### Emergency

- Security issues: <security@sportification.com>
- Production outages: on-call engineer

---

**Maintained by**: Backend Team  
**Last Review**: October 13, 2025  
**Next Review**: January 2026
