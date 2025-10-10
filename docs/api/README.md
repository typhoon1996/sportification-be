# API Documentation

Complete API reference for the Sportification Backend.

## 📡 API Reference

- **[API Documentation](API_DOCUMENTATION.md)** - Full API reference
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

## 🚀 Quick Start

### Authentication

```bash
# Register a new user
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe"
}
```

### Using the API

```bash
# Get user profile (authenticated)
GET /api/users/me
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
