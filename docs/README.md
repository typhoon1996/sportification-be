# API Documentation Index

Welcome to the Sports Companion API documentation. This comprehensive guide covers all features and endpoints required for frontend implementation.

## 📚 Documentation Sections

- **[auth.md](./auth.md)** - Authentication & User Management
- **[users.md](./users.md)** - User Profile & Social Features
- **[matches.md](./matches.md)** - Match Management
- **[tournaments.md](./tournaments.md)** - Tournament System
- **[chat.md](./chat.md)** - Chat & Messaging
- **[notifications.md](./notifications.md)** - Notifications System
- **[venues.md](./venues.md)** - Venue Management
- **[admin.md](./admin.md)** - Admin APIs (Analytics, Insights, System Management)
- **[ai.md](./ai.md)** - AI & Machine Learning Features
- **[security.md](./security.md)** - Security & API Keys
- **[websockets.md](./websockets.md)** - Real-time Communication

## 🌐 Global Configuration

### Base URL
- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://api.sportification.app/v1`

### Authentication (JWT)
All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

**Token Lifecycle:**
- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Use `/api/v1/auth/refresh` to get a new access token

**Security Best Practices:**
- Store tokens securely (HttpOnly cookies or secure storage)
- Never expose tokens in URLs or logs
- Implement token refresh logic before expiration
- Clear tokens on logout

### Real-time Communication (WebSocket)

The API uses Socket.IO for real-time features:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling']
});

// Authenticate socket connection
socket.emit('authenticate', yourJwtToken);

socket.on('authenticated', (data) => {
  console.log('Connected:', data.user);
});
```

**Real-time Features:**
- Chat messages (instant delivery)
- Match updates (player joins/leaves, status changes)
- Tournament updates (bracket changes, registrations)
- Live notifications
- User online/offline status

See [websockets.md](./websockets.md) for complete WebSocket documentation.

### Push Notifications

Push notifications are supported for:
- Match invitations and updates
- Tournament registrations and bracket changes
- New messages and mentions
- Friend requests and social interactions
- System announcements

**Implementation:**
- Configure notification preferences via `/api/v1/notifications/preferences`
- Notifications are delivered via WebSocket for online users
- Push notifications for offline users (when integrated with FCM/APNS)

### Calendar Sync

Calendar integration is available for:
- Match schedules
- Tournament dates
- Training sessions

**Supported Platforms:**
- Google Calendar (OAuth integration)
- Apple Calendar (CalDAV)
- iCal export format

**Endpoints:**
- Export to calendar: `GET /api/v1/matches/:id/calendar`
- Sync preferences: `PATCH /api/v1/users/profile` (calendar settings)

### Standard Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* additional error context */ }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Pagination

Paginated endpoints use these query parameters:

- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page

**Pagination Response:**
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Rate Limiting

Rate limits vary by endpoint:
- **Auth endpoints**: 5 requests per 15 minutes per IP
- **Standard endpoints**: 100 requests per 15 minutes per user
- **Admin endpoints**: 60 requests per 15 minutes per user

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642262400
```

### Common Query Parameters

**Filtering:**
- `sport` - Filter by sport type
- `status` - Filter by status (active, completed, cancelled)
- `date` - Filter by date (ISO 8601 format)

**Sorting:**
- `sort` - Field to sort by (e.g., `createdAt`, `date`)
- `order` - Sort order: `asc` or `desc`

**Search:**
- `q` or `search` - Search query string

## 🔧 Development Tools

### API Testing
- Swagger UI: `http://localhost:3000/api/v1/docs`
- Postman Collection: Available in repository

### WebSocket Testing
- Socket.IO Client: Browser console or dedicated testing tool
- See [websockets.md](./websockets.md) for testing examples

## 📞 Support

- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check section-specific docs for detailed information
- **Examples**: See `/examples` directory in repository

---

Each section contains:
- Feature descriptions
- Complete endpoint list with HTTP methods
- Request/response examples
- Query parameters and body schemas
- Authentication requirements
- Real-time (WebSocket) integration notes
