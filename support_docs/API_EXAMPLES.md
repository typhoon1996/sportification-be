# Sports Companion API Examples

This document provides comprehensive examples for testing the Sports Companion API endpoints.

## Authentication Examples

### Register a new user

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

## Chat System Examples

### Create a direct chat

```bash
curl -X POST http://localhost:3000/api/v1/chats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "type": "direct",
    "participants": ["USER_ID_1", "USER_ID_2"]
  }'
```

### Create a group chat

```bash
curl -X POST http://localhost:3000/api/v1/chats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "type": "group",
    "name": "Sports Squad",
    "participants": ["USER_ID_1", "USER_ID_2", "USER_ID_3"]
  }'
```

### Send a message

```bash
curl -X POST http://localhost:3000/api/v1/chats/CHAT_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "content": "Hey everyone! Ready for the match?",
    "messageType": "text"
  }'
```

### Get chat messages

```bash
curl -X GET "http://localhost:3000/api/v1/chats/CHAT_ID/messages?limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Add reaction to message

```bash
curl -X POST http://localhost:3000/api/v1/chats/messages/MESSAGE_ID/reactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "emoji": "👍"
  }'
```

## Match Examples

### Create a match

```bash
curl -X POST http://localhost:3000/api/v1/matches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '
  {
    "type": "public",
    "sport": "Tennis",
    "schedule": {
      "date": "2024-01-20T00:00:00.000Z",
      "time": "14:00",
      "timezone": "UTC"
    },
    "venue": "VENUE_ID",
    "rules": {
      "maxPlayers": 2,
      "format": "Singles"
    }
  }'
```

### Join a match

```bash
curl -X POST http://localhost:3000/api/v1/matches/MATCH_ID/join \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Tournament Examples

### Create a tournament

```bash
curl -X POST http://localhost:3000/api/v1/tournaments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Summer Tennis Championship",
    "sport": "Tennis",
    "startDate": "2024-02-01T00:00:00.000Z",
    "endDate": "2024-02-07T00:00:00.000Z",
    "maxParticipants": 16,
    "rules": {
      "format": "Single Elimination",
      "matchFormat": "Best of 3"
    }
  }'
```

## Notification Examples

### Get user notifications

```bash
curl -X GET "http://localhost:3000/api/v1/notifications?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Mark notification as read

```bash
curl -X POST http://localhost:3000/api/v1/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update notification preferences

```bash
curl -X PATCH http://localhost:3000/api/v1/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "emailNotifications": true,
    "pushNotifications": true,
    "types": ["match", "tournament", "chat"]
  }'
```

## WebSocket Examples

### JavaScript WebSocket Connection

```javascript
const socket = io('http://localhost:3000');

// Authenticate
socket.emit('authenticate', 'YOUR_ACCESS_TOKEN');

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data.user);
});

// Join a chat room
socket.emit('join-room', 'chat:CHAT_ID');

// Listen for new messages
socket.on('new-message', (message) => {
  console.log('New message:', message);
});

// Send a message
socket.emit('send-message', {
  roomId: 'chat:CHAT_ID',
  content: 'Hello everyone!',
  messageType: 'text'
});

// Listen for match updates
socket.on('match-updated', (update) => {
  console.log('Match update:', update);
});

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});
```

## Environment Variables

Make sure to set these environment variables in your `.env` file:

```bash
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
MONGODB_URI=mongodb://localhost:27017/sportificatoin

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Email (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Testing with Postman

Import the following collection to test all endpoints:

1. Download Postman
2. Create a new collection
3. Add the base URL: `http://localhost:3000/api/v1`
4. Set up environment variables for tokens and IDs
5. Use the examples above to create requests

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error message"],
  "code": "ERROR_CODE"
}
```

## Rate Limiting

The API implements rate limiting:

- 100 requests per 15 minutes per IP
- Authentication endpoints have stricter limits
- WebSocket connections are not rate limited

## Health Check

Check if the API is running:

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0",
  "uptime": 3600.5,
  "memory": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  },
  "nodejs": "v20.19.5"
}
```
