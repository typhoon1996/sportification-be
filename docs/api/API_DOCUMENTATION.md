# Sports Companion API Documentation

## Complete API Reference with Response Schemas

This document provides comprehensive API documentation with detailed request/response examples, schemas, and integration patterns.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication API](#authentication-api)
3. [User APIs](#user-apis)
   - [Users API](#users-api)
   - [Matches API](#matches-api)
   - [Tournaments API](#tournaments-api)
   - [Teams API](#teams-api)
   - [Chat & Messaging API](#chat--messaging-api)
   - [Notifications API](#notifications-api)
4. [Admin APIs](#admin-apis)
   - [Analytics API](#analytics-api)
   - [Insights API](#insights-api)
   - [System Management API](#system-management-api)
5. [WebSocket Events](#websocket-events)
6. [Response Schemas](#response-schemas)
7. [Error Codes](#error-codes)

---

## Overview

### Base URL
- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://api.sportification.app/v1`

### Global Headers
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Standard Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Pagination Format
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Authentication API

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "profile": {
    "bio": "Tennis enthusiast",
    "location": "New York, NY",
    "sports": ["tennis", "basketball"],
    "skillLevel": "intermediate"
  }
}
```

**Response (201):**
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
      "isVerified": false,
      "profile": {
        "bio": "Tennis enthusiast",
        "location": "New York, NY",
        "sports": ["tennis", "basketball"],
        "skillLevel": "intermediate",
        "achievements": [],
        "statistics": {
          "matchesPlayed": 0,
          "matchesWon": 0,
          "tournamentsJoined": 0,
          "tournamentsWon": 0
        }
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

### POST /auth/login

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
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
      "isVerified": true,
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  },
  "message": "Token refreshed successfully"
}
```

### GET /auth/profile

Get current user's profile information.

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
      "isVerified": true,
      "profile": {
        "bio": "Tennis enthusiast",
        "location": "New York, NY",
        "sports": ["tennis", "basketball"],
        "skillLevel": "intermediate",
        "achievements": [
          {
            "type": "first_match",
            "title": "First Match Completed",
            "description": "Completed your first match",
            "earnedAt": "2024-01-10T14:30:00.000Z"
          }
        ],
        "statistics": {
          "matchesPlayed": 15,
          "matchesWon": 12,
          "winRate": 80,
          "tournamentsJoined": 3,
          "tournamentsWon": 1
        }
      },
      "settings": {
        "privacy": {
          "profileVisibility": "public",
          "showEmail": false,
          "showLocation": true
        },
        "notifications": {
          "email": true,
          "push": true,
          "types": ["match", "tournament", "chat", "friend"]
        }
      },
      "createdAt": "2024-01-01T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

## User APIs

> **For Standard Users**: These endpoints are available to all authenticated users and provide core functionality for user interactions, matches, tournaments, messaging, and notifications.

## Users API

### GET /users

Get list of users with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `search` (string): Search by name or username
- `sport` (string): Filter by sport
- `skillLevel` (string): Filter by skill level
- `location` (string): Filter by location

**Example Request:**
```
GET /users?page=1&limit=10&sport=tennis&skillLevel=intermediate
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb54b24a50015c4d1a0",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "profile": {
        "bio": "Tennis enthusiast",
        "location": "New York, NY",
        "sports": ["tennis", "basketball"],
        "skillLevel": "intermediate",
        "statistics": {
          "matchesPlayed": 15,
          "matchesWon": 12,
          "winRate": 80
        }
      },
      "isOnline": true,
      "lastActiveAt": "2024-01-15T10:25:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

### GET /users/:id

Get specific user by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60d5ecb54b24a50015c4d1a0",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "profile": {
        "bio": "Tennis enthusiast and coach",
        "location": "New York, NY",
        "sports": ["tennis", "basketball"],
        "skillLevel": "intermediate",
        "achievements": [
          {
            "type": "tournament_winner",
            "title": "Summer Championship Winner",
            "description": "Won the Summer Tennis Tournament 2024",
            "earnedAt": "2024-01-10T16:00:00.000Z"
          }
        ],
        "statistics": {
          "matchesPlayed": 15,
          "matchesWon": 12,
          "winRate": 80,
          "tournamentsJoined": 3,
          "tournamentsWon": 1,
          "averageRating": 4.8
        }
      },
      "isOnline": false,
      "lastActiveAt": "2024-01-15T08:30:00.000Z"
    },
    "relationship": {
      "isFriend": true,
      "friendshipDate": "2024-01-05T12:00:00.000Z"
    }
  }
}
```

---

## Matches API

### GET /matches

Get list of matches with filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `sport`: Filter by sport
- `status`: Filter by status (upcoming, in-progress, completed)
- `type`: Filter by type (public, private)
- `date`: Filter by date (YYYY-MM-DD)
- `location`: Filter by location/venue

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb54b24a50015c4d1b0",
      "type": "public",
      "sport": "tennis",
      "title": "Weekend Tennis Match",
      "description": "Casual tennis match for intermediate players",
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "firstName": "John",
          "lastName": "Doe",
          "username": "johndoe",
          "profile": {
            "skillLevel": "intermediate"
          }
        }
      ],
      "maxParticipants": 4,
      "currentParticipants": 2,
      "status": "upcoming",
      "schedule": {
        "date": "2024-01-20T00:00:00.000Z",
        "time": "14:00",
        "timezone": "America/New_York",
        "duration": 120
      },
      "venue": {
        "_id": "60d5ecb54b24a50015c4d1c0",
        "name": "Central Park Tennis Courts",
        "location": {
          "address": "Central Park, New York, NY",
          "coordinates": {
            "lat": 40.7829,
            "lng": -73.9654
          }
        },
        "amenities": ["parking", "restrooms", "equipment_rental"]
      },
      "rules": {
        "format": "doubles",
        "scoringSystem": "traditional",
        "equipment": "bring_own"
      },
      "organizer": {
        "_id": "60d5ecb54b24a50015c4d1a0",
        "firstName": "John",
        "lastName": "Doe"
      },
      "chat": {
        "_id": "60d5ecb54b24a50015c4d1d0",
        "unreadCount": 2
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 87,
    "pages": 5
  }
}
```

### POST /matches

Create a new match.

**Request Body:**
```json
{
  "type": "public",
  "sport": "tennis",
  "title": "Morning Tennis Session",
  "description": "Looking for 2-3 players for a fun tennis session",
  "maxParticipants": 4,
  "schedule": {
    "date": "2024-01-22T00:00:00.000Z",
    "time": "09:00",
    "timezone": "America/New_York",
    "duration": 90
  },
  "venue": "60d5ecb54b24a50015c4d1c0",
  "rules": {
    "format": "doubles",
    "scoringSystem": "traditional",
    "skillLevel": "intermediate",
    "equipment": "bring_own"
  },
  "requirements": {
    "minSkillLevel": "beginner",
    "maxSkillLevel": "advanced",
    "ageRange": {
      "min": 18,
      "max": 50
    }
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "match": {
      "_id": "60d5ecb54b24a50015c4d1b1",
      "type": "public",
      "sport": "tennis",
      "title": "Morning Tennis Session",
      "description": "Looking for 2-3 players for a fun tennis session",
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "firstName": "John",
          "lastName": "Doe",
          "role": "organizer"
        }
      ],
      "maxParticipants": 4,
      "status": "upcoming",
      "schedule": {
        "date": "2024-01-22T00:00:00.000Z",
        "time": "09:00",
        "timezone": "America/New_York",
        "duration": 90
      },
      "venue": {
        "_id": "60d5ecb54b24a50015c4d1c0",
        "name": "Central Park Tennis Courts"
      },
      "rules": {
        "format": "doubles",
        "scoringSystem": "traditional",
        "skillLevel": "intermediate",
        "equipment": "bring_own"
      },
      "chat": {
        "_id": "60d5ecb54b24a50015c4d1d1"
      },
      "inviteCode": "TN2024012201",
      "createdAt": "2024-01-15T12:00:00.000Z"
    }
  },
  "message": "Match created successfully"
}
```

### POST /matches/:id/join

Join a match.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "match": {
      "_id": "60d5ecb54b24a50015c4d1b0",
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "firstName": "John",
          "lastName": "Doe",
          "role": "organizer"
        },
        {
          "_id": "60d5ecb54b24a50015c4d1a1",
          "firstName": "Jane",
          "lastName": "Smith",
          "role": "participant"
        }
      ],
      "currentParticipants": 2,
      "updatedAt": "2024-01-15T12:30:00.000Z"
    }
  },
  "message": "Successfully joined the match"
}
```

---

## Tournaments API

### GET /tournaments

Get list of tournaments.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb54b24a50015c4d1e0",
      "name": "Summer Tennis Championship 2024",
      "description": "Annual tennis tournament for all skill levels",
      "sport": "tennis",
      "type": "elimination",
      "format": "single_elimination",
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "firstName": "John",
          "lastName": "Doe",
          "profile": {
            "skillLevel": "intermediate"
          }
        }
      ],
      "maxParticipants": 32,
      "currentParticipants": 16,
      "status": "registration_open",
      "registrationDeadline": "2024-01-25T23:59:59.000Z",
      "startDate": "2024-02-01T09:00:00.000Z",
      "endDate": "2024-02-03T18:00:00.000Z",
      "venue": {
        "_id": "60d5ecb54b24a50015c4d1c0",
        "name": "Tennis Center Complex",
        "location": {
          "address": "Sports Complex, New York, NY"
        }
      },
      "rules": {
        "matchFormat": "best_of_3",
        "scoringSystem": "traditional",
        "tiebreakRules": "standard",
        "skillLevelRequired": "intermediate"
      },
      "prize": {
        "total": 5000,
        "currency": "USD",
        "distribution": {
          "first": 2500,
          "second": 1500,
          "third": 1000
        }
      },
      "bracket": {
        "rounds": [
          {
            "round": 1,
            "matches": [
              {
                "matchId": "60d5ecb54b24a50015c4d1f0",
                "player1": "60d5ecb54b24a50015c4d1a0",
                "player2": "60d5ecb54b24a50015c4d1a1",
                "status": "scheduled",
                "scheduledAt": "2024-02-01T10:00:00.000Z"
              }
            ]
          }
        ]
      },
      "organizer": {
        "_id": "60d5ecb54b24a50015c4d1a0",
        "firstName": "John",
        "lastName": "Doe"
      },
      "entryFee": {
        "amount": 25,
        "currency": "USD"
      },
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

---

## Teams API

### GET /teams

Get list of teams with optional filters.

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
        "name": "Thunder Squad",
        "description": "Competitive basketball team",
        "sport": "Basketball",
        "captain": {
          "_id": "60d5ecb54b24a50015c4d8a0",
          "profile": {
            "firstName": "John",
            "lastName": "Doe",
            "username": "johndoe"
          }
        },
        "memberCount": 5,
        "maxMembers": 10,
        "isFull": false,
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z"
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

### POST /teams

Create a new team (requires authentication).

**Request Body:**
```json
{
  "name": "Thunder Squad",
  "description": "Competitive basketball team",
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
      "name": "Thunder Squad",
      "description": "Competitive basketball team",
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
        "name": "Thunder Squad - Team Chat"
      },
      "maxMembers": 10,
      "memberCount": 1,
      "isFull": false,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### GET /teams/my/teams

Get teams for the authenticated user.

**Response (200):**
```json
{
  "success": true,
  "message": "User teams retrieved successfully",
  "data": {
    "teams": [
      {
        "_id": "60d5ecb54b24a50015c4d9a0",
        "name": "Thunder Squad",
        "sport": "Basketball",
        "captain": {
          "profile": { "username": "johndoe" }
        },
        "members": [...],
        "memberCount": 5,
        "chat": {
          "_id": "60d5ecb54b24a50015c4d9a1",
          "type": "team"
        }
      }
    ]
  }
}
```

### GET /teams/:id

Get detailed information about a specific team.

**Response (200):**
```json
{
  "success": true,
  "message": "Team retrieved successfully",
  "data": {
    "team": {
      "_id": "60d5ecb54b24a50015c4d9a0",
      "name": "Thunder Squad",
      "description": "Competitive basketball team",
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
        "name": "Thunder Squad - Team Chat"
      },
      "memberCount": 5,
      "isFull": false
    }
  }
}
```

### PATCH /teams/:id

Update team information (captain only).

**Request Body:**
```json
{
  "name": "Thunder Squad Updated",
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

### POST /teams/:id/join

Join a team.

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

### POST /teams/:id/leave

Leave a team.

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully left team"
}
```

### DELETE /teams/:id/members/:userId

Remove a member from team (captain only).

**Response (200):**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

### PATCH /teams/:id/members/:userId/role

Update member role (captain only).

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

### POST /teams/:id/transfer-captaincy

Transfer captaincy to another member (captain only).

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

### DELETE /teams/:id

Delete/deactivate a team (captain only).

**Response (200):**
```json
{
  "success": true,
  "message": "Team deleted successfully"
}
```

---

## Chat & Messaging API

### GET /chats

Get user's chat conversations.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb54b24a50015c4d2a0",
      "type": "direct",
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "firstName": "John",
          "lastName": "Doe",
          "isOnline": true
        },
        {
          "_id": "60d5ecb54b24a50015c4d1a1",
          "firstName": "Jane",
          "lastName": "Smith",
          "isOnline": false,
          "lastActiveAt": "2024-01-15T09:30:00.000Z"
        }
      ],
      "lastMessage": {
        "_id": "60d5ecb54b24a50015c4d2b0",
        "content": "Great match today! Same time next week?",
        "sender": {
          "_id": "60d5ecb54b24a50015c4d1a1",
          "firstName": "Jane"
        },
        "messageType": "text",
        "createdAt": "2024-01-15T11:45:00.000Z"
      },
      "unreadCount": 2,
      "updatedAt": "2024-01-15T11:45:00.000Z"
    },
    {
      "_id": "60d5ecb54b24a50015c4d2a1",
      "type": "group",
      "name": "Tennis Squad",
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "firstName": "John",
          "lastName": "Doe"
        },
        {
          "_id": "60d5ecb54b24a50015c4d1a1",
          "firstName": "Jane",
          "lastName": "Smith"
        },
        {
          "_id": "60d5ecb54b24a50015c4d1a2",
          "firstName": "Mike",
          "lastName": "Johnson"
        }
      ],
      "lastMessage": {
        "_id": "60d5ecb54b24a50015c4d2b1",
        "content": "Who's available for practice tomorrow?",
        "sender": {
          "_id": "60d5ecb54b24a50015c4d1a2",
          "firstName": "Mike"
        },
        "messageType": "text",
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      "unreadCount": 0,
      "settings": {
        "notifications": true,
        "role": "member"
      },
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### GET /chats/:id/messages

Get messages from a specific chat.

**Query Parameters:**
- `page`, `limit`: Pagination
- `before`: Get messages before specific timestamp
- `after`: Get messages after specific timestamp

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb54b24a50015c4d2b0",
      "chat": "60d5ecb54b24a50015c4d2a0",
      "sender": {
        "_id": "60d5ecb54b24a50015c4d1a1",
        "firstName": "Jane",
        "lastName": "Smith",
        "username": "janesmith"
      },
      "content": "Great match today! Same time next week?",
      "messageType": "text",
      "isEdited": false,
      "reactions": [
        {
          "emoji": "👍",
          "users": [
            {
              "_id": "60d5ecb54b24a50015c4d1a0",
              "firstName": "John"
            }
          ],
          "count": 1
        }
      ],
      "replyTo": null,
      "createdAt": "2024-01-15T11:45:00.000Z",
      "updatedAt": "2024-01-15T11:45:00.000Z"
    },
    {
      "_id": "60d5ecb54b24a50015c4d2b1",
      "chat": "60d5ecb54b24a50015c4d2a0",
      "sender": {
        "_id": "60d5ecb54b24a50015c4d1a0",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe"
      },
      "content": "Absolutely! I'll book the court for the same time.",
      "messageType": "text",
      "isEdited": false,
      "reactions": [],
      "replyTo": {
        "_id": "60d5ecb54b24a50015c4d2b0",
        "content": "Great match today! Same time next week?",
        "sender": {
          "firstName": "Jane"
        }
      },
      "createdAt": "2024-01-15T11:50:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "pages": 3
  }
}
```

### POST /chats/:id/messages

Send a message to a chat.

**Request Body:**
```json
{
  "content": "Looking forward to our match tomorrow!",
  "messageType": "text",
  "replyTo": "60d5ecb54b24a50015c4d2b0"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "60d5ecb54b24a50015c4d2b2",
      "chat": "60d5ecb54b24a50015c4d2a0",
      "sender": {
        "_id": "60d5ecb54b24a50015c4d1a0",
        "firstName": "John",
        "lastName": "Doe"
      },
      "content": "Looking forward to our match tomorrow!",
      "messageType": "text",
      "isEdited": false,
      "reactions": [],
      "replyTo": {
        "_id": "60d5ecb54b24a50015c4d2b0",
        "content": "Great match today! Same time next week?",
        "sender": {
          "firstName": "Jane"
        }
      },
      "createdAt": "2024-01-15T12:00:00.000Z"
    }
  },
  "message": "Message sent successfully"
}
```

---

## Notifications API

### GET /notifications

Get user notifications.

**Query Parameters:**
- `page`, `limit`: Pagination
- `read`: Filter by read status (true/false)
- `type`: Filter by notification type

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb54b24a50015c4d3a0",
      "type": "match_invitation",
      "title": "Match Invitation",
      "message": "John Doe invited you to join 'Weekend Tennis Match'",
      "data": {
        "matchId": "60d5ecb54b24a50015c4d1b0",
        "inviterId": "60d5ecb54b24a50015c4d1a0",
        "matchTitle": "Weekend Tennis Match"
      },
      "isRead": false,
      "actionRequired": true,
      "actions": [
        {
          "type": "accept",
          "label": "Accept",
          "endpoint": "/matches/60d5ecb54b24a50015c4d1b0/join"
        },
        {
          "type": "decline",
          "label": "Decline",
          "endpoint": "/matches/60d5ecb54b24a50015c4d1b0/decline"
        }
      ],
      "priority": "high",
      "expiresAt": "2024-01-20T14:00:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "60d5ecb54b24a50015c4d3a1",
      "type": "new_message",
      "title": "New Message",
      "message": "You have a new message from Jane Smith",
      "data": {
        "chatId": "60d5ecb54b24a50015c4d2a0",
        "senderId": "60d5ecb54b24a50015c4d1a1",
        "messagePreview": "Great match today! Same time..."
      },
      "isRead": true,
      "actionRequired": false,
      "priority": "medium",
      "createdAt": "2024-01-15T11:45:00.000Z",
      "readAt": "2024-01-15T11:50:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  },
  "summary": {
    "total": 45,
    "unread": 12,
    "actionRequired": 3
  }
}
```

---

## Admin APIs

> **⚠️ Admin Only**: These endpoints require admin authorization (`role: 'admin'`) and provide administrative functionality including analytics, insights, and system management.

### Base URL for Admin APIs
```
/api/v1/admin/*
```

### Admin Authentication Requirements
All admin endpoints require:
1. **Authentication**: Valid JWT token
2. **Authorization**: User role must be `admin`
3. **Rate Limiting**: Enhanced rate limiting for admin operations

### Analytics API

#### GET /admin/analytics/dashboard

Get comprehensive analytics dashboard with system metrics.

**Headers:**
```http
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
- `timeframe` (optional): `day`, `week`, `month` - Default: `week`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dashboard": {
      "activeUsers": 1250,
      "requestsPerMinute": [45, 52, 38, 67, 43],
      "avgResponseTime": 185,
      "errorRate": 0.02,
      "systemHealth": {
        "api": "healthy",
        "database": "healthy",
        "cache": "warning"
      },
      "topEndpoints": [
        {
          "endpoint": "/api/v1/matches",
          "requests": 15420,
          "avgResponseTime": 125
        }
      ],
      "userActivities": [
        {
          "hour": "2024-01-15T10:00:00Z",
          "activeUsers": 89,
          "actions": 456
        }
      ]
    },
    "insights": {
      "userGrowth": "+12.5%",
      "engagement": "High",
      "performance": "Good"
    }
  },
  "message": "Analytics dashboard retrieved successfully"
}
```

#### GET /admin/analytics/user-engagement

Get detailed user engagement analytics.

**Query Parameters:**
- `startDate` (required): ISO 8601 date string
- `endDate` (required): ISO 8601 date string  
- `userId` (optional): Specific user ID to analyze
- `groupBy` (optional): `hour`, `day`, `week`, `month`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 5420,
      "activeUsers": 3890,
      "engagementRate": 71.8,
      "avgSessionDuration": 1847
    },
    "timeline": [
      {
        "date": "2024-01-15",
        "activeUsers": 245,
        "sessions": 389,
        "avgDuration": 1654
      }
    ],
    "cohortAnalysis": {
      "week1": 0.85,
      "week2": 0.67,
      "week4": 0.45
    }
  }
}
```

#### GET /admin/analytics/performance

Get system performance analytics.

**Query Parameters:**
- `startDate` (required): ISO 8601 date string
- `endDate` (required): ISO 8601 date string
- `endpoint` (optional): Specific endpoint to analyze
- `metric` (optional): `response_time`, `error_rate`, `throughput`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "avgResponseTime": 145,
      "p95ResponseTime": 320,
      "errorRate": 0.015,
      "totalRequests": 1547896
    },
    "timeline": [
      {
        "timestamp": "2024-01-15T10:00:00Z",
        "responseTime": 128,
        "errorRate": 0.01,
        "throughput": 145.2
      }
    ],
    "endpointBreakdown": [
      {
        "endpoint": "/api/v1/matches",
        "avgResponseTime": 95,
        "requests": 45678,
        "errorRate": 0.008
      }
    ]
  }
}
```

#### POST /admin/analytics/reports/custom

Generate custom analytics reports.

**Request Body:**
```json
{
  "reportType": "user_retention",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.000Z",
  "dimensions": ["user_type", "location"],
  "metrics": ["active_users", "retention_rate"],
  "filters": {
    "user_status": "active",
    "registration_source": "organic"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reportType": "user_retention",
    "generatedAt": "2024-01-15T12:00:00.000Z",
    "period": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-31T23:59:59.000Z"
    },
    "data": [
      {
        "dimension": "premium_users",
        "activeUsers": 1250,
        "retentionRate": 0.78
      }
    ],
    "metadata": {
      "totalRecords": 15420,
      "processingTime": 2.3
    }
  }
}
```

### Insights API

#### GET /admin/insights/application

Get comprehensive application insights and recommendations.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "health": "good",
      "trends": "positive",
      "alerts": 2
    },
    "userInsights": {
      "mostActiveHours": ["18:00", "19:00", "20:00"],
      "popularSports": ["tennis", "football", "basketball"],
      "engagementPatterns": {
        "weekdays": 0.72,
        "weekends": 0.84
      }
    },
    "performanceInsights": {
      "slowestEndpoints": ["/api/v1/tournaments/brackets"],
      "recommendations": ["Optimize bracket generation algorithm"]
    },
    "recommendations": [
      {
        "type": "performance",
        "priority": "high",
        "description": "Implement caching for tournament brackets",
        "impact": "30% response time improvement"
      }
    ]
  }
}
```

#### GET /admin/insights/competitive

Get competitive analysis insights (admin only).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "marketPosition": {
      "userGrowth": "+15.2%",
      "featureAdoption": 0.68,
      "retentionRate": 0.74
    },
    "competitiveAdvantages": [
      "Real-time tournament brackets",
      "Advanced matching algorithm"
    ],
    "improvementAreas": [
      "Mobile app performance",
      "Social features engagement"
    ]
  }
}
```

### System Management API

#### GET /admin/system/overview

Get comprehensive system overview and health metrics.

**Query Parameters:**
- `deep` (optional): `true` to include detailed metrics

**Response (200):**
```json
{
  "success": true,
  "data": {
    "systemOverview": {
      "totalUsers": 15420,
      "totalMatches": 45678,
      "totalTournaments": 892,
      "systemUptime": 2847392.5,
      "memoryUsage": {
        "rss": 134217728,
        "heapTotal": 67108864,
        "heapUsed": 45678901,
        "external": 2097152
      }
    },
    "securityMetrics": {
      "failedLoginAttempts": 45,
      "blockedIPs": ["192.168.1.100"],
      "suspiciousActivity": []
    },
    "performanceProfile": {
      "cpuUsage": {
        "user": 1245678,
        "system": 987654
      },
      "averageResponseTime": 145,
      "activeConnections": 234
    }
  }
}
```

#### GET /admin/users/management

Get user management data for administration.

**Query Parameters:**
- `status` (optional): `active`, `inactive`, `suspended`, `pending`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 15420,
      "active": 13567,
      "inactive": 1853,
      "suspended": 0,
      "pending": 0
    },
    "recentActivity": {
      "newSignups": 125,
      "monthlyActiveUsers": 12890,
      "churnRate": 0.05
    },
    "users": [
      {
        "id": "60d5ecb54b24a50015c4d1a0",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "status": "active",
        "lastLoginAt": "2024-01-15T10:30:00.000Z",
        "registeredAt": "2024-01-01T12:00:00.000Z",
        "matchesPlayed": 15,
        "tournamentsJoined": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 15420,
      "pages": 309
    }
  }
}
```

---

## WebSocket Events

### Connection & Authentication

```javascript
// Client connects and authenticates
socket.emit('authenticate', 'jwt_token_here');

// Server responds with authentication status
socket.on('authenticated', (data) => {
  console.log('Authenticated as:', data.user);
});

socket.on('authentication_error', (error) => {
  console.error('Auth failed:', error.message);
});
```

### Chat Events

```javascript
// Join a chat room
socket.emit('join-room', 'chat:60d5ecb54b24a50015c4d2a0');

// New message received
socket.on('new-message', (message) => {
  // Message object same as API response
});

// Message updated (edited/deleted)
socket.on('message-updated', (update) => {
  // { messageId, type: 'edit|delete', content?, updatedAt }
});

// User typing indicator
socket.on('user-typing', ({ userId, isTyping, chatId }) => {
  // Show/hide typing indicator
});

// Send typing indicator
socket.emit('typing', { 
  chatId: '60d5ecb54b24a50015c4d2a0', 
  isTyping: true 
});
```

### Match Events

```javascript
// Join match room
socket.emit('join-room', 'match:60d5ecb54b24a50015c4d1b0');

// Match updated
socket.on('match-updated', (update) => {
  // { matchId, type: 'participant_joined|participant_left|status_changed', data }
});

// Player joined match
socket.on('player-joined', (data) => {
  // { matchId, player, currentParticipants }
});

// Player left match
socket.on('player-left', (data) => {
  // { matchId, player, currentParticipants }
});
```

### Real-time Notifications

```javascript
// New notification
socket.on('notification', (notification) => {
  // Same format as API response
});

// Notification updated
socket.on('notification-updated', (update) => {
  // { notificationId, isRead, readAt? }
});
```

---

## Response Schemas

### Error Response Schema

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "code": "REQUIRED_FIELD"
    }
  ],
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/auth/register",
  "requestId": "req-123456"
}
```

---

## Error Codes

### Authentication Errors
- `AUTHENTICATION_REQUIRED` (401): Missing or invalid token
- `TOKEN_EXPIRED` (401): JWT token has expired
- `INVALID_CREDENTIALS` (401): Wrong email/password
- `ACCOUNT_DISABLED` (403): User account is disabled
- `EMAIL_NOT_VERIFIED` (403): Email verification required

### Authorization Errors
- `AUTHORIZATION_FAILED` (403): Insufficient permissions
- `RESOURCE_ACCESS_DENIED` (403): Cannot access this resource
- `ORGANIZER_ONLY` (403): Only match/tournament organizers allowed

### Validation Errors
- `VALIDATION_ERROR` (400): Request validation failed
- `INVALID_INPUT` (400): Invalid input data
- `REQUIRED_FIELD` (400): Required field missing
- `INVALID_FORMAT` (400): Invalid data format

### Resource Errors
- `RESOURCE_NOT_FOUND` (404): Requested resource doesn't exist
- `MATCH_NOT_FOUND` (404): Match not found
- `USER_NOT_FOUND` (404): User not found
- `CHAT_NOT_FOUND` (404): Chat conversation not found

### Business Logic Errors
- `MATCH_FULL` (409): Match has reached maximum participants
- `ALREADY_JOINED` (409): User already joined this match
- `TOURNAMENT_CLOSED` (409): Tournament registration closed
- `INSUFFICIENT_SKILL_LEVEL` (409): User doesn't meet skill requirements

### Rate Limiting
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `DAILY_LIMIT_EXCEEDED` (429): Daily API limit reached

### Server Errors
- `INTERNAL_SERVER_ERROR` (500): Unexpected server error
- `DATABASE_ERROR` (500): Database operation failed
- `EXTERNAL_SERVICE_ERROR` (502): External service unavailable

---

## Additional Resources

- **Swagger Documentation**: Available at `/api-docs` endpoint
- **Postman Collection**: Import from `API_EXAMPLES.md`
- **Frontend Guide**: See `FRONTEND_GUIDE.md`
- **WebSocket Testing**: Use tools like Socket.IO tester or custom client

For support, create an issue in the repository or contact the development team.