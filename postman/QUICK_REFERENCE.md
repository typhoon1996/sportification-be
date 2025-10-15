# Postman Quick Reference Guide

Quick reference for the most commonly used Sportification API endpoints.

## 🚀 Getting Started (3 Steps)

### 1. Authentication

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

✅ Auto-captures: `accessToken`, `refreshToken`, `userId`

### 2. Create Your First Venue

```http
POST /api/v1/venues
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "name": "Downtown Sports Complex",
  "location": {
    "type": "Point",
    "coordinates": [-73.935242, 40.730610]
  },
  "facilities": ["Football Field", "Basketball Court"]
}
```

✅ Auto-captures: `venueId`

### 3. Create Your First Match

```http
POST /api/v1/matches
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "sport": "football",
  "schedule": {
    "date": "2025-10-20",
    "time": "18:00"
  },
  "venue": "{{venueId}}",
  "maxParticipants": 22
}
```

✅ Auto-captures: `matchId`

---

## 🔐 Authentication Endpoints

### Register

```http
POST /auth/register
Body: { email, password, firstName, lastName }
Returns: accessToken, refreshToken, user
```

### Login

```http
POST /auth/login
Body: { email, password }
Returns: accessToken, refreshToken, user
```

### Refresh Token

```http
POST /auth/refresh
Authorization: Bearer {{refreshToken}}
Returns: new accessToken
```

### Logout

```http
POST /auth/logout
Authorization: Bearer {{accessToken}}
Returns: success message
```

---

## 👤 User Endpoints

### Get My Profile

```http
GET /users/me
Authorization: Bearer {{accessToken}}
Returns: user profile with preferences
```

### Update Profile

```http
PATCH /users/me
Authorization: Bearer {{accessToken}}
Body: { profile: { bio, location, interests } }
Returns: updated user
```

### Search Users

```http
GET /users/search?query=john&page=1&limit=10
Authorization: Bearer {{accessToken}}
Returns: users matching query
```

### Add Friend

```http
POST /users/friends/:userId
Authorization: Bearer {{accessToken}}
Returns: success message
```

---

## ⚽ Match Endpoints

### Create Match

```http
POST /matches
Authorization: Bearer {{accessToken}}
Body: {
  sport, schedule: { date, time }, 
  venue, maxParticipants
}
Returns: created match
```

### Get Matches

```http
GET /matches?status=upcoming&sport=football&page=1
Authorization: Bearer {{accessToken}}
Returns: paginated matches
```

### Join Match

```http
POST /matches/:matchId/join
Authorization: Bearer {{accessToken}}
Returns: updated match
```

### Update Score

```http
PATCH /matches/:matchId/score
Authorization: Bearer {{accessToken}}
Body: { homeScore: 2, awayScore: 1 }
Returns: updated match
```

---

## 🏆 Tournament Endpoints

### Create Tournament

```http
POST /tournaments
Authorization: Bearer {{accessToken}}
Body: {
  name, sport, format,
  startDate, maxParticipants
}
Returns: created tournament
```

### Get Tournaments

```http
GET /tournaments?status=upcoming&page=1
Authorization: Bearer {{accessToken}}
Returns: paginated tournaments
```

### Join Tournament

```http
POST /tournaments/:tournamentId/join
Authorization: Bearer {{accessToken}}
Returns: updated tournament
```

### Get Bracket

```http
GET /tournaments/:tournamentId/bracket
Authorization: Bearer {{accessToken}}
Returns: tournament bracket structure
```

---

## 👥 Team Endpoints

### Create Team

```http
POST /teams
Authorization: Bearer {{accessToken}}
Body: {
  name, sport, description,
  maxMembers, isPrivate
}
Returns: created team
```

### Get Teams

```http
GET /teams?sport=football&page=1
Authorization: Bearer {{accessToken}}
Returns: paginated teams
```

### Join Team

```http
POST /teams/:teamId/join
Authorization: Bearer {{accessToken}}
Returns: updated team
```

---

## 📍 Venue Endpoints

### Create Venue

```http
POST /venues
Authorization: Bearer {{accessToken}}
Body: {
  name, 
  location: { type: "Point", coordinates: [lng, lat] },
  facilities: []
}
Returns: created venue
```

### Get Venues

```http
GET /venues?page=1&limit=10
Authorization: Bearer {{accessToken}}
Returns: paginated venues
```

### Get Venue Details

```http
GET /venues/:venueId
Authorization: Bearer {{accessToken}}
Returns: venue with full details
```

---

## 📅 Booking Endpoints

### Create Booking

```http
POST /venues/:venueId/bookings
Authorization: Bearer {{accessToken}}
Body: {
  startTime: "2025-10-20T14:00:00Z",
  endTime: "2025-10-20T16:00:00Z",
  purpose: "Team practice"
}
Returns: created booking
```

### Check Availability

```http
GET /venues/:venueId/bookings/availability?date=2025-10-20
Authorization: Bearer {{accessToken}}
Returns: available time slots
```

### Check-In

```http
POST /venues/:venueId/bookings/:bookingId/checkin
Authorization: Bearer {{accessToken}}
Returns: checked-in booking
```

### Process Payment

```http
POST /venues/:venueId/bookings/:bookingId/payment
Authorization: Bearer {{accessToken}}
Body: { method: "card", amount: 100 }
Returns: payment confirmation
```

---

## 💬 Chat Endpoints

### Create Chat

```http
POST /chats
Authorization: Bearer {{accessToken}}
Body: {
  type: "match",
  name: "Match Discussion",
  entityId: "{{matchId}}"
}
Returns: created chat
```

### Send Message

```http
POST /chats/:chatId/messages
Authorization: Bearer {{accessToken}}
Body: {
  content: "Hello team!",
  type: "text"
}
Returns: sent message
```

### Get Messages

```http
GET /chats/:chatId/messages?page=1&limit=50
Authorization: Bearer {{accessToken}}
Returns: paginated messages
```

---

## 🔔 Notification Endpoints

### Get Notifications

```http
GET /notifications?read=false&page=1
Authorization: Bearer {{accessToken}}
Returns: paginated notifications
```

### Mark as Read

```http
PATCH /notifications/:notificationId/read
Authorization: Bearer {{accessToken}}
Returns: updated notification
```

### Get Unread Count

```http
GET /notifications/unread/count
Authorization: Bearer {{accessToken}}
Returns: { count: number }
```

---

## 📊 Analytics Endpoints

### User Activity

```http
GET /analytics/activity?startDate=2025-01-01&endDate=2025-10-10
Authorization: Bearer {{accessToken}}
Returns: activity metrics
```

### Performance Metrics

```http
GET /analytics/performance?sport=football&timeframe=30d
Authorization: Bearer {{accessToken}}
Returns: performance stats
```

---

## 🔑 API Key Endpoints

### Create API Key

```http
POST /api-keys
Authorization: Bearer {{accessToken}}
Body: {
  name: "Mobile App",
  permissions: ["read:matches"],
  expiresAt: "2026-12-31T23:59:59Z"
}
Returns: API key with secret
```

### Get API Keys

```http
GET /api-keys?page=1
Authorization: Bearer {{accessToken}}
Returns: paginated API keys
```

---

## 🔒 Security Endpoints

### Enable 2FA

```http
POST /security/2fa/enable
Authorization: Bearer {{accessToken}}
Returns: 2FA setup details
```

### Get Active Sessions

```http
GET /security/sessions
Authorization: Bearer {{accessToken}}
Returns: list of active sessions
```

---

## 🛠️ System Endpoints

### Health Check

```http
GET /health
(No authentication required)
Returns: { status: "ok" }
```

### API Info

```http
GET /
(No authentication required)
Returns: API version and info
```

---

## 📋 Quick Filters

### Match Filters

```http
?status=upcoming          # Filter by status
?sport=football          # Filter by sport
?fromDate=2025-10-15    # From date
?toDate=2025-10-31      # To date
```

### Common Query Params

```http
?page=1                 # Page number (default: 1)
?limit=10              # Items per page (default: 10, max: 100)
?sort=createdAt        # Sort ascending
?sort=-createdAt       # Sort descending
```

---

## 🎯 Common Workflows

### New User Journey

1. Register User → Get tokens
2. Get My Profile → View profile
3. Update Profile → Set preferences
4. Search Users → Find friends

### Match Creation Flow

1. Create Venue → Get venueId
2. Create Match → Get matchId
3. Invite friends → Share matchId
4. Join Match → Participate
5. Update Score → Track results

### Booking Flow

1. Get Venues → Find venue
2. Check Availability → Find time slot
3. Create Booking → Reserve slot
4. Process Payment → Pay
5. Check-In → Arrive at venue
6. Complete → Finish booking

### Tournament Flow

1. Create Tournament → Setup
2. Users Join → Registration
3. Get Bracket → View structure
4. Play Matches → Update results
5. View Winner → Check standings

---

## ⚡ Pro Tips

1. **Auto-Capture**: Run Register/Login first to auto-capture tokens
2. **Environment Variables**: All IDs are saved automatically
3. **Pagination**: Use `?page=1&limit=10` for better performance
4. **Filtering**: Combine filters: `?status=upcoming&sport=football`
5. **Test Scripts**: Check "Tests" tab to see what's auto-captured

---

## 🚨 Common Issues

### 401 Unauthorized

→ Run Register/Login to get fresh token

### 404 Not Found

→ Create the resource first (venue, match, etc.)

### 403 Forbidden

→ Check if you have required permissions

### 429 Too Many Requests

→ Slow down, rate limit exceeded

---

## 📞 Need Help?

1. Check README.md for detailed guide
2. View Swagger docs: `GET /docs`
3. Check health: `GET /health`
4. Contact backend team

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Total Endpoints**: 104
