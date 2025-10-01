# Tournament System

## Features

- Create and manage tournaments
- Tournament registration (join/leave)
- Bracket generation and management
- Tournament standings and rankings
- Match scheduling within tournaments
- Tournament status management
- Single and double elimination formats
- Round-robin tournaments
- Tournament search and filtering

## Endpoints

### Tournament Management

- `POST /api/v1/tournaments` → Create a new tournament (requires auth)
- `GET /api/v1/tournaments` → Get all tournaments with optional filtering
- `GET /api/v1/tournaments/:id` → Get specific tournament details by ID
- `PUT /api/v1/tournaments/:id` → Update tournament details (requires auth, creator only)
- `DELETE /api/v1/tournaments/:id` → Delete a tournament (requires auth, creator only)

### Tournament Participation

- `POST /api/v1/tournaments/:id/join` → Register for a tournament (requires auth)
- `DELETE /api/v1/tournaments/:id/join` → Leave/unregister from tournament (requires auth)

### Tournament Operations

- `POST /api/v1/tournaments/:id/start` → Start tournament and generate brackets (requires auth, creator only)
- `GET /api/v1/tournaments/:id/bracket` → Get tournament bracket
- `PUT /api/v1/tournaments/:id/bracket` → Update bracket (advance winners) (requires auth)
- `GET /api/v1/tournaments/:id/standings` → Get current standings/rankings

### User Tournaments

- `GET /api/v1/tournaments/user/:userId` → Get tournaments for a specific user

## Request/Response Examples

### Create Tournament

**Request:**
```http
POST /api/v1/tournaments
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Summer Tennis Championship 2024",
  "sport": "tennis",
  "startDate": "2024-02-01T00:00:00.000Z",
  "endDate": "2024-02-07T00:00:00.000Z",
  "maxParticipants": 16,
  "format": "single-elimination",
  "rules": {
    "matchFormat": "Best of 3 sets",
    "scoring": "Standard tennis scoring"
  },
  "venue": "60d5ecb54b24a50015c4d3a0",
  "description": "Annual summer tennis tournament for intermediate players",
  "skillLevel": "intermediate",
  "registrationDeadline": "2024-01-28T23:59:59.000Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "tournament": {
      "_id": "60d5ecb54b24a50015c4d5a0",
      "name": "Summer Tennis Championship 2024",
      "sport": "tennis",
      "creator": {
        "_id": "60d5ecb54b24a50015c4d1a0",
        "username": "johndoe",
        "firstName": "John"
      },
      "startDate": "2024-02-01T00:00:00.000Z",
      "endDate": "2024-02-07T00:00:00.000Z",
      "maxParticipants": 16,
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "username": "johndoe",
          "firstName": "John"
        }
      ],
      "participantCount": 1,
      "format": "single-elimination",
      "status": "registration",
      "rules": {
        "matchFormat": "Best of 3 sets",
        "scoring": "Standard tennis scoring"
      },
      "venue": {
        "_id": "60d5ecb54b24a50015c4d3a0",
        "name": "City Tennis Complex"
      },
      "description": "Annual summer tennis tournament for intermediate players",
      "skillLevel": "intermediate",
      "registrationDeadline": "2024-01-28T23:59:59.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Tournament created successfully"
}
```

### Get All Tournaments

**Request:**
```http
GET /api/v1/tournaments?sport=tennis&status=registration&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tournaments": [
      {
        "_id": "60d5ecb54b24a50015c4d5a0",
        "name": "Summer Tennis Championship 2024",
        "sport": "tennis",
        "creator": {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "username": "johndoe",
          "firstName": "John"
        },
        "startDate": "2024-02-01T00:00:00.000Z",
        "endDate": "2024-02-07T00:00:00.000Z",
        "maxParticipants": 16,
        "participantCount": 8,
        "format": "single-elimination",
        "status": "registration",
        "skillLevel": "intermediate",
        "registrationDeadline": "2024-01-28T23:59:59.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 23,
    "pages": 3
  }
}
```

### Get Tournament by ID

**Request:**
```http
GET /api/v1/tournaments/60d5ecb54b24a50015c4d5a0
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tournament": {
      "_id": "60d5ecb54b24a50015c4d5a0",
      "name": "Summer Tennis Championship 2024",
      "sport": "tennis",
      "creator": {
        "_id": "60d5ecb54b24a50015c4d1a0",
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": "https://example.com/avatars/johndoe.jpg"
        }
      },
      "startDate": "2024-02-01T00:00:00.000Z",
      "endDate": "2024-02-07T00:00:00.000Z",
      "maxParticipants": 16,
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "username": "johndoe",
          "firstName": "John",
          "lastName": "Doe",
          "stats": {
            "winRate": 75
          }
        },
        {
          "_id": "60d5ecb54b24a50015c4d1a1",
          "username": "janedoe",
          "firstName": "Jane",
          "lastName": "Doe",
          "stats": {
            "winRate": 82
          }
        }
      ],
      "participantCount": 2,
      "format": "single-elimination",
      "status": "registration",
      "rules": {
        "matchFormat": "Best of 3 sets",
        "scoring": "Standard tennis scoring"
      },
      "venue": {
        "_id": "60d5ecb54b24a50015c4d3a0",
        "name": "City Tennis Complex",
        "location": {
          "address": "456 Sports Blvd, New York"
        }
      },
      "description": "Annual summer tennis tournament for intermediate players",
      "skillLevel": "intermediate",
      "registrationDeadline": "2024-01-28T23:59:59.000Z",
      "chat": "60d5ecb54b24a50015c4d4a5",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Join Tournament

**Request:**
```http
POST /api/v1/tournaments/60d5ecb54b24a50015c4d5a0/join
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully registered for tournament",
  "data": {
    "tournament": {
      "_id": "60d5ecb54b24a50015c4d5a0",
      "participantCount": 9
    }
  }
}
```

### Leave Tournament

**Request:**
```http
DELETE /api/v1/tournaments/60d5ecb54b24a50015c4d5a0/join
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully unregistered from tournament"
}
```

### Start Tournament

**Request:**
```http
POST /api/v1/tournaments/60d5ecb54b24a50015c4d5a0/start
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tournament started and bracket generated",
  "data": {
    "tournament": {
      "_id": "60d5ecb54b24a50015c4d5a0",
      "status": "active",
      "currentRound": 1,
      "startedAt": "2024-02-01T10:00:00.000Z"
    },
    "bracket": {
      "rounds": [
        {
          "round": 1,
          "matches": [
            {
              "_id": "60d5ecb54b24a50015c4d6a0",
              "player1": "60d5ecb54b24a50015c4d1a0",
              "player2": "60d5ecb54b24a50015c4d1a1",
              "status": "upcoming"
            }
          ]
        }
      ]
    }
  }
}
```

### Get Tournament Bracket

**Request:**
```http
GET /api/v1/tournaments/60d5ecb54b24a50015c4d5a0/bracket
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bracket": {
      "format": "single-elimination",
      "currentRound": 2,
      "totalRounds": 4,
      "rounds": [
        {
          "round": 1,
          "name": "Round of 16",
          "matches": [
            {
              "_id": "60d5ecb54b24a50015c4d6a0",
              "player1": {
                "_id": "60d5ecb54b24a50015c4d1a0",
                "username": "johndoe",
                "firstName": "John"
              },
              "player2": {
                "_id": "60d5ecb54b24a50015c4d1a1",
                "username": "janedoe",
                "firstName": "Jane"
              },
              "status": "completed",
              "winner": "60d5ecb54b24a50015c4d1a0",
              "score": "6-4, 6-3"
            }
          ]
        },
        {
          "round": 2,
          "name": "Quarterfinals",
          "matches": [
            {
              "_id": "60d5ecb54b24a50015c4d6a1",
              "player1": {
                "_id": "60d5ecb54b24a50015c4d1a0",
                "username": "johndoe",
                "firstName": "John"
              },
              "player2": null,
              "status": "upcoming"
            }
          ]
        }
      ]
    }
  }
}
```

### Update Tournament Bracket

**Request:**
```http
PUT /api/v1/tournaments/60d5ecb54b24a50015c4d5a0/bracket
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "matchId": "60d5ecb54b24a50015c4d6a1",
  "winner": "60d5ecb54b24a50015c4d1a0",
  "score": "6-2, 7-5"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Bracket updated successfully",
  "data": {
    "match": {
      "_id": "60d5ecb54b24a50015c4d6a1",
      "status": "completed",
      "winner": "60d5ecb54b24a50015c4d1a0",
      "score": "6-2, 7-5"
    }
  }
}
```

### Get Tournament Standings

**Request:**
```http
GET /api/v1/tournaments/60d5ecb54b24a50015c4d5a0/standings
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "standings": [
      {
        "rank": 1,
        "player": {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "username": "johndoe",
          "firstName": "John",
          "lastName": "Doe"
        },
        "matchesPlayed": 3,
        "wins": 3,
        "losses": 0,
        "setsWon": 6,
        "setsLost": 2,
        "status": "active"
      },
      {
        "rank": 2,
        "player": {
          "_id": "60d5ecb54b24a50015c4d1a2",
          "username": "mikewilson",
          "firstName": "Mike",
          "lastName": "Wilson"
        },
        "matchesPlayed": 3,
        "wins": 2,
        "losses": 1,
        "setsWon": 5,
        "setsLost": 3,
        "status": "eliminated"
      }
    ]
  }
}
```

### Update Tournament

**Request:**
```http
PUT /api/v1/tournaments/60d5ecb54b24a50015c4d5a0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "description": "Updated: Annual summer tennis tournament with prizes",
  "registrationDeadline": "2024-01-30T23:59:59.000Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tournament updated successfully",
  "data": {
    "tournament": {
      "_id": "60d5ecb54b24a50015c4d5a0",
      "description": "Updated: Annual summer tennis tournament with prizes",
      "registrationDeadline": "2024-01-30T23:59:59.000Z",
      "updatedAt": "2024-01-16T10:00:00.000Z"
    }
  }
}
```

### Delete Tournament

**Request:**
```http
DELETE /api/v1/tournaments/60d5ecb54b24a50015c4d5a0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tournament deleted successfully"
}
```

### Get User Tournaments

**Request:**
```http
GET /api/v1/tournaments/user/60d5ecb54b24a50015c4d1a0?status=active
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tournaments": [
      {
        "_id": "60d5ecb54b24a50015c4d5a0",
        "name": "Summer Tennis Championship 2024",
        "sport": "tennis",
        "status": "active",
        "currentRound": 2,
        "userStatus": "active",
        "nextMatch": {
          "_id": "60d5ecb54b24a50015c4d6a3",
          "opponent": {
            "_id": "60d5ecb54b24a50015c4d1a3",
            "username": "sarahsmith",
            "firstName": "Sarah"
          },
          "scheduledFor": "2024-02-03T14:00:00.000Z"
        }
      }
    ]
  }
}
```

## Query Parameters

### Get All Tournaments (`/tournaments`)
- `sport` - Filter by sport type
- `status` - Filter by status (registration, active, completed, cancelled)
- `startDate` - Filter by start date (ISO 8601 format)
- `format` - Filter by format (single-elimination, double-elimination, round-robin)
- `skillLevel` - Filter by skill level
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Results per page

### Get User Tournaments (`/tournaments/user/:userId`)
- `status` - Filter by status (registration, active, completed)
- `sport` - Filter by sport type
- `page` (default: 1) - Page number
- `limit` (default: 10, max: 50) - Results per page

## Notes on Auth/Security

### JWT Authentication
- **Required for**: Creating, updating, deleting tournaments, joining/leaving, starting tournaments, updating brackets
- **Optional for**: Viewing tournaments and brackets

```http
Authorization: Bearer <jwt_token>
```

### Permissions
- **Tournament Creator**: Full control (update, delete, start, manage bracket)
- **Participants**: Can leave tournament (before it starts), view bracket
- **Anyone**: Can view public tournaments

### Tournament Lifecycle
1. **Registration**: Open for player registration until deadline
2. **Active**: Tournament in progress with live brackets
3. **Completed**: Tournament finished with final standings
4. **Cancelled**: Tournament cancelled by creator

### Constraints
- Cannot join after registration deadline
- Cannot leave after tournament starts
- Bracket locked once tournament starts
- Minimum participants required (typically 4 for elimination, 2 for round-robin)

### Rate Limiting
- Tournament creation: **5 tournaments per day per user**
- Tournament queries: **100 requests per 15 minutes**

## Real-time Requirements

### WebSocket Events

**Player Registered:**
```javascript
socket.on('tournament-player-registered', (data) => {
  console.log(`${data.player.username} registered for ${data.tournamentId}`);
  // Update participant count
});
```

**Tournament Started:**
```javascript
socket.on('tournament-started', (data) => {
  console.log(`Tournament ${data.tournamentId} has started`);
  // Navigate to bracket view
});
```

**Bracket Updated:**
```javascript
socket.on('tournament-bracket-updated', (data) => {
  console.log(`Bracket updated: Round ${data.round} match completed`);
  // Refresh bracket display
});
```

**Match Scheduled:**
```javascript
socket.on('tournament-match-scheduled', (data) => {
  console.log(`Your match in ${data.tournamentName} scheduled for ${data.time}`);
  // Show notification
});
```

**Tournament Completed:**
```javascript
socket.on('tournament-completed', (data) => {
  console.log(`Tournament ${data.tournamentId} completed. Winner: ${data.winner.username}`);
  // Show final standings
});
```

### Push Notifications
- Tournament registration confirmation
- Tournament start notification (1 day before)
- Match schedule notifications
- Bracket advancement notifications
- Tournament completion with final standings

### Calendar Sync
- Export tournament schedule to calendar
- Individual match events added automatically
- Tournament date range synced to Google/Apple Calendar
