# Match Management

## Features

- Create and manage sports matches
- Join and leave matches
- Match scheduling and venue assignment
- Score tracking and match results
- Match status management (upcoming, active, completed, cancelled)
- Player capacity management
- Match search and filtering
- User match history
- Public and private matches

## Endpoints

### Match Management

- `POST /api/v1/matches` → Create a new match (requires auth)
- `GET /api/v1/matches` → Get all matches with optional filtering
- `GET /api/v1/matches/:id` → Get specific match details by ID
- `PUT /api/v1/matches/:id` → Update match details (requires auth, creator only)
- `DELETE /api/v1/matches/:id` → Delete a match (requires auth, creator only)

### Match Participation

- `POST /api/v1/matches/:id/join` → Join a match (requires auth)
- `DELETE /api/v1/matches/:id/join` → Leave a match (requires auth)

### Match Scoring & Status

- `PUT /api/v1/matches/:id/score` → Update match score (requires auth)
- `PUT /api/v1/matches/:id/status` → Update match status (requires auth, creator only)

### User Matches

- `GET /api/v1/matches/user/:userId` → Get matches for a specific user

## Request/Response Examples

### Create Match

**Request:**
```http
POST /api/v1/matches
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "type": "public",
  "sport": "football",
  "schedule": {
    "date": "2024-01-20T00:00:00.000Z",
    "time": "18:00",
    "timezone": "UTC"
  },
  "venue": "60d5ecb54b24a50015c4d3a0",
  "maxPlayers": 10,
  "description": "Friendly football match at Central Park",
  "skillLevel": "intermediate"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "match": {
      "_id": "60d5ecb54b24a50015c4d2a0",
      "type": "public",
      "sport": "football",
      "creator": {
        "_id": "60d5ecb54b24a50015c4d1a0",
        "username": "johndoe",
        "firstName": "John"
      },
      "schedule": {
        "date": "2024-01-20T00:00:00.000Z",
        "time": "18:00",
        "timezone": "UTC"
      },
      "venue": {
        "_id": "60d5ecb54b24a50015c4d3a0",
        "name": "Central Park Football Field",
        "location": {
          "address": "Central Park, New York"
        }
      },
      "maxPlayers": 10,
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "username": "johndoe",
          "firstName": "John"
        }
      ],
      "participantCount": 1,
      "status": "upcoming",
      "description": "Friendly football match at Central Park",
      "skillLevel": "intermediate",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Match created successfully"
}
```

### Get All Matches

**Request:**
```http
GET /api/v1/matches?sport=tennis&status=upcoming&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "_id": "60d5ecb54b24a50015c4d2a1",
        "type": "public",
        "sport": "tennis",
        "creator": {
          "_id": "60d5ecb54b24a50015c4d1a1",
          "username": "janedoe",
          "firstName": "Jane"
        },
        "schedule": {
          "date": "2024-01-18T00:00:00.000Z",
          "time": "14:00",
          "timezone": "UTC"
        },
        "venue": {
          "_id": "60d5ecb54b24a50015c4d3a1",
          "name": "City Tennis Courts",
          "location": {
            "address": "123 Sports Ave, New York"
          }
        },
        "maxPlayers": 4,
        "participantCount": 2,
        "status": "upcoming",
        "skillLevel": "intermediate",
        "description": "Doubles tennis match"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

### Get Match by ID

**Request:**
```http
GET /api/v1/matches/60d5ecb54b24a50015c4d2a0
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "match": {
      "_id": "60d5ecb54b24a50015c4d2a0",
      "type": "public",
      "sport": "football",
      "creator": {
        "_id": "60d5ecb54b24a50015c4d1a0",
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": "https://example.com/avatars/johndoe.jpg"
        }
      },
      "schedule": {
        "date": "2024-01-20T00:00:00.000Z",
        "time": "18:00",
        "timezone": "UTC"
      },
      "venue": {
        "_id": "60d5ecb54b24a50015c4d3a0",
        "name": "Central Park Football Field",
        "location": {
          "lat": 40.7829,
          "lng": -73.9654,
          "address": "Central Park, New York"
        },
        "surfaceType": "grass"
      },
      "maxPlayers": 10,
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "username": "johndoe",
          "firstName": "John",
          "lastName": "Doe"
        },
        {
          "_id": "60d5ecb54b24a50015c4d1a2",
          "username": "mikewilson",
          "firstName": "Mike",
          "lastName": "Wilson"
        }
      ],
      "participantCount": 2,
      "status": "upcoming",
      "description": "Friendly football match at Central Park",
      "skillLevel": "intermediate",
      "chat": "60d5ecb54b24a50015c4d4a0",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Join Match

**Request:**
```http
POST /api/v1/matches/60d5ecb54b24a50015c4d2a0/join
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully joined match",
  "data": {
    "match": {
      "_id": "60d5ecb54b24a50015c4d2a0",
      "participantCount": 3,
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "username": "johndoe"
        },
        {
          "_id": "60d5ecb54b24a50015c4d1a2",
          "username": "mikewilson"
        },
        {
          "_id": "60d5ecb54b24a50015c4d1a3",
          "username": "sarahsmith"
        }
      ]
    }
  }
}
```

### Leave Match

**Request:**
```http
DELETE /api/v1/matches/60d5ecb54b24a50015c4d2a0/join
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully left match"
}
```

### Update Match Score

**Request:**
```http
PUT /api/v1/matches/60d5ecb54b24a50015c4d2a0/score
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "score": {
    "team1": 3,
    "team2": 2
  },
  "winner": "60d5ecb54b24a50015c4d1a0",
  "details": "Close match, well played by both teams"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Match score updated successfully",
  "data": {
    "match": {
      "_id": "60d5ecb54b24a50015c4d2a0",
      "status": "completed",
      "result": {
        "score": {
          "team1": 3,
          "team2": 2
        },
        "winner": "60d5ecb54b24a50015c4d1a0",
        "details": "Close match, well played by both teams"
      }
    }
  }
}
```

### Update Match Status

**Request:**
```http
PUT /api/v1/matches/60d5ecb54b24a50015c4d2a0/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "active"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Match status updated to active",
  "data": {
    "match": {
      "_id": "60d5ecb54b24a50015c4d2a0",
      "status": "active",
      "startedAt": "2024-01-20T18:00:00.000Z"
    }
  }
}
```

### Update Match

**Request:**
```http
PUT /api/v1/matches/60d5ecb54b24a50015c4d2a0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "schedule": {
    "date": "2024-01-22T00:00:00.000Z",
    "time": "19:00",
    "timezone": "UTC"
  },
  "description": "Rescheduled friendly football match"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Match updated successfully",
  "data": {
    "match": {
      "_id": "60d5ecb54b24a50015c4d2a0",
      "schedule": {
        "date": "2024-01-22T00:00:00.000Z",
        "time": "19:00",
        "timezone": "UTC"
      },
      "description": "Rescheduled friendly football match",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

### Delete Match

**Request:**
```http
DELETE /api/v1/matches/60d5ecb54b24a50015c4d2a0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Match deleted successfully"
}
```

### Get User Matches

**Request:**
```http
GET /api/v1/matches/user/60d5ecb54b24a50015c4d1a0?status=completed&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "_id": "60d5ecb54b24a50015c4d2a5",
        "sport": "tennis",
        "schedule": {
          "date": "2024-01-10T00:00:00.000Z",
          "time": "14:00"
        },
        "status": "completed",
        "result": {
          "winner": "60d5ecb54b24a50015c4d1a0",
          "score": {
            "team1": 6,
            "team2": 4
          }
        },
        "participants": [
          {
            "_id": "60d5ecb54b24a50015c4d1a0",
            "username": "johndoe"
          },
          {
            "_id": "60d5ecb54b24a50015c4d1a3",
            "username": "mikewilson"
          }
        ]
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

## Query Parameters

### Get All Matches (`/matches`)
- `sport` - Filter by sport type (football, tennis, basketball, etc.)
- `status` - Filter by status (upcoming, active, completed, cancelled)
- `date` - Filter by date (ISO 8601 format)
- `location` - Filter by location/city
- `skillLevel` - Filter by skill level (beginner, intermediate, advanced, expert)
- `type` - Filter by type (public, private)
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Results per page

### Get User Matches (`/matches/user/:userId`)
- `status` - Filter by status (upcoming, active, completed, cancelled)
- `sport` - Filter by sport type
- `page` (default: 1) - Page number
- `limit` (default: 10, max: 50) - Results per page

## Notes on Auth/Security

### JWT Authentication
- **Required for**: Creating, updating, deleting matches, joining/leaving matches
- **Optional for**: Viewing matches (public matches visible to all, private matches require auth)

```http
Authorization: Bearer <jwt_token>
```

### Permissions
- **Match Creator**: Can update, delete, and change status of their matches
- **Participants**: Can leave matches and update scores (if enabled)
- **Anyone**: Can view public matches and join if capacity allows

### Match Capacity
- System automatically prevents joining if match is full
- `maxPlayers` defines participant limit
- Creator counts as first participant

### Rate Limiting
- Match creation: **10 matches per hour per user**
- Match queries: **100 requests per 15 minutes**

## Real-time Requirements

### WebSocket Events

**Player Joined Match:**
```javascript
socket.on('player-joined', (data) => {
  console.log(`${data.player.username} joined match ${data.matchId}`);
  // Update participant list in UI
});
```

**Player Left Match:**
```javascript
socket.on('player-left', (data) => {
  console.log(`${data.player.username} left match ${data.matchId}`);
  // Update participant list in UI
});
```

**Match Updated:**
```javascript
socket.on('match-updated', (data) => {
  console.log(`Match ${data.matchId} updated:`, data.changes);
  // Refresh match details
});
```

**Match Status Changed:**
```javascript
socket.on('match-status-changed', (data) => {
  console.log(`Match ${data.matchId} status: ${data.status}`);
  // data.status: 'upcoming' | 'active' | 'completed' | 'cancelled'
});
```

**Match Started:**
```javascript
socket.on('match-started', (data) => {
  console.log(`Match ${data.matchId} has started`);
  // Navigate to live match view
});
```

**Match Completed:**
```javascript
socket.on('match-completed', (data) => {
  console.log(`Match ${data.matchId} completed. Winner: ${data.winner}`);
  // Show results screen
});
```

### Push Notifications
- Match invitation notifications
- Match reminder (1 hour before start)
- Match update notifications (time/venue changes)
- Match start notifications
- Match completion with results

### Calendar Sync
- Export match to Google Calendar: `GET /api/v1/matches/:id/calendar?provider=google`
- Export match to Apple Calendar: `GET /api/v1/matches/:id/calendar?provider=apple`
- Download iCal file: `GET /api/v1/matches/:id/calendar?format=ical`
