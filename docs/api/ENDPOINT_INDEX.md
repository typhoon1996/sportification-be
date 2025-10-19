# API Endpoint Index

**Organized index of all API endpoints grouped by functionality**

---

## By Module

### Authentication & IAM
- [Authentication Endpoints](#authentication-endpoints)
- [API Key Management](#api-key-management)
- [Security Endpoints](#security-endpoints)

### User Management
- [User Profile Endpoints](#user-profile-endpoints)
- [Friends & Social](#friends--social-endpoints)

### Sports Management
- [Match Endpoints](#match-endpoints)
- [Tournament Endpoints](#tournament-endpoints)
- [Team Endpoints](#team-endpoints)

### Venues & Bookings
- [Venue Endpoints](#venue-endpoints)
- [Booking Endpoints](#booking-endpoints)

### Communication
- [Chat Endpoints](#chat-endpoints)
- [Notification Endpoints](#notification-endpoints)

### Analytics & Admin
- [Analytics Endpoints](#analytics-endpoints)
- [Admin Endpoints](#admin-endpoints)

---

## Authentication Endpoints

### User Authentication
```
POST   /api/v1/auth/register         Register new user
POST   /api/v1/auth/login            Login user
POST   /api/v1/auth/refresh-token    Refresh access token
POST   /api/v1/auth/logout           Logout user
GET    /api/v1/auth/profile          Get authenticated user profile
```

### Account Management
```
PUT    /api/v1/auth/change-password  Change user password
DELETE /api/v1/auth/deactivate       Deactivate account
```

---

## API Key Management

```
POST   /api/v1/api-keys              Create API key (Admin)
GET    /api/v1/api-keys              List API keys (Admin)
GET    /api/v1/api-keys/:id          Get API key details (Admin)
DELETE /api/v1/api-keys/:id          Revoke API key (Admin)
```

---

## Security Endpoints

```
GET    /api/v1/security/audit-logs   Get audit logs (Admin)
GET    /api/v1/security/sessions     Get active sessions
DELETE /api/v1/security/sessions/:id Revoke session
POST   /api/v1/security/mfa/enable   Enable MFA
POST   /api/v1/security/mfa/verify   Verify MFA token
```

---

## User Profile Endpoints

### User Information
```
GET    /api/v1/users                 List all users (Admin/Mod)
GET    /api/v1/users/search          Search users
GET    /api/v1/users/:id             Get user by ID
```

### Profile Management
```
PUT    /api/v1/users/profile         Update own profile
PATCH  /api/v1/users/:id             Update user (Admin)
DELETE /api/v1/users/:id             Delete user (Admin)
```

---

## Friends & Social Endpoints

```
GET    /api/v1/users/:id/friends     Get user's friends
POST   /api/v1/users/:friendId/friend    Add friend
DELETE /api/v1/users/:friendId/friend    Remove friend
```

---

## Match Endpoints

### Match Management
```
POST   /api/v1/matches               Create match
GET    /api/v1/matches               List matches (with filters)
GET    /api/v1/matches/:id           Get match details
DELETE /api/v1/matches/:id           Delete match (Admin/Mod)
```

### Match Participation
```
POST   /api/v1/matches/:id/join      Join match
POST   /api/v1/matches/:id/leave     Leave match
```

### Match Updates
```
PUT    /api/v1/matches/:id/score     Update match score
PUT    /api/v1/matches/:id/status    Update match status
```

---

## Tournament Endpoints

### Tournament Management
```
POST   /api/v1/tournaments           Create tournament
GET    /api/v1/tournaments           List tournaments
GET    /api/v1/tournaments/:id       Get tournament details
DELETE /api/v1/tournaments/:id       Delete tournament (Admin/Mod)
```

### Tournament Participation
```
POST   /api/v1/tournaments/:id/join  Join tournament
POST   /api/v1/tournaments/:id/leave Leave tournament
```

### Tournament Operations
```
GET    /api/v1/tournaments/:id/bracket              Get bracket
PUT    /api/v1/tournaments/:id/match/:matchId/score Update match score
POST   /api/v1/tournaments/:id/start                Start tournament
```

---

## Team Endpoints

### Team Management
```
POST   /api/v1/teams                 Create team
GET    /api/v1/teams                 List teams (with filters)
GET    /api/v1/teams/my/teams        Get user's teams
GET    /api/v1/teams/:id             Get team details
PATCH  /api/v1/teams/:id             Update team (Captain)
DELETE /api/v1/teams/:id             Delete team (Captain/Admin)
```

### Team Membership
```
POST   /api/v1/teams/:id/join        Join team
POST   /api/v1/teams/:id/leave       Leave team
POST   /api/v1/teams/:id/members/:userId    Add member (Captain)
DELETE /api/v1/teams/:id/members/:userId    Remove member (Captain)
```

---

## Venue Endpoints

### Venue Management
```
POST   /api/v1/venues                Create venue (Admin/Mod)
GET    /api/v1/venues                List venues (with filters)
GET    /api/v1/venues/:id            Get venue details
PATCH  /api/v1/venues/:id            Update venue (Admin/Mod)
DELETE /api/v1/venues/:id            Delete venue (Admin)
```

---

## Booking Endpoints

### Booking Management
```
POST   /api/v1/venues/bookings       Create booking
GET    /api/v1/venues/bookings       List bookings
GET    /api/v1/venues/bookings/:id   Get booking details
PATCH  /api/v1/venues/bookings/:id   Update booking
DELETE /api/v1/venues/bookings/:id   Cancel booking
```

---

## Chat Endpoints

### Chat Management
```
POST   /api/v1/chats                 Create chat
GET    /api/v1/chats                 Get user's chats
GET    /api/v1/chats/:id             Get chat details
DELETE /api/v1/chats/:id             Delete chat
```

### Messaging
```
GET    /api/v1/chats/:chatId/messages          Get messages
POST   /api/v1/chats/:chatId/messages          Send message
PUT    /api/v1/chats/messages/:id              Edit message
DELETE /api/v1/chats/messages/:id              Delete message
```

---

## Notification Endpoints

### Notification Management
```
GET    /api/v1/notifications         Get notifications
GET    /api/v1/notifications/:id     Get notification
PUT    /api/v1/notifications/:id/read    Mark as read
PUT    /api/v1/notifications/read-all    Mark all as read
DELETE /api/v1/notifications/:id     Delete notification
```

### Notification Preferences
```
GET    /api/v1/notifications/preferences     Get preferences
PATCH  /api/v1/notifications/preferences     Update preferences
```

---

## Analytics Endpoints

### Dashboard Analytics
```
GET    /api/v1/analytics/dashboard   Get dashboard data (Admin/Mod)
```

### Specific Analytics
```
GET    /api/v1/analytics/users       Get user analytics (Admin/Mod)
GET    /api/v1/analytics/matches     Get match analytics (Admin/Mod)
GET    /api/v1/analytics/tournaments Get tournament analytics (Admin/Mod)
GET    /api/v1/analytics/teams       Get team analytics (Admin/Mod)
GET    /api/v1/analytics/venues      Get venue analytics (Admin/Mod)
```

---

## Admin Endpoints

### System Management
```
GET    /api/v1/admin/stats           Get system statistics (Admin)
GET    /api/v1/admin/health          Get system health (Admin)
GET    /api/v1/admin/logs            Get system logs (Admin)
```

### User Management
```
GET    /api/v1/admin/users           Get all users (Admin)
PATCH  /api/v1/admin/users/:id       Update user (Admin)
DELETE /api/v1/admin/users/:id       Delete user (Admin)
POST   /api/v1/admin/users/:id/ban   Ban user (Admin)
POST   /api/v1/admin/users/:id/unban Unban user (Admin)
```

---

## System Endpoints

### Health & Status
```
GET    /health                       API health check
GET    /api/v1                       API information
GET    /api/v1/docs                  Swagger UI
GET    /api/v1/openapi.json          OpenAPI specification
```

---

## Filtering & Sorting

### Common Query Parameters

**Pagination:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

**Filtering:**
- `search` / `q` - Search query
- `sport` - Filter by sport type
- `status` - Filter by status
- `fromDate` - Filter from date
- `toDate` - Filter to date
- `role` - Filter by role (Admin endpoints)
- `isActive` - Filter by active status

**Sorting:**
- `sort` - Field to sort by
- `order` - Sort order (asc/desc)

---

## Endpoint Permissions

### Public (No Auth Required)
- POST /auth/register
- POST /auth/login
- POST /auth/refresh-token
- GET /health
- GET /api/v1

### Authenticated Users
- All endpoints not listed in other categories

### Admin/Moderator Only
- GET /users (list all)
- POST /venues
- GET /analytics/*
- GET /admin/*

### Admin Only
- DELETE /venues/:id
- POST /admin/users/:id/ban
- GET /admin/stats

---

## Quick Navigation

- [Complete API Reference](./COMPLETE_API_REFERENCE.md) - Full documentation
- [Quick Reference Guide](./QUICK_REFERENCE.md) - Quick access tables
- [API Documentation](./API_DOCUMENTATION.md) - Extended documentation
- [Swagger UI](/api/v1/docs) - Interactive explorer

---

**Total Endpoints:** 100+  
**API Version:** 2.0.0  
**Last Updated:** October 2025
