# Team Management

## Features

- Team creation and management
- Member management (add, remove)
- Role assignment (captain, player)
- Team chat integration
- Team notifications
- Captain transfer
- Team search and filtering
- Member capacity limits

## Endpoints

### Create Team

Create a new team with the authenticated user as captain.

- `POST /api/v1/teams` → Create a new team (requires auth)

**Request Body:**
```json
{
  "name": "The Champions",
  "description": "A competitive basketball team",
  "sport": "Basketball",
  "maxMembers": 10
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Team created successfully",
  "data": {
    "team": {
      "_id": "60d5ecb54b24a50015c4d9a0",
      "name": "The Champions",
      "description": "A competitive basketball team",
      "sport": "Basketball",
      "captain": {
        "_id": "60d5ecb54b24a50015c4d8a0",
        "profile": {
          "firstName": "John",
          "lastName": "Doe",
          "username": "johndoe"
        }
      },
      "members": [
        {
          "user": {
            "_id": "60d5ecb54b24a50015c4d8a0",
            "profile": {
              "firstName": "John",
              "lastName": "Doe",
              "username": "johndoe"
            }
          },
          "role": "captain",
          "joinedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "chat": {
        "_id": "60d5ecb54b24a50015c4d9a1",
        "type": "team",
        "name": "The Champions - Team Chat"
      },
      "maxMembers": 10,
      "isActive": true,
      "memberCount": 1,
      "isFull": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get Teams

Retrieve teams with optional filtering.

- `GET /api/v1/teams` → Get all teams with filters

**Query Parameters:**
- `sport` (optional): Filter by sport
- `search` (optional): Search by team name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response (200):**
```json
{
  "success": true,
  "message": "Teams retrieved successfully",
  "data": {
    "teams": [
      {
        "_id": "60d5ecb54b24a50015c4d9a0",
        "name": "The Champions",
        "sport": "Basketball",
        "captain": { "profile": { "username": "johndoe" } },
        "memberCount": 5,
        "isFull": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Get Team Details

Get detailed information about a specific team.

- `GET /api/v1/teams/:id` → Get team details

**Response (200):**
```json
{
  "success": true,
  "message": "Team retrieved successfully",
  "data": {
    "team": {
      "_id": "60d5ecb54b24a50015c4d9a0",
      "name": "The Champions",
      "description": "A competitive basketball team",
      "sport": "Basketball",
      "captain": {
        "_id": "60d5ecb54b24a50015c4d8a0",
        "profile": {
          "firstName": "John",
          "lastName": "Doe",
          "username": "johndoe"
        }
      },
      "members": [
        {
          "user": {
            "_id": "60d5ecb54b24a50015c4d8a0",
            "profile": {
              "firstName": "John",
              "lastName": "Doe",
              "username": "johndoe"
            }
          },
          "role": "captain",
          "joinedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "chat": {
        "_id": "60d5ecb54b24a50015c4d9a1",
        "type": "team",
        "name": "The Champions - Team Chat"
      },
      "memberCount": 5,
      "isFull": false
    }
  }
}
```

### Get My Teams

Get all teams for the authenticated user.

- `GET /api/v1/teams/my/teams` → Get user's teams (requires auth)

**Response (200):**
```json
{
  "success": true,
  "message": "User teams retrieved successfully",
  "data": {
    "teams": [
      {
        "_id": "60d5ecb54b24a50015c4d9a0",
        "name": "The Champions",
        "sport": "Basketball",
        "captain": { "profile": { "username": "johndoe" } },
        "members": [...],
        "memberCount": 5
      }
    ]
  }
}
```

### Update Team

Update team information (captain only).

- `PATCH /api/v1/teams/:id` → Update team (requires auth, captain only)

**Request Body:**
```json
{
  "name": "Champions United",
  "description": "Updated description",
  "sport": "Basketball",
  "maxMembers": 15
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Team updated successfully",
  "data": {
    "team": { ... }
  }
}
```

### Join Team

Join an existing team.

- `POST /api/v1/teams/:id/join` → Join team (requires auth)

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully joined team",
  "data": {
    "team": { ... }
  }
}
```

**Error Responses:**
- `400` - Team is full
- `400` - Already a member
- `400` - Team is not active
- `404` - Team not found

### Leave Team

Leave a team you're a member of.

- `POST /api/v1/teams/:id/leave` → Leave team (requires auth)

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully left team"
}
```

**Error Responses:**
- `400` - Not a member of the team
- `400` - Captain cannot leave (must transfer captaincy first)
- `404` - Team not found

### Remove Member

Remove a member from the team (captain only).

- `DELETE /api/v1/teams/:id/members/:userId` → Remove member (requires auth, captain only)

**Response (200):**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

**Error Responses:**
- `400` - User is not a member
- `400` - Cannot remove captain
- `403` - Only captain can remove members
- `404` - Team not found

### Update Member Role

Update a member's role (captain only).

- `PATCH /api/v1/teams/:id/members/:userId/role` → Update role (requires auth, captain only)

**Request Body:**
```json
{
  "role": "player"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Member role updated successfully",
  "data": {
    "team": { ... }
  }
}
```

**Valid Roles:**
- `captain` - Team captain with full management permissions
- `player` - Regular team member

### Transfer Captaincy

Transfer team captaincy to another member (captain only).

- `POST /api/v1/teams/:id/transfer-captaincy` → Transfer captaincy (requires auth, captain only)

**Request Body:**
```json
{
  "newCaptainId": "60d5ecb54b24a50015c4d8a1"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Captaincy transferred successfully",
  "data": {
    "team": { ... }
  }
}
```

**Error Responses:**
- `400` - New captain must be a team member
- `403` - Only captain can transfer captaincy
- `404` - Team not found

### Delete Team

Delete/deactivate a team (captain only).

- `DELETE /api/v1/teams/:id` → Delete team (requires auth, captain only)

**Response (200):**
```json
{
  "success": true,
  "message": "Team deleted successfully"
}
```

**Note:** Teams are soft-deleted (deactivated) rather than permanently removed.

## Team Roles

### Captain
- Full team management permissions
- Can update team information
- Can add/remove members
- Can update member roles
- Can transfer captaincy
- Can delete team
- Cannot leave team without transferring captaincy

### Player
- Regular team member
- Can participate in team activities
- Can access team chat
- Can leave team at any time
- No management permissions

## Team Chat

When a team is created, a dedicated team chat is automatically created with:
- Type: `team`
- Name: `{Team Name} - Team Chat`
- Participants: All team members
- Automatic member sync (members added/removed from team are synced to chat)

## Notifications

Team members receive notifications for:
- **New Member Joined**: When someone joins the team
- **Member Left**: When someone leaves the team
- **Member Removed**: When captain removes a member
- **Role Updated**: When their role changes
- **Captaincy Transferred**: When captaincy changes hands
- **Team Deleted**: When the team is deleted

## Notes on Auth/Security

### JWT Authentication Required
All team management endpoints (except GET teams list) require authentication:
```http
Authorization: Bearer <jwt_token>
```

### Permissions
- **Team Creator**: Becomes the captain and can manage team
- **Captain**: Full management permissions
- **Members**: Can view team details and leave team
- **Non-Members**: Can view team details and join if not full

### Validation Rules
- Team name: 2-100 characters
- Description: max 500 characters
- Sport: max 50 characters
- Max members: 2-50 (must be at least 2, cannot exceed 50)
- Captain must be a team member
- No duplicate members allowed

### Rate Limiting
- Team creation: **10 teams per hour per user**
- Team join: **20 joins per hour per user**
- Team operations: **100 requests per hour per user**

## Integration with Existing Features

### Chat System
- Teams automatically get a dedicated chat room
- Team chat type: `team`
- Members are automatically added/removed from chat when joining/leaving team
- Chat inherits team name

### Notification System
- All team events trigger notifications
- Notification type: `team`
- Links to related team entity
- Delivered in real-time via WebSocket

### Match & Tournament System
- Teams can participate in matches and tournaments (future feature)
- Team rosters are managed through this system
- Captain can register team for events

## Usage Examples

### Create and Manage a Team

```javascript
// Create team
const createTeam = async () => {
  const response = await fetch('/api/v1/teams', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Thunder Squad',
      description: 'Competitive basketball team',
      sport: 'Basketball',
      maxMembers: 10
    })
  });
  
  const data = await response.json();
  return data.data.team;
};

// Join a team
const joinTeam = async (teamId) => {
  const response = await fetch(`/api/v1/teams/${teamId}/join`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Update member role
const promoteToPlayer = async (teamId, userId) => {
  const response = await fetch(`/api/v1/teams/${teamId}/members/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'player'
    })
  });
  
  return await response.json();
};
```

### Search Teams

```javascript
// Search by sport
const searchTeams = async (sport) => {
  const response = await fetch(`/api/v1/teams?sport=${encodeURIComponent(sport)}&limit=10`);
  const data = await response.json();
  return data.data.teams;
};

// Search by name
const findTeamByName = async (searchTerm) => {
  const response = await fetch(`/api/v1/teams?search=${encodeURIComponent(searchTerm)}`);
  const data = await response.json();
  return data.data.teams;
};
```

## Best Practices

1. **Team Capacity**: Set reasonable max member limits based on sport type
2. **Captain Transfer**: Always transfer captaincy before leaving a team
3. **Member Management**: Remove inactive members to keep team roster current
4. **Team Chat**: Use team chat for coordination and communication
5. **Notifications**: Enable team notifications to stay updated on team events
6. **Search**: Use sport and search filters to find relevant teams
7. **Validation**: Ensure team names are descriptive and appropriate

## Troubleshooting

### Cannot Join Team
- Check if team is full
- Verify you're not already a member
- Ensure team is active

### Cannot Leave Team
- If you're captain, transfer captaincy first
- Verify you're actually a member

### Cannot Update Team
- Only captain can update team information
- Check authentication token is valid

### Member Not Receiving Notifications
- Verify notification preferences are enabled
- Check WebSocket connection is active
- Ensure user is a team member
