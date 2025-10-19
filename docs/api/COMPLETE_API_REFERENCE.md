# Sportification Backend - Complete API Reference

**Version:** 2.0.0  
**Last Updated:** October 2025  
**Base URL:** `/api/v1`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Authentication API (IAM)](#authentication-api-iam)
4. [Users API](#users-api)
5. [Matches API](#matches-api)
6. [Tournaments API](#tournaments-api)
7. [Teams API](#teams-api)
8. [Chat & Messaging API](#chat--messaging-api)
9. [Notifications API](#notifications-api)
10. [Venues API](#venues-api)
11. [Analytics API](#analytics-api)
12. [Common Response Formats](#common-response-formats)
13. [Error Codes](#error-codes)
14. [Rate Limiting](#rate-limiting)

---

## Overview

### Base URLs

- **Development:** `http://localhost:3000/api/v1`
- **Production:** `https://api.sportification.app/api/v1`

### Global Headers

All API requests should include the following headers:

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| `Content-Type` | `application/json` | Yes | Request content type |
| `Authorization` | `Bearer <token>` | Most endpoints | JWT access token |
| `Accept` | `application/json` | No | Response format preference |

### Standard Response Format

All successful responses follow this structure:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "meta": {
    // Metadata (e.g., pagination)
  }
}
```

### Pagination

Paginated endpoints use query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (minimum: 1) |
| `limit` | integer | 10 | Items per page (minimum: 1, maximum: 100) |

Paginated responses include:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

---

## Authentication

### Authentication Flow

1. **Register** a new user account
2. **Login** to receive access and refresh tokens
3. **Use access token** in `Authorization: Bearer <token>` header
4. **Refresh token** when access token expires
5. **Logout** to invalidate refresh token

### Token Lifespan

- **Access Token:** 7 days
- **Refresh Token:** 30 days

### Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Refresh token rotation
- Rate limiting on auth endpoints (20 requests per 15 minutes)


---

## Authentication API (IAM)

### POST /auth/register

**Title:** Register a New User Account

**Description:** Creates a new user account with email and password. The user receives access and refresh tokens upon successful registration. Email addresses must be unique in the system.

#### Request Body

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `email` | string | Yes | Valid email format | User's email address |
| `password` | string | Yes | Min 8 characters | User's password |
| `profile.firstName` | string | Yes | 1-50 characters | First name |
| `profile.lastName` | string | Yes | 1-50 characters | Last name |
| `profile.dateOfBirth` | string | No | ISO 8601 date | Date of birth |
| `profile.phoneNumber` | string | No | Valid phone | Contact phone |

#### Example Request

```bash
curl -X POST /api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }'
```

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "role": "user",
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Responses

| Status Code | Description | Example Message |
|-------------|-------------|-----------------|
| 400 | Bad Request | "Email is required" |
| 409 | Conflict | "Email already exists" |
| 429 | Too Many Requests | "Rate limit exceeded" |

---

### POST /auth/login

**Title:** User Login

**Description:** Authenticates a user with email and password credentials. Returns access and refresh tokens for subsequent API requests.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's registered email |
| `password` | string | Yes | User's password |

#### Example Request

```bash
curl -X POST /api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

#### Error Responses

| Status Code | Description | Example Message |
|-------------|-------------|-----------------|
| 401 | Unauthorized | "Invalid email or password" |
| 403 | Forbidden | "Account deactivated" |

---

### POST /auth/refresh-token

**Title:** Refresh Access Token

**Description:** Generates a new access token using a valid refresh token.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | string | Yes | Valid refresh token |

#### Example Request

```bash
curl -X POST /api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

---

### POST /auth/logout

**Title:** User Logout

**Description:** Invalidates the user's refresh token and logs them out. Requires authentication.

**Authentication Required:** Yes (Bearer Token)

#### Example Request

```bash
curl -X POST /api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

---

### GET /auth/profile

**Title:** Get Authenticated User Profile

**Description:** Retrieves the complete profile of the currently authenticated user.

**Authentication Required:** Yes (Bearer Token)

#### Example Request

```bash
curl -X GET /api/v1/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "role": "user",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "bio": "Sports enthusiast"
      },
      "stats": {
        "matchesPlayed": 25,
        "tournamentsWon": 3
      }
    }
  }
}
```

---

### PUT /auth/change-password

**Title:** Change User Password

**Description:** Allows authenticated users to change their password. Requires current password for verification.

**Authentication Required:** Yes (Bearer Token)

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currentPassword` | string | Yes | Current password |
| `newPassword` | string | Yes | New password (min 8 characters) |

#### Example Request

```bash
curl -X PUT /api/v1/auth/change-password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPass123!",
    "newPassword": "NewSecurePass123!"
  }'
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

#### Error Responses

| Status Code | Description | Example Message |
|-------------|-------------|-----------------|
| 401 | Unauthorized | "Current password is incorrect" |

---

### DELETE /auth/deactivate

**Title:** Deactivate User Account

**Description:** Deactivates the currently authenticated user's account. Account is marked as inactive but not permanently deleted.

**Authentication Required:** Yes (Bearer Token)

#### Example Request

```bash
curl -X DELETE /api/v1/auth/deactivate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Account deactivated successfully",
  "data": null
}
```


---

## Users API

All endpoints require authentication unless otherwise specified.

### GET /users

**Title:** Get All Users (Admin/Moderator Only)

**Description:** Retrieves a paginated list of all users. Restricted to admin and moderator roles.

**Authentication:** Bearer Token (Admin/Moderator)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page (1-100) |
| `role` | string | - | Filter by role |
| `isActive` | boolean | - | Filter by status |

**Example:**
```bash
curl -X GET "/api/v1/users?page=1&limit=20" \
  -H "Authorization: Bearer TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [...]
  },
  "meta": {
    "pagination": {...}
  }
}
```

---

### GET /users/search

**Title:** Search Users

**Description:** Search for users by name, email, or other criteria.

**Authentication:** Bearer Token

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (min 2 chars) |
| `page` | integer | No | Page number |
| `limit` | integer | No | Items per page |

**Example:**
```bash
curl -X GET "/api/v1/users/search?q=john" \
  -H "Authorization: Bearer TOKEN"
```

---

### GET /users/:id

**Title:** Get User by ID

**Description:** Retrieves detailed information about a specific user.

**Authentication:** Bearer Token

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | User ID |

**Example:**
```bash
curl -X GET /api/v1/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "stats": {
        "matchesPlayed": 25
      }
    }
  }
}
```

---

### PUT /users/profile

**Title:** Update Own Profile

**Description:** Updates the profile of the authenticated user.

**Authentication:** Bearer Token

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | No | First name (1-50 chars) |
| `lastName` | string | No | Last name (1-50 chars) |
| `bio` | string | No | Biography (max 500 chars) |
| `phoneNumber` | string | No | Contact phone |
| `location` | object | No | Location info |

**Example:**
```bash
curl -X PUT /api/v1/users/profile \
  -H "Authorization: Bearer TOKEN" \
  -d '{"firstName": "John", "bio": "Sports enthusiast"}'
```

---

### GET /users/:id/friends

**Title:** Get User's Friends

**Description:** Retrieves the list of friends for a user.

**Authentication:** Bearer Token

**Example:**
```bash
curl -X GET /api/v1/users/507f1f77bcf86cd799439011/friends \
  -H "Authorization: Bearer TOKEN"
```

---

### POST /users/:friendId/friend

**Title:** Add Friend

**Description:** Adds a user as a friend.

**Authentication:** Bearer Token

**Example:**
```bash
curl -X POST /api/v1/users/507f1f77bcf86cd799439012/friend \
  -H "Authorization: Bearer TOKEN"
```

---

### DELETE /users/:friendId/friend

**Title:** Remove Friend

**Description:** Removes a friend from the user's friends list.

**Authentication:** Bearer Token

**Example:**
```bash
curl -X DELETE /api/v1/users/507f1f77bcf86cd799439012/friend \
  -H "Authorization: Bearer TOKEN"
```


---

## Matches API

All endpoints require authentication.

### POST /matches

**Title:** Create a New Match

**Description:** Creates a new sports match. Any authenticated user can create a match.

**Authentication:** Bearer Token

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sport` | string | Yes | Sport type (e.g., "football") |
| `type` | string | No | "public" or "private" (default: "public") |
| `schedule.date` | string | Yes | Match date (ISO 8601) |
| `schedule.time` | string | Yes | Match time ("HH:mm") |
| `venue` | string | No | Venue ID |
| `maxParticipants` | integer | No | Max participants (2-100) |
| `description` | string | No | Match description |

**Example:**
```bash
curl -X POST /api/v1/matches \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "sport": "football",
    "schedule": {
      "date": "2025-10-20",
      "time": "18:00"
    },
    "maxParticipants": 10
  }'
```

**Response (201):**
```json
{
  "success": true,
  "message": "Match created successfully",
  "data": {
    "match": {
      "id": "507f1f77bcf86cd799439011",
      "sport": "football",
      "status": "upcoming",
      "schedule": {
        "date": "2025-10-20",
        "time": "18:00"
      }
    }
  }
}
```

---

### GET /matches

**Title:** Get All Matches

**Description:** Retrieves a paginated list of matches with optional filters.

**Authentication:** Bearer Token

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `sport` | string | Filter by sport |
| `status` | string | Filter by status (upcoming, ongoing, completed) |
| `fromDate` | string | Filter from date |
| `toDate` | string | Filter to date |
| `venue` | string | Filter by venue ID |

**Example:**
```bash
curl -X GET "/api/v1/matches?sport=football&status=upcoming" \
  -H "Authorization: Bearer TOKEN"
```

---

### GET /matches/:id

**Title:** Get Match by ID

**Description:** Retrieves detailed information about a specific match.

**Authentication:** Bearer Token

**Example:**
```bash
curl -X GET /api/v1/matches/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "match": {
      "id": "507f1f77bcf86cd799439011",
      "sport": "football",
      "status": "upcoming",
      "createdBy": {...},
      "participants": [...],
      "venue": {...}
    }
  }
}
```

---

### POST /matches/:id/join

**Title:** Join a Match

**Description:** Adds the authenticated user as a participant in the match.

**Authentication:** Bearer Token

**Example:**
```bash
curl -X POST /api/v1/matches/507f1f77bcf86cd799439011/join \
  -H "Authorization: Bearer TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Joined match successfully"
}
```

**Error Responses:**
- **409 Conflict:** "Already participating in this match" or "Match is full"

---

### POST /matches/:id/leave

**Title:** Leave a Match

**Description:** Removes the authenticated user from match participants.

**Authentication:** Bearer Token

**Example:**
```bash
curl -X POST /api/v1/matches/507f1f77bcf86cd799439011/leave \
  -H "Authorization: Bearer TOKEN"
```

---

### PUT /matches/:id/score

**Title:** Update Match Score

**Description:** Updates the score for a match. Only creator or participants can update.

**Authentication:** Bearer Token

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `scores` | object | Score object (e.g., {team1: 2, team2: 1}) |
| `winner` | string | Winner user ID |

**Example:**
```bash
curl -X PUT /api/v1/matches/507f1f77bcf86cd799439011/score \
  -H "Authorization: Bearer TOKEN" \
  -d '{"scores": {"team1": 2, "team2": 1}}'
```

---

### PUT /matches/:id/status

**Title:** Update Match Status

**Description:** Changes the status of a match. Creator only.

**Authentication:** Bearer Token

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | Match status (upcoming, ongoing, completed, cancelled) |

**Example:**
```bash
curl -X PUT /api/v1/matches/507f1f77bcf86cd799439011/status \
  -H "Authorization: Bearer TOKEN" \
  -d '{"status": "ongoing"}'
```

---

### DELETE /matches/:id

**Title:** Delete a Match

**Description:** Deletes a match. Admin/Moderator only.

**Authentication:** Bearer Token (Admin/Moderator)

**Example:**
```bash
curl -X DELETE /api/v1/matches/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer TOKEN"
```


---

## Tournaments API

All endpoints require authentication.

### POST /tournaments

**Title:** Create a New Tournament

**Description:** Creates a tournament with bracket structure. Any authenticated user can create a tournament.

**Authentication:** Bearer Token

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Tournament name |
| `description` | string | No | Tournament description |
| `sport` | string | Yes | Sport type |
| `maxParticipants` | integer | Yes | Max participants (must be power of 2) |
| `startDate` | string | Yes | Start date (ISO 8601) |
| `venue` | string | No | Venue ID |
| `prizePool` | number | No | Total prize pool |

**Example:**
```bash
curl -X POST /api/v1/tournaments \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "Summer Championship 2025",
    "sport": "football",
    "maxParticipants": 16,
    "startDate": "2025-06-15T10:00:00Z"
  }'
```

---

### GET /tournaments

**Title:** Get All Tournaments

**Description:** Retrieves a paginated list of tournaments with filters.

**Authentication:** Bearer Token

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `sport` | string | Filter by sport |
| `status` | string | Filter by status (upcoming, active, completed) |

**Example:**
```bash
curl -X GET "/api/v1/tournaments?sport=football" \
  -H "Authorization: Bearer TOKEN"
```

---

### GET /tournaments/:id

**Title:** Get Tournament by ID

**Description:** Retrieves detailed information including brackets.

**Authentication:** Bearer Token

**Example:**
```bash
curl -X GET /api/v1/tournaments/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer TOKEN"
```

---

### POST /tournaments/:id/join

**Title:** Join Tournament

**Description:** Registers the authenticated user for the tournament.

**Authentication:** Bearer Token

---

### GET /tournaments/:id/bracket

**Title:** Get Tournament Bracket

**Description:** Retrieves the tournament bracket/tree structure.

**Authentication:** Bearer Token

---

### PUT /tournaments/:id/match/:matchId/score

**Title:** Update Tournament Match Score

**Description:** Updates score for a specific tournament match.

**Authentication:** Bearer Token


---

## Teams API

All endpoints require authentication.

### POST /teams

**Title:** Create a New Team

**Description:** Creates a sports team. Creator becomes team captain.

**Authentication:** Bearer Token

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Team name |
| `description` | string | No | Team description |
| `sport` | string | Yes | Sport type |
| `maxMembers` | integer | No | Maximum members (min 2) |
| `isPrivate` | boolean | No | Private team (requires approval) |

**Example:**
```bash
curl -X POST /api/v1/teams \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "Thunder Strikers",
    "sport": "football",
    "maxMembers": 20
  }'
```

---

### GET /teams

**Title:** Get All Teams

**Description:** Retrieves a paginated list of teams with filters.

**Authentication:** Bearer Token

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `sport` | string | Filter by sport |
| `search` | string | Search by name |

---

### GET /teams/my/teams

**Title:** Get My Teams

**Description:** Retrieves all teams the authenticated user is a member of.

**Authentication:** Bearer Token

---

### GET /teams/:id

**Title:** Get Team by ID

**Description:** Retrieves detailed team information including members.

**Authentication:** Bearer Token

---

### PATCH /teams/:id

**Title:** Update Team

**Description:** Updates team information. Captain only.

**Authentication:** Bearer Token

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Team name |
| `description` | string | Description |
| `maxMembers` | integer | Max members |

---

### DELETE /teams/:id

**Title:** Delete Team

**Description:** Deletes the team. Captain or Admin/Moderator only.

**Authentication:** Bearer Token

---

### POST /teams/:id/join

**Title:** Join Team

**Description:** Adds authenticated user to the team.

**Authentication:** Bearer Token

---

### POST /teams/:id/leave

**Title:** Leave Team

**Description:** Removes authenticated user from the team.

**Authentication:** Bearer Token


---

## Chat & Messaging API

All endpoints require authentication.

### POST /chats

**Title:** Create a Chat

**Description:** Creates a new direct or group chat.

**Authentication:** Bearer Token

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `participants` | array | Yes | Array of user IDs |
| `type` | string | No | "direct" or "group" |
| `name` | string | No | Group chat name (required for groups) |

**Example:**
```bash
curl -X POST /api/v1/chats \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "participants": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "type": "direct"
  }'
```

---

### GET /chats

**Title:** Get User's Chats

**Description:** Retrieves all chats for the authenticated user.

**Authentication:** Bearer Token

---

### GET /chats/:chatId/messages

**Title:** Get Chat Messages

**Description:** Retrieves messages from a specific chat.

**Authentication:** Bearer Token

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 50 | Items per page |

---

### POST /chats/:chatId/messages

**Title:** Send a Message

**Description:** Sends a message in a chat.

**Authentication:** Bearer Token

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Message content |
| `type` | string | No | "text", "image", or "file" (default: "text") |

**Example:**
```bash
curl -X POST /api/v1/chats/507f1f77bcf86cd799439011/messages \
  -H "Authorization: Bearer TOKEN" \
  -d '{"content": "Hello team!", "type": "text"}'
```


---

## Notifications API

All endpoints require authentication.

### GET /notifications

**Title:** Get User Notifications

**Description:** Retrieves notifications for the authenticated user.

**Authentication:** Bearer Token

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page (default: 20) |
| `unreadOnly` | boolean | Show only unread notifications |

**Example:**
```bash
curl -X GET "/api/v1/notifications?unreadOnly=true" \
  -H "Authorization: Bearer TOKEN"
```

---

### GET /notifications/:id

**Title:** Get Notification by ID

**Description:** Retrieves a specific notification.

**Authentication:** Bearer Token

---

### PUT /notifications/:id/read

**Title:** Mark Notification as Read

**Description:** Marks a specific notification as read.

**Authentication:** Bearer Token

**Example:**
```bash
curl -X PUT /api/v1/notifications/507f1f77bcf86cd799439011/read \
  -H "Authorization: Bearer TOKEN"
```

---

### PUT /notifications/read-all

**Title:** Mark All Notifications as Read

**Description:** Marks all user notifications as read.

**Authentication:** Bearer Token

---

### DELETE /notifications/:id

**Title:** Delete Notification

**Description:** Deletes a specific notification.

**Authentication:** Bearer Token


---

## Venues API

### POST /venues

**Title:** Create a New Venue

**Description:** Creates a sports venue. Admin/Moderator only.

**Authentication:** Bearer Token (Admin/Moderator)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Venue name |
| `description` | string | No | Description |
| `location` | object | Yes | Location object |
| `location.type` | string | Yes | "Point" |
| `location.coordinates` | array | Yes | [longitude, latitude] |
| `location.address` | string | No | Street address |
| `sports` | array | Yes | Supported sports |
| `facilities` | array | No | Available facilities |
| `pricing.hourly` | number | No | Hourly rate |

**Example:**
```bash
curl -X POST /api/v1/venues \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "City Sports Complex",
    "location": {
      "type": "Point",
      "coordinates": [-73.935242, 40.730610],
      "address": "123 Main St, New York, NY"
    },
    "sports": ["football", "basketball"]
  }'
```

---

### GET /venues

**Title:** Get All Venues

**Description:** Retrieves a paginated list of venues.

**Authentication:** Bearer Token

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `sport` | string | Filter by supported sport |
| `lat` | number | Latitude for proximity search |
| `lng` | number | Longitude for proximity search |
| `maxDistance` | number | Max distance in meters (requires lat/lng) |

---

### GET /venues/:id

**Title:** Get Venue by ID

**Description:** Retrieves detailed venue information.

**Authentication:** Bearer Token

---

### GET /venues/bookings

**Title:** Get All Bookings

**Description:** Retrieves venue bookings (Admin/Moderator).

**Authentication:** Bearer Token (Admin/Moderator)

---

### POST /venues/bookings

**Title:** Create Venue Booking

**Description:** Creates a new venue booking.

**Authentication:** Bearer Token

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `venue` | string | Yes | Venue ID |
| `date` | string | Yes | Booking date (ISO 8601) |
| `startTime` | string | Yes | Start time ("HH:mm") |
| `endTime` | string | Yes | End time ("HH:mm") |
| `purpose` | string | No | Booking purpose |

---

### GET /venues/bookings/:id

**Title:** Get Booking by ID

**Description:** Retrieves specific booking details.

**Authentication:** Bearer Token

---

### PATCH /venues/bookings/:id

**Title:** Update Booking

**Description:** Updates a booking. Creator or Admin/Moderator only.

**Authentication:** Bearer Token

---

### DELETE /venues/bookings/:id

**Title:** Cancel Booking

**Description:** Cancels a venue booking.

**Authentication:** Bearer Token


---

## Analytics API

### GET /analytics/dashboard

**Title:** Get Dashboard Analytics

**Description:** Retrieves analytics dashboard data (Admin/Moderator).

**Authentication:** Bearer Token (Admin/Moderator)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | Time period ("day", "week", "month", "year") |

---

### GET /analytics/users

**Title:** Get User Analytics

**Description:** Retrieves user-related analytics.

**Authentication:** Bearer Token (Admin/Moderator)

---

### GET /analytics/matches

**Title:** Get Match Analytics

**Description:** Retrieves match-related analytics.

**Authentication:** Bearer Token (Admin/Moderator)

---

### GET /admin/stats

**Title:** Get System Statistics

**Description:** Retrieves comprehensive system statistics (Admin only).

**Authentication:** Bearer Token (Admin)

**Response:** Includes user counts, match statistics, revenue data, and system metrics.


---

## Common Response Formats

### Success Response Structure

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "meta": {
    // Optional metadata (pagination, etc.)
  }
}
```

### Error Response Structure

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | BAD_REQUEST | Invalid request data or parameters |
| 401 | UNAUTHORIZED | Missing or invalid authentication token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (e.g., duplicate email) |
| 422 | UNPROCESSABLE_ENTITY | Semantic validation error |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeded |
| 500 | INTERNAL_SERVER_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

### Common Error Messages

- **Authentication Errors:**
  - "Authentication required"
  - "Invalid or expired token"
  - "Insufficient permissions"

- **Validation Errors:**
  - "Email is required"
  - "Password must be at least 8 characters"
  - "Invalid email format"

- **Resource Errors:**
  - "User not found"
  - "Match not found"
  - "Resource not found"

- **Conflict Errors:**
  - "Email already exists"
  - "Already participating in this match"
  - "Match is full"

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 20 requests | 15 minutes |
| General API | 100 requests | 15 minutes |
| File Upload | 10 requests | 15 minutes |

### Rate Limit Headers

Responses include the following headers:

- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

---

## Additional Resources

- **Swagger UI:** `/api/v1/docs` - Interactive API documentation
- **OpenAPI Spec:** `/api/v1/openapi.json` - Machine-readable API specification
- **Health Check:** `/health` - API health status
- **API Info:** `/api/v1` - API version and feature information

---

## WebSocket Events

For real-time features, the API supports WebSocket connections via Socket.IO.

### Connection

```javascript
const socket = io('http://localhost:3000');

// Authenticate
socket.emit('authenticate', 'your-jwt-token');

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data.user);
});
```

### Available Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `authenticate` | Client → Server | Authenticate socket connection |
| `authenticated` | Server → Client | Authentication successful |
| `join-room` | Client → Server | Join a room (match, team, etc.) |
| `leave-room` | Client → Server | Leave a room |
| `send-message` | Client → Server | Send a chat message |
| `new-message` | Server → Client | Receive a new message |
| `match-update` | Client → Server | Send match update |
| `match-updated` | Server → Client | Receive match update |

For detailed WebSocket documentation, see the WebSocket Events Guide.

---

**End of API Reference**

*This documentation is auto-generated from the API routes and maintained by the Sportification team.*
