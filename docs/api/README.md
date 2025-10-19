# API Documentation

Complete API reference for the Sportification Backend with comprehensive documentation for all endpoints.

## 📡 API Reference

### 📚 Main Documentation Files

- **[COMPLETE_API_REFERENCE.md](COMPLETE_API_REFERENCE.md)** - **NEW! Complete API reference with all endpoints**
  - ✅ All 9 API modules fully documented
  - ✅ Detailed request/response examples
  - ✅ Parameter tables with validation rules
  - ✅ Authentication requirements
  - ✅ Error responses with codes
  - ✅ curl examples for all endpoints
  - ✅ Common patterns and formats
  - ✅ Rate limiting information
  - ✅ WebSocket events

- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Extended API documentation
  - Authentication endpoints (login, register, OAuth, MFA)
  - User management APIs
  - Team management APIs
  - Match management APIs
  - Tournament management APIs
  - Venue management APIs
  - Chat APIs
  - Notification APIs
  - Admin APIs
  - Request/response schemas
  - Error handling
  - Rate limiting
  - WebSocket events

## 🚀 Quick Access

### Quick Reference Guides

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick access tables for all endpoints
  - All endpoints organized by module
  - Common query parameters
  - Request examples
  - Status codes reference

- **[ENDPOINT_INDEX.md](ENDPOINT_INDEX.md)** - Comprehensive endpoint index
  - Endpoints grouped by functionality
  - Permission requirements
  - Filtering and sorting options
  - Quick navigation

## 📖 Quick Start

### 1. Register a User

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "profile": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### 2. Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### 3. Use Authenticated Endpoints

```bash
GET /api/v1/auth/profile
Authorization: Bearer <your-jwt-token>
```

## 📚 Related Documentation

- **[Authentication Guide](../features/auth.md)** - Authentication system details
- **[Security Guide](../features/security.md)** - Security best practices
- **[WebSocket API](../features/websockets.md)** - Real-time communication
- **[Integration Examples](../examples/)** - Complete integration workflows

## 🔗 External Links

- [OpenAPI Specification](../../openapi.yaml) - OpenAPI/Swagger spec
- [Postman Collection](#) - API testing collection

---

**[⬆ Back to Documentation](../README.md)**
