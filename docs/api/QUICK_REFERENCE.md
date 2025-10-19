# API Quick Reference Guide

**Quick access to all Sportification Backend API endpoints**

---

## 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh-token` | Refresh access token | No |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/profile` | Get user profile | Yes |
| PUT | `/auth/change-password` | Change password | Yes |
| DELETE | `/auth/deactivate` | Deactivate account | Yes |

---

## 👥 Users Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | List all users | Yes (Admin/Mod) |
| GET | `/users/search` | Search users | Yes |
| GET | `/users/:id` | Get user by ID | Yes |
| PUT | `/users/profile` | Update own profile | Yes |
| GET | `/users/:id/friends` | Get user's friends | Yes |
| POST | `/users/:friendId/friend` | Add friend | Yes |
| DELETE | `/users/:friendId/friend` | Remove friend | Yes |

---

## ⚽ Matches Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/matches` | Create match | Yes |
| GET | `/matches` | List matches | Yes |
| GET | `/matches/:id` | Get match details | Yes |
| POST | `/matches/:id/join` | Join match | Yes |
| POST | `/matches/:id/leave` | Leave match | Yes |
| PUT | `/matches/:id/score` | Update score | Yes |
| PUT | `/matches/:id/status` | Update status | Yes |
| DELETE | `/matches/:id` | Delete match | Yes (Admin/Mod) |

---

## 🏆 Tournaments Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/tournaments` | Create tournament | Yes |
| GET | `/tournaments` | List tournaments | Yes |
| GET | `/tournaments/:id` | Get tournament | Yes |
| POST | `/tournaments/:id/join` | Join tournament | Yes |
| GET | `/tournaments/:id/bracket` | Get bracket | Yes |
| PUT | `/tournaments/:id/match/:matchId/score` | Update match score | Yes |

---

## 👥 Teams Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/teams` | Create team | Yes |
| GET | `/teams` | List teams | Yes |
| GET | `/teams/my/teams` | Get user's teams | Yes |
| GET | `/teams/:id` | Get team details | Yes |
| PATCH | `/teams/:id` | Update team | Yes |
| DELETE | `/teams/:id` | Delete team | Yes |
| POST | `/teams/:id/join` | Join team | Yes |
| POST | `/teams/:id/leave` | Leave team | Yes |

---

## 💬 Chat Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chats` | Create chat | Yes |
| GET | `/chats` | Get user's chats | Yes |
| GET | `/chats/:chatId/messages` | Get messages | Yes |
| POST | `/chats/:chatId/messages` | Send message | Yes |

---

## 🔔 Notifications Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | Get notifications | Yes |
| GET | `/notifications/:id` | Get notification | Yes |
| PUT | `/notifications/:id/read` | Mark as read | Yes |
| PUT | `/notifications/read-all` | Mark all as read | Yes |
| DELETE | `/notifications/:id` | Delete notification | Yes |

---

## 🏟️ Venues Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/venues` | Create venue | Yes (Admin/Mod) |
| GET | `/venues` | List venues | Yes |
| GET | `/venues/:id` | Get venue | Yes |
| GET | `/venues/bookings` | List bookings | Yes (Admin/Mod) |
| POST | `/venues/bookings` | Create booking | Yes |
| GET | `/venues/bookings/:id` | Get booking | Yes |
| PATCH | `/venues/bookings/:id` | Update booking | Yes |
| DELETE | `/venues/bookings/:id` | Cancel booking | Yes |

---

## 📊 Analytics Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/analytics/dashboard` | Dashboard data | Yes (Admin/Mod) |
| GET | `/analytics/users` | User analytics | Yes (Admin/Mod) |
| GET | `/analytics/matches` | Match analytics | Yes (Admin/Mod) |
| GET | `/admin/stats` | System statistics | Yes (Admin) |

---

## 🔍 Common Query Parameters

### Pagination

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `page` | integer | 1 | ≥ 1 | Page number |
| `limit` | integer | 10 | 1-100 | Items per page |

### Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` / `q` | string | Search query |
| `sport` | string | Filter by sport type |
| `status` | string | Filter by status |
| `fromDate` | string | Filter from date (ISO 8601) |
| `toDate` | string | Filter to date (ISO 8601) |

---

## 📝 Common Request Examples

### Register User

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "profile": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Create Match

```bash
POST /api/v1/matches
Authorization: Bearer <token>
Content-Type: application/json

{
  "sport": "football",
  "schedule": {
    "date": "2025-10-20",
    "time": "18:00"
  },
  "maxParticipants": 10
}
```

### Search Users

```bash
GET /api/v1/users/search?q=john&page=1&limit=10
Authorization: Bearer <token>
```

### Get Matches with Filters

```bash
GET /api/v1/matches?sport=football&status=upcoming&page=1&limit=20
Authorization: Bearer <token>
```

---

## 🚨 HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT/PATCH/DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input/validation error |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate/conflict error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 🔒 Authentication Header

Include in all authenticated requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚡ Rate Limits

| Category | Limit | Window |
|----------|-------|--------|
| Auth endpoints | 20 req | 15 min |
| General API | 100 req | 15 min |
| File uploads | 10 req | 15 min |

---

## 📚 Related Documentation

- **[Complete API Reference](./COMPLETE_API_REFERENCE.md)** - Full detailed documentation
- **[API Documentation](./API_DOCUMENTATION.md)** - Extended documentation
- **[Swagger UI](/api/v1/docs)** - Interactive API explorer

---

**Base URL:** `/api/v1`  
**API Version:** 2.0.0  
**Last Updated:** October 2025
