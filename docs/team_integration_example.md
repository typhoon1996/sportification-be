# Team Management Integration Example

## Complete Team Workflow

This example demonstrates the complete team management workflow integrated with the existing system.

### 1. User Registration
```bash
# Create first user (will become team captain)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "captain@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Smith",
    "username": "captain_john"
  }'

# Create second user (will join as player)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "password": "SecurePass123",
    "firstName": "Jane",
    "lastName": "Doe",
    "username": "player_jane"
  }'
```

### 2. Login and Get Token
```bash
# Login as captain
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "captain@example.com",
    "password": "SecurePass123"
  }'

# Save the JWT token from response
export CAPTAIN_TOKEN="your_jwt_token_here"
```

### 3. Create Team
```bash
# Create a new basketball team
curl -X POST http://localhost:3000/api/v1/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  -d '{
    "name": "Thunder Squad",
    "description": "Competitive basketball team for league play",
    "sport": "Basketball",
    "maxMembers": 12
  }'

# Response includes:
# - Team details
# - Captain information
# - Automatically created team chat
# - Initial member (captain)
```

### 4. Second User Joins Team
```bash
# Login as player
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "password": "SecurePass123"
  }'

# Save token
export PLAYER_TOKEN="player_jwt_token"

# Join the team
curl -X POST http://localhost:3000/api/v1/teams/{teamId}/join \
  -H "Authorization: Bearer $PLAYER_TOKEN"

# Notifications sent:
# - Captain receives "New member joined" notification
# - Player automatically added to team chat
```

### 5. Captain Manages Team
```bash
# Update team information
curl -X PATCH http://localhost:3000/api/v1/teams/{teamId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  -d '{
    "description": "Updated: Premier competitive basketball team",
    "maxMembers": 15
  }'

# Update member role (if needed)
curl -X PATCH http://localhost:3000/api/v1/teams/{teamId}/members/{userId}/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  -d '{
    "role": "player"
  }'
```

### 6. Team Communication
```bash
# Get team chat
curl -X GET http://localhost:3000/api/v1/chats \
  -H "Authorization: Bearer $CAPTAIN_TOKEN"

# Send message in team chat
curl -X POST http://localhost:3000/api/v1/chats/{chatId}/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  -d '{
    "content": "Team practice tomorrow at 6 PM!",
    "messageType": "text"
  }'

# All team members receive message in real-time via WebSocket
```

### 7. Search and Browse Teams
```bash
# Search teams by sport
curl -X GET "http://localhost:3000/api/v1/teams?sport=Basketball&limit=10"

# Search by name
curl -X GET "http://localhost:3000/api/v1/teams?search=Thunder"

# Get user's teams
curl -X GET http://localhost:3000/api/v1/teams/my/teams \
  -H "Authorization: Bearer $PLAYER_TOKEN"
```

### 8. Team Notifications (Real-time)

When actions occur, notifications are automatically sent:

**Member joins:**
```json
{
  "type": "team",
  "title": "New Team Member",
  "message": "A new member has joined your team: Thunder Squad",
  "relatedEntity": {
    "type": "team",
    "id": "team_id"
  }
}
```

**Captain transfers:**
```json
{
  "type": "team",
  "title": "Team Captain",
  "message": "You are now the captain of team: Thunder Squad",
  "relatedEntity": {
    "type": "team",
    "id": "team_id"
  }
}
```

### 9. Transfer Captaincy
```bash
# Current captain transfers to another member
curl -X POST http://localhost:3000/api/v1/teams/{teamId}/transfer-captaincy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  -d '{
    "newCaptainId": "player_user_id"
  }'

# Old captain becomes player
# New captain gets notification
# All members notified of leadership change
```

### 10. Integration with Matches/Tournaments

Once teams are created, they can participate in matches and tournaments:

```bash
# Create match with team participation (future feature)
curl -X POST http://localhost:3000/api/v1/matches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  -d '{
    "type": "public",
    "sport": "Basketball",
    "teamId": "team_id",
    "schedule": {
      "date": "2024-02-01T00:00:00.000Z",
      "time": "18:00",
      "timezone": "UTC"
    }
  }'
```

## WebSocket Events

Team-related real-time events:

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000', {
  auth: { token: 'your_jwt_token' }
});

// Listen for team notifications
socket.on('notification', (notification) => {
  if (notification.type === 'team') {
    console.log('Team notification:', notification);
    // Update UI with team event
  }
});

// Listen for team chat messages
socket.on('message', (message) => {
  if (message.chat.type === 'team') {
    console.log('Team message:', message);
    // Display in team chat
  }
});
```

## Key Features Demonstrated

1. **Team Lifecycle**: Creation, management, and member operations
2. **Automatic Chat**: Team chat created and synced automatically
3. **Real-time Notifications**: All team events trigger notifications
4. **Role Management**: Captain can manage roles and transfer leadership
5. **Search & Discovery**: Find teams by sport or name
6. **Integration**: Works with existing auth, chat, and notification systems
7. **WebSocket Support**: Real-time updates for chat and notifications

## Security Features

- JWT authentication required for team operations
- Captain-only operations protected
- Member validation before operations
- Input validation on all endpoints
- Rate limiting on team creation and operations

## Extendability

The team system is designed for future expansion:
- Team participation in matches and tournaments
- Team statistics and achievements
- Team roster management for events
- Team-level permissions and roles
- Team invitations system
- Team rankings and leaderboards
