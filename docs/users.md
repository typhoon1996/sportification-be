# User Profile & Social Features

## Features

- User profile management
- User search and discovery
- Follow/unfollow system
- Followers and following lists
- User statistics and achievements
- Match history
- Social connections

## Endpoints

### Profile Management

- `GET /api/v1/users/profile` → Get current user profile (requires auth)
- `PUT /api/v1/users/profile` → Update current user profile (requires auth)

### User Discovery

- `GET /api/v1/users/search` → Search for users by username, name, or sport (requires auth)
- `GET /api/v1/users/:id` → Get specific user profile by ID

### Social Features

- `POST /api/v1/users/:id/follow` → Follow a user (requires auth)
- `DELETE /api/v1/users/:id/follow` → Unfollow a user (requires auth)
- `GET /api/v1/users/:id/followers` → Get user's followers list
- `GET /api/v1/users/:id/following` → Get list of users this user follows

### User Statistics

- `GET /api/v1/users/:id/matches` → Get user's match history
- `GET /api/v1/users/:id/achievements` → Get user's achievements and badges

## Request/Response Examples

### Get Current User Profile

**Request:**
```http
GET /api/v1/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60d5ecb54b24a50015c4d1a0",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "profile": {
        "bio": "Tennis enthusiast",
        "avatar": "https://example.com/avatars/johndoe.jpg",
        "location": "New York, NY",
        "sports": ["tennis", "basketball"],
        "skillLevel": "intermediate"
      },
      "stats": {
        "matchesPlayed": 25,
        "matchesWon": 18,
        "winRate": 72,
        "tournamentsJoined": 5,
        "tournamentsWon": 2,
        "followers": 120,
        "following": 85
      },
      "createdAt": "2024-01-01T10:30:00.000Z"
    }
  }
}
```

### Update User Profile

**Request:**
```http
PUT /api/v1/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "bio": "Professional tennis player and coach",
  "location": {
    "city": "Los Angeles",
    "country": "USA"
  },
  "preferences": {
    "sports": ["tennis", "basketball", "volleyball"],
    "skillLevel": "advanced",
    "availability": ["weekends", "evenings"]
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60d5ecb54b24a50015c4d1a0",
      "firstName": "John",
      "lastName": "Smith",
      "profile": {
        "bio": "Professional tennis player and coach",
        "location": {
          "city": "Los Angeles",
          "country": "USA"
        },
        "sports": ["tennis", "basketball", "volleyball"],
        "skillLevel": "advanced"
      },
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  },
  "message": "Profile updated successfully"
}
```

### Search Users

**Request:**
```http
GET /api/v1/users/search?q=john&sport=tennis&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "60d5ecb54b24a50015c4d1a0",
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": "https://example.com/avatars/johndoe.jpg",
          "location": "New York, NY",
          "sports": ["tennis", "basketball"],
          "skillLevel": "intermediate"
        },
        "stats": {
          "matchesPlayed": 25,
          "winRate": 72
        }
      },
      {
        "_id": "60d5ecb54b24a50015c4d1a1",
        "username": "johnsmith",
        "firstName": "John",
        "lastName": "Smith",
        "profile": {
          "avatar": "https://example.com/avatars/johnsmith.jpg",
          "location": "Boston, MA",
          "sports": ["tennis"],
          "skillLevel": "advanced"
        },
        "stats": {
          "matchesPlayed": 50,
          "winRate": 85
        }
      }
    ]
  }
}
```

### Get User by ID

**Request:**
```http
GET /api/v1/users/60d5ecb54b24a50015c4d1a0
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60d5ecb54b24a50015c4d1a0",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "profile": {
        "bio": "Tennis enthusiast",
        "avatar": "https://example.com/avatars/johndoe.jpg",
        "location": "New York, NY",
        "sports": ["tennis", "basketball"],
        "skillLevel": "intermediate"
      },
      "stats": {
        "matchesPlayed": 25,
        "matchesWon": 18,
        "winRate": 72,
        "tournamentsJoined": 5,
        "tournamentsWon": 2,
        "followers": 120,
        "following": 85
      },
      "isFollowing": false,
      "createdAt": "2024-01-01T10:30:00.000Z"
    }
  }
}
```

### Follow User

**Request:**
```http
POST /api/v1/users/60d5ecb54b24a50015c4d1a1/follow
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully followed user",
  "data": {
    "followedUser": {
      "_id": "60d5ecb54b24a50015c4d1a1",
      "username": "johnsmith",
      "firstName": "John",
      "lastName": "Smith"
    }
  }
}
```

### Unfollow User

**Request:**
```http
DELETE /api/v1/users/60d5ecb54b24a50015c4d1a1/follow
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully unfollowed user"
}
```

### Get User Followers

**Request:**
```http
GET /api/v1/users/60d5ecb54b24a50015c4d1a0/followers?page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "followers": [
      {
        "_id": "60d5ecb54b24a50015c4d1a1",
        "username": "johnsmith",
        "firstName": "John",
        "lastName": "Smith",
        "profile": {
          "avatar": "https://example.com/avatars/johnsmith.jpg",
          "location": "Boston, MA"
        },
        "isFollowing": true
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "pages": 6
  }
}
```

### Get User Following

**Request:**
```http
GET /api/v1/users/60d5ecb54b24a50015c4d1a0/following?page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "following": [
      {
        "_id": "60d5ecb54b24a50015c4d1a2",
        "username": "janedoe",
        "firstName": "Jane",
        "lastName": "Doe",
        "profile": {
          "avatar": "https://example.com/avatars/janedoe.jpg",
          "location": "New York, NY"
        },
        "isFollowing": true
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 85,
    "pages": 5
  }
}
```

### Get User Matches

**Request:**
```http
GET /api/v1/users/60d5ecb54b24a50015c4d1a0/matches?status=completed&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "_id": "60d5ecb54b24a50015c4d2a0",
        "sport": "tennis",
        "schedule": {
          "date": "2024-01-10T00:00:00.000Z",
          "time": "14:00"
        },
        "status": "completed",
        "result": {
          "winner": "60d5ecb54b24a50015c4d1a0",
          "score": "6-4, 6-3"
        },
        "participants": [
          {
            "_id": "60d5ecb54b24a50015c4d1a0",
            "username": "johndoe",
            "firstName": "John"
          },
          {
            "_id": "60d5ecb54b24a50015c4d1a3",
            "username": "mikewilson",
            "firstName": "Mike"
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

### Get User Achievements

**Request:**
```http
GET /api/v1/users/60d5ecb54b24a50015c4d1a0/achievements
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "achievements": [
      {
        "_id": "ach_001",
        "name": "First Victory",
        "description": "Win your first match",
        "icon": "🏆",
        "earnedAt": "2024-01-05T10:30:00.000Z"
      },
      {
        "_id": "ach_002",
        "name": "Tournament Champion",
        "description": "Win a tournament",
        "icon": "🥇",
        "earnedAt": "2024-01-12T18:00:00.000Z"
      },
      {
        "_id": "ach_003",
        "name": "Social Butterfly",
        "description": "Follow 50 users",
        "icon": "🦋",
        "earnedAt": "2024-01-14T12:00:00.000Z"
      }
    ],
    "stats": {
      "totalAchievements": 3,
      "points": 150
    }
  }
}
```

## Query Parameters

### Search Users (`/users/search`)
- `q` (required, min 2 chars) - Search query for username or name
- `sport` - Filter by sport interest
- `location` - Filter by location
- `skillLevel` - Filter by skill level (beginner, intermediate, advanced, expert)
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Results per page

### Get Followers/Following
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Results per page

### Get User Matches
- `status` - Filter by status (upcoming, active, completed, cancelled)
- `sport` - Filter by sport type
- `page` (default: 1) - Page number
- `limit` (default: 10, max: 50) - Results per page

## Notes on Auth/Security

### JWT Authentication Required
All endpoints except `GET /users/:id` require authentication:
```http
Authorization: Bearer <jwt_token>
```

### Privacy Settings
- User profile visibility can be set to public, friends-only, or private
- Private profiles hide detailed information from non-followers
- Email addresses are never exposed in API responses unless explicitly allowed by user

### Rate Limiting
- User endpoints: **100 requests per 15 minutes per authenticated user**
- Search endpoint: **30 requests per minute** to prevent abuse

### Profile Updates
- Username changes limited to once per 30 days
- Avatar uploads limited to 5MB
- Supported formats: JPG, PNG, WebP

## Real-time Requirements

### WebSocket Events

**User Status Updates:**
```javascript
// Listen for user online/offline status
socket.on('user-status-changed', (data) => {
  console.log(`${data.userId} is now ${data.status}`);
  // data.status: 'online' | 'offline' | 'away'
});
```

**Follow Notifications:**
```javascript
// Receive notification when someone follows you
socket.on('new-follower', (data) => {
  console.log(`${data.follower.username} started following you`);
});
```

**Achievement Unlocked:**
```javascript
// Real-time achievement notifications
socket.on('achievement-unlocked', (achievement) => {
  console.log(`New achievement: ${achievement.name}`);
});
```

### Push Notifications
- New follower notifications
- Achievement unlocked alerts
- Profile mention notifications
