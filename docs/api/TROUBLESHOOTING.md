# API Troubleshooting Guide

Common issues and solutions when working with the Sportification Backend API.

---

## Authentication Issues

### Issue: "Authentication required" or 401 Unauthorized

**Symptoms:**
```json
{
  "success": false,
  "message": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**Common Causes:**
1. Missing `Authorization` header
2. Invalid or expired access token
3. Malformed Bearer token format

**Solutions:**

```bash
# ✅ Correct format
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ Wrong formats
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Missing "Bearer"
Authorization: Bearer  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Extra space
```

**How to fix:**
1. Check token is included: `Authorization: Bearer <token>`
2. Verify token hasn't expired (7 days lifespan)
3. Use refresh token endpoint if expired:
   ```bash
   POST /api/v1/auth/refresh-token
   {"refreshToken": "your-refresh-token"}
   ```

---

### Issue: "Invalid or expired token"

**Symptoms:**
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "code": "TOKEN_EXPIRED"
}
```

**Solution:**
Refresh your access token:

```bash
curl -X POST /api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'
```

**Prevention:**
- Store both access and refresh tokens
- Implement automatic token refresh in your client
- Check token expiration before requests

---

### Issue: "Insufficient permissions" or 403 Forbidden

**Symptoms:**
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "code": "FORBIDDEN"
}
```

**Common Causes:**
- User role doesn't have required permissions
- Attempting admin-only operations with user role
- Trying to modify resources owned by other users

**Solution:**
Check endpoint permissions:
- **Public endpoints**: No auth needed (register, login)
- **Authenticated endpoints**: Any logged-in user
- **Admin/Moderator endpoints**: Elevated permissions required

**Examples of restricted endpoints:**
- `GET /api/v1/users` - Admin/Moderator only
- `POST /api/v1/venues` - Admin/Moderator only
- `DELETE /api/v1/matches/:id` - Admin/Moderator only
- `GET /api/v1/admin/*` - Admin only

---

## Validation Errors

### Issue: 400 Bad Request with validation errors

**Symptoms:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

**Common Issues:**

#### Email Validation
```javascript
// ❌ Invalid emails
"user@"
"@example.com"
"user.example.com"

// ✅ Valid email
"user@example.com"
```

#### Password Validation
```javascript
// ❌ Too short
"Pass1!"  // Less than 8 characters

// ✅ Valid password
"SecurePass123!"  // At least 8 characters
```

#### Date Validation
```javascript
// ❌ Invalid formats
"2025-13-01"  // Invalid month
"20-10-2025"  // Wrong format

// ✅ Valid ISO 8601 date
"2025-10-20"
"2025-10-20T18:00:00Z"
```

---

## Resource Not Found (404)

### Issue: "Resource not found"

**Symptoms:**
```json
{
  "success": false,
  "message": "Match not found",
  "code": "NOT_FOUND"
}
```

**Common Causes:**
1. Invalid ID format
2. Resource was deleted
3. Wrong endpoint URL

**Solutions:**

#### Check ID Format
```bash
# ✅ Valid MongoDB ObjectId (24 hex characters)
507f1f77bcf86cd799439011

# ❌ Invalid IDs
123                          # Too short
507f-1f77-bcf8-6cd7-9943     # Wrong format
507f1f77bcf86cd79943901G     # Invalid character 'G'
```

#### Verify Resource Exists
```bash
# List resources first to get valid IDs
GET /api/v1/matches?page=1&limit=10

# Then use a valid ID from the list
GET /api/v1/matches/507f1f77bcf86cd799439011
```

---

## Conflict Errors (409)

### Issue: "Email already exists"

**Symptoms:**
```json
{
  "success": false,
  "message": "Email already exists",
  "code": "DUPLICATE_EMAIL"
}
```

**Solution:**
Use a different email address or login with existing account.

---

### Issue: "Already participating in this match"

**Symptoms:**
```json
{
  "success": false,
  "message": "Already participating in this match",
  "code": "ALREADY_PARTICIPANT"
}
```

**Solution:**
User is already in the match. Check match participants before joining:
```bash
GET /api/v1/matches/:id
```

---

### Issue: "Match is full"

**Symptoms:**
```json
{
  "success": false,
  "message": "Match is full",
  "code": "MATCH_FULL"
}
```

**Solution:**
- Check `maxParticipants` vs current `participants` count
- Find another match or create a new one
- Contact match creator to increase `maxParticipants`

---

## Rate Limiting (429)

### Issue: "Too many requests"

**Symptoms:**
```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

**Rate Limits:**
- Authentication: 20 requests per 15 minutes
- General API: 100 requests per 15 minutes
- File uploads: 10 requests per 15 minutes

**Solutions:**

1. **Check rate limit headers:**
   ```
   X-RateLimit-Limit: 100
   X-RateLimit-Remaining: 0
   X-RateLimit-Reset: 1698765432
   ```

2. **Implement exponential backoff:**
   ```javascript
   async function requestWithRetry(url, options, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       const response = await fetch(url, options);
       
       if (response.status === 429) {
         const retryAfter = response.headers.get('Retry-After') || (2 ** i * 1000);
         await new Promise(resolve => setTimeout(resolve, retryAfter));
         continue;
       }
       
       return response;
     }
     throw new Error('Max retries exceeded');
   }
   ```

3. **Optimize requests:**
   - Batch operations where possible
   - Cache responses locally
   - Use pagination efficiently
   - Avoid polling; use WebSocket for real-time updates

---

## Pagination Issues

### Issue: Empty results when data exists

**Symptoms:**
```json
{
  "success": true,
  "data": {
    "matches": []
  },
  "meta": {
    "pagination": {
      "page": 10,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

**Cause:**
Requesting page beyond available pages (page 10 when only 3 pages exist).

**Solution:**
```bash
# Check total pages first
GET /api/v1/matches?page=1&limit=10

# Use valid page number
GET /api/v1/matches?page=2&limit=10  # ✅ Valid (page <= pages)
GET /api/v1/matches?page=10&limit=10 # ❌ Invalid (page > pages)
```

---

## WebSocket Issues

### Issue: WebSocket connection fails

**Symptoms:**
- Connection timeout
- "auth-error" events
- Disconnection immediately after connection

**Solutions:**

1. **Authenticate properly:**
   ```javascript
   const socket = io('http://localhost:3000');
   
   // Authenticate after connection
   socket.on('connect', () => {
     socket.emit('authenticate', 'your-jwt-token');
   });
   
   socket.on('authenticated', (data) => {
     console.log('Authenticated:', data.user);
   });
   
   socket.on('auth-error', (error) => {
     console.error('Auth failed:', error);
   });
   ```

2. **Check CORS settings:**
   Ensure your client origin is allowed in CORS configuration.

3. **Use correct transport:**
   ```javascript
   const socket = io('http://localhost:3000', {
     transports: ['websocket', 'polling']
   });
   ```

---

## Common Request Mistakes

### Missing Content-Type Header

```bash
# ❌ Wrong - Missing Content-Type
curl -X POST /api/v1/matches \
  -H "Authorization: Bearer TOKEN" \
  -d '{"sport": "football"}'

# ✅ Correct - Include Content-Type
curl -X POST /api/v1/matches \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sport": "football"}'
```

### Invalid JSON Format

```bash
# ❌ Wrong - Single quotes or trailing commas
{"sport": 'football', "maxParticipants": 10,}

# ✅ Correct - Valid JSON
{"sport": "football", "maxParticipants": 10}
```

### Wrong HTTP Method

```bash
# ❌ Wrong - Using GET for updates
GET /api/v1/users/profile?firstName=John

# ✅ Correct - Use PUT/PATCH with body
PUT /api/v1/users/profile
{"firstName": "John"}
```

---

## Debugging Tips

### 1. Check API Health

```bash
curl http://localhost:3000/health
```

### 2. View API Information

```bash
curl http://localhost:3000/api/v1
```

### 3. Use Swagger UI for Testing

Navigate to: `http://localhost:3000/api/v1/docs`

### 4. Check Server Logs

```bash
# If running locally
tail -f logs/app.log

# If using Docker
docker-compose logs -f api
```

### 5. Enable Verbose Logging

Add to your `.env`:
```
LOG_LEVEL=debug
```

---

## Getting Help

If you're still experiencing issues:

1. **Check Documentation:**
   - [Complete API Reference](./COMPLETE_API_REFERENCE.md)
   - [Quick Reference](./QUICK_REFERENCE.md)
   - [Endpoint Index](./ENDPOINT_INDEX.md)

2. **Search GitHub Issues:**
   - [Existing Issues](https://github.com/SlenderShield/sportification-be/issues)

3. **Create New Issue:**
   Include:
   - Error message
   - Request details (method, endpoint, body)
   - Expected vs actual behavior
   - Environment (development/production)

4. **Contact Support:**
   - Email: team@sportification.com
   - Include relevant logs and request details

---

**Last Updated:** October 2025  
**API Version:** 2.0.0
