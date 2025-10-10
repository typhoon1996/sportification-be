# Integration Examples

Complete integration examples and code samples for the Sportification Backend.

## 📚 Available Examples

### 🏆 Team Integration

- **[Team Integration Example](team_integration_example.md)** - Complete workflow
  - User registration and authentication
  - Team creation and setup
  - Member invitation and management
  - Team chat integration
  - Match coordination
  - Real-time updates

---

## 🎯 Example Categories

### Authentication Flows

- User registration
- Login (email/password, OAuth)
- JWT token handling
- MFA setup and verification
- Password reset

### Team Management

- Creating a team
- Inviting members
- Managing roles (owner, captain, member)
- Team settings
- Member removal

### Social Features

- Friend requests
- User search
- Profile management
- Achievement tracking

### Real-time Features

- WebSocket connection
- Chat messaging
- Presence tracking
- Live match updates
- Notifications

### Match & Tournament

- Creating matches
- Joining matches
- Match results
- Tournament brackets
- Leaderboards

---

## 🚀 Quick Start Examples

### 1. User Registration & Login

**Register a new user:**

```typescript
// POST /api/auth/register
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    username: 'johndoe',
    displayName: 'John Doe'
  })
});

const { token, user } = await response.json();
```

**Login:**

```typescript
// POST /api/auth/login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!'
  })
});

const { token } = await response.json();
// Store token for subsequent requests
localStorage.setItem('authToken', token);
```

### 2. Create a Team

```typescript
// POST /api/teams
const response = await fetch('/api/teams', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Thunder FC',
    sport: 'football',
    description: 'Competitive football team',
    isPrivate: false
  })
});

const team = await response.json();
```

### 3. Send a Chat Message

```typescript
// POST /api/chats/:chatId/messages
const response = await fetch(`/api/chats/${chatId}/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    content: 'Hello team!',
    type: 'text'
  })
});

const message = await response.json();
```

### 4. WebSocket Connection

```typescript
import { io } from 'socket.io-client';

// Connect to WebSocket
const socket = io('http://localhost:3000', {
  auth: { token }
});

// Listen for messages
socket.on('message', (data) => {
  console.log('New message:', data);
});

// Send a message
socket.emit('sendMessage', {
  chatId: 'chat-id',
  content: 'Hello!',
  type: 'text'
});
```

---

## 📖 Complete Workflows

### Team Creation Workflow

**Full example: [Team Integration Example](team_integration_example.md)**

1. **Register/Login** → Get authentication token
2. **Create Team** → Set up team profile
3. **Invite Members** → Send invitations via email
4. **Setup Team Chat** → Create team communication channel
5. **Create Match** → Organize team matches
6. **Manage Roster** → Handle member roles and permissions

### Match Organization Workflow

1. **Create Venue** → Set match location
2. **Create Match** → Set up match details
3. **Invite Players** → Send match invitations
4. **Track RSVPs** → Monitor attendance
5. **Start Match** → Begin match tracking
6. **Update Score** → Real-time score updates
7. **End Match** → Finalize results

---

## 🧪 Testing Examples

### Using cURL

```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "username": "testuser"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Get user profile (authenticated)
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import the OpenAPI spec: `openapi.yaml`
2. Set up environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `token`: Your JWT token
3. Use pre-request scripts for authentication
4. Test complete workflows

---

## 💡 Best Practices

### Authentication

✅ **Always validate tokens** before requests
✅ **Handle token expiration** gracefully
✅ **Store tokens securely** (httpOnly cookies or secure storage)
✅ **Implement token refresh** for better UX
❌ Don't store tokens in localStorage (XSS risk)
❌ Don't include sensitive data in URLs

### Error Handling

```typescript
try {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const result = await response.json();
  return result;
} catch (error) {
  console.error('API Error:', error);
  // Handle error appropriately
}
```

### Real-time Updates

✅ **Handle reconnection** logic
✅ **Implement heartbeat** for connection health
✅ **Buffer messages** during disconnection
✅ **Clean up listeners** on unmount
❌ Don't create multiple socket connections
❌ Don't forget to disconnect on cleanup

---

## 🔗 Related Documentation

### API Reference

- **[API Documentation](../api/API_DOCUMENTATION.md)** - Full API reference
- **[WebSocket API](../features/websockets.md)** - Real-time API details

### Feature Guides

- **[Authentication](../features/auth.md)** - Auth system details
- **[Teams](../features/teams.md)** - Team management
- **[Chat](../features/chat.md)** - Chat system
- **[Matches](../features/matches.md)** - Match system

### Developer Guides

- **[Onboarding Guide](../guides/ONBOARDING.md)** - Getting started
- **[Project Structure](../guides/PROJECT_STRUCTURE.md)** - Architecture

---

## 📝 Contributing Examples

Have a great integration example to share?

1. **Create a new markdown file** with your example
2. **Follow the structure** of existing examples
3. **Include code samples** that are tested and working
4. **Add explanations** for each step
5. **Submit a pull request**

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

---

## 📞 Need Help?

### Resources

- Check existing examples above
- Review [API Documentation](../api/API_DOCUMENTATION.md)
- Study [Feature Documentation](../features/)
- Ask in discussions

### Example Requests

Missing an example? Request it by:

1. Opening an issue with "Example Request" label
2. Describing the integration scenario
3. Providing use case details

---

**[⬆ Back to Documentation](../README.md)**
