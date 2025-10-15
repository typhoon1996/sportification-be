# Sportification API - Postman Collection

Complete Postman collection for testing all 104 endpoints of the Sportification API.

## 📦 Collection Structure

```
postman/
├── Sportification-API.postman_collection.json  # Main collection file
└── modules/                                     # Module-specific endpoints
    ├── 01-IAM-Authentication.json              # 7 endpoints
    ├── 02-Users.json                           # 7 endpoints
    ├── 03-Matches.json                         # 8 endpoints
    ├── 04-Tournaments.json                     # 8 endpoints
    ├── 05-Teams.json                           # 7 endpoints
    ├── 06-Venues.json                          # 5 endpoints
    ├── 07-Venue-Bookings.json                  # 15 endpoints
    ├── 08-Chat.json                            # 4 endpoints
    ├── 09-Notifications.json                   # 5 endpoints
    ├── 10-Analytics.json                       # 4 endpoints
    ├── 11-System.json                          # 4 endpoints
    ├── 12-API-Keys.json                        # 7 endpoints
    ├── 13-Security.json                        # 5 endpoints
    └── 14-Admin-Analytics.json                 # 14 endpoints
```

## 🚀 Quick Start

### 1. Import Collection

**Option A: Import Main Collection**

1. Open Postman
2. Click **Import** button
3. Select `Sportification-API.postman_collection.json`
4. All endpoints will be imported with proper folder structure

**Option B: Import Individual Modules**

1. Open Postman
2. Click **Import** button
3. Select specific module JSON files from `modules/` folder
4. Each module will be imported as a separate folder

### 2. Set Up Environment Variables

Create a new environment in Postman with these variables:

| Variable | Initial Value | Description |
|----------|--------------|-------------|
| `baseUrl` | `http://localhost:3000/api/v1` | API base URL |
| `accessToken` | *(auto-set)* | JWT access token (set by login) |
| `refreshToken` | *(auto-set)* | JWT refresh token (set by login) |
| `userId` | *(auto-set)* | Current user ID (set by register/login) |
| `matchId` | *(auto-set)* | Match ID (set by create match) |
| `tournamentId` | *(auto-set)* | Tournament ID (set by create tournament) |
| `teamId` | *(auto-set)* | Team ID (set by create team) |
| `venueId` | *(auto-set)* | Venue ID (set by create venue) |
| `bookingId` | *(auto-set)* | Booking ID (set by create booking) |
| `chatId` | *(auto-set)* | Chat ID (set by create chat) |
| `notificationId` | *(manual)* | Notification ID |
| `apiKeyId` | *(auto-set)* | API Key ID (set by create API key) |

**Note**: Variables marked as *(auto-set)* are automatically captured from API responses using test scripts.

### 3. Authentication Flow

Follow this sequence to get started:

1. **Register User** (`01-IAM-Authentication` → `Register User`)
   - Creates new user account
   - Auto-captures: `accessToken`, `refreshToken`, `userId`

2. **Login** (if already registered)
   - Use `Login` endpoint instead
   - Auto-captures: `accessToken`, `refreshToken`, `userId`

3. **Start Testing**
   - All authenticated endpoints now have the Bearer token
   - Create entities (matches, teams, venues, etc.)
   - IDs are auto-captured for subsequent requests

## 📋 Module Descriptions

### 1. IAM/Authentication (7 endpoints)

- User registration and email verification
- Login/Logout with JWT tokens
- Password reset workflow
- Token refresh

**Key Endpoints:**

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token

### 2. Users (7 endpoints)

- User profile management
- Friend system
- User search

**Key Endpoints:**

- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update profile
- `POST /users/friends/:userId` - Add friend

### 3. Matches (8 endpoints)

- Create and manage sports matches
- Join/leave matches
- Update scores
- Filter by status and sport

**Key Endpoints:**

- `POST /matches` - Create match
- `POST /matches/:id/join` - Join match
- `PATCH /matches/:id/score` - Update score

### 4. Tournaments (8 endpoints)

- Tournament organization
- Bracket management
- Registration and participation

**Key Endpoints:**

- `POST /tournaments` - Create tournament
- `GET /tournaments/:id/bracket` - Get bracket
- `POST /tournaments/:id/join` - Join tournament

### 5. Teams (7 endpoints)

- Team creation and management
- Member invitations
- Captain designation

**Key Endpoints:**

- `POST /teams` - Create team
- `POST /teams/:id/join` - Join team
- `DELETE /teams/:id/leave` - Leave team

### 6. Venues (5 endpoints)

- Sports venue management
- GeoJSON location support
- Facility listings

**Key Endpoints:**

- `POST /venues` - Create venue
- `GET /venues` - List all venues
- `GET /venues/:id` - Get venue details

### 7. Venue Bookings (15 endpoints)

- Book venue time slots
- Check-in/Complete workflow
- Payment processing
- Availability checking
- Promo codes and refunds

**Key Endpoints:**

- `POST /venues/:venueId/bookings` - Create booking
- `GET /venues/:venueId/bookings/availability` - Check availability
- `POST /venues/:venueId/bookings/:id/checkin` - Check-in
- `POST /venues/:venueId/bookings/:id/payment` - Process payment

### 8. Chat (4 endpoints)

- Create chat rooms (match, tournament, team, direct)
- Send and receive messages
- Real-time messaging support

**Key Endpoints:**

- `POST /chats` - Create chat room
- `POST /chats/:id/messages` - Send message
- `GET /chats/:id/messages` - Get messages

### 9. Notifications (5 endpoints)

- User notifications
- Read/unread status
- Bulk operations

**Key Endpoints:**

- `GET /notifications` - Get notifications
- `PATCH /notifications/:id/read` - Mark as read
- `GET /notifications/unread/count` - Get unread count

### 10. Analytics (4 endpoints)

- User activity tracking
- Performance metrics
- Match statistics

**Key Endpoints:**

- `GET /analytics/activity` - Get user activity
- `GET /analytics/performance` - Performance metrics
- `GET /analytics/matches/stats` - Match statistics

### 11. System (4 endpoints)

- Health checks
- API information
- Swagger documentation

**Key Endpoints:**

- `GET /health` - Health check (no auth)
- `GET /` - API info
- `GET /docs` - Swagger UI

### 12. API Keys (7 endpoints)

- Third-party integration keys
- Permission management
- Usage statistics

**Key Endpoints:**

- `POST /api-keys` - Create API key
- `POST /api-keys/:id/regenerate` - Regenerate key
- `GET /api-keys/:id/stats` - Usage stats

### 13. Security (5 endpoints)

- Two-factor authentication
- Session management
- Audit logs

**Key Endpoints:**

- `POST /security/2fa/enable` - Enable 2FA
- `GET /security/sessions` - Active sessions
- `GET /security/audit-logs` - Audit logs

### 14. Admin Analytics (14 endpoints)

- User growth and retention
- Revenue analytics
- System performance
- Geographic distribution

**Key Endpoints:**

- `GET /admin/analytics/users/growth` - User growth
- `GET /admin/analytics/revenue` - Revenue analytics
- `POST /admin/analytics/export` - Export reports

## 🔐 Authentication

All endpoints (except System endpoints) require JWT authentication.

### Bearer Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The collection automatically:

1. Captures `accessToken` from Register/Login responses
2. Sets it in the environment variable
3. Applies it to all subsequent requests via `{{accessToken}}`

### Token Refresh

When access token expires (7 days):

1. Use `Refresh Token` endpoint
2. Provide `refreshToken` in Authorization header
3. New `accessToken` is auto-captured

## 📊 Test Scripts

Many requests include test scripts that automatically:

- **Capture IDs**: New entity IDs are saved to environment variables
- **Capture Tokens**: Access and refresh tokens are auto-saved
- **Validate Responses**: Check for successful status codes

Example test script (from Register User):

```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    if (response.data && response.data.user) {
        pm.environment.set('userId', response.data.user._id);
        pm.environment.set('accessToken', response.data.accessToken);
        pm.environment.set('refreshToken', response.data.refreshToken);
    }
}
```

## 🎯 Common Workflows

### Workflow 1: New User Registration

1. `Register User` → Auto-captures tokens and userId
2. `Verify Email` (if email verification enabled)
3. `Get My Profile` → View profile
4. `Update Profile` → Set preferences

### Workflow 2: Create and Join Match

1. `Create Venue` → Auto-captures venueId
2. `Create Match` → Auto-captures matchId
3. Register second user (or use existing)
4. Second user: `Join Match`
5. Update match score: `Update Score`

### Workflow 3: Book a Venue

1. `Get All Venues` → Find venue
2. `Check Availability` → Verify time slot
3. `Create Booking` → Auto-captures bookingId
4. `Process Payment`
5. `Check-In Booking`
6. `Complete Booking`

### Workflow 4: Tournament Management

1. `Create Tournament` → Auto-captures tournamentId
2. Multiple users: `Join Tournament`
3. Admin: `Get Bracket` → View bracket structure
4. Update match results
5. View tournament progress

## 🔧 Configuration

### Base URL

- **Local**: `http://localhost:3000/api/v1`
- **Development**: `https://dev-api.sportification.com/api/v1`
- **Production**: `https://api.sportification.com/api/v1`

Update the `baseUrl` environment variable for different environments.

### API Version

Current version: `v1`

All endpoints are prefixed with `/api/v1`

## 📝 Request Examples

### Creating a Match

```json
POST /api/v1/matches
Authorization: Bearer {{accessToken}}

{
  "sport": "football",
  "schedule": {
    "date": "2025-10-20",
    "time": "18:00"
  },
  "venue": "{{venueId}}",
  "maxParticipants": 22,
  "description": "Friendly match"
}
```

### Filtering Matches

```
GET /api/v1/matches?status=upcoming&sport=football&page=1&limit=10
```

### Booking a Venue

```json
POST /api/v1/venues/{{venueId}}/bookings
Authorization: Bearer {{accessToken}}

{
  "startTime": "2025-10-20T14:00:00Z",
  "endTime": "2025-10-20T16:00:00Z",
  "purpose": "Team practice",
  "notes": "Need extra equipment"
}
```

## 🚨 Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Successful GET/PATCH request |
| 201 | Created | Successful POST request (resource created) |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Validation error or malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Business rule violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## 🔄 Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "match": {
      "_id": "507f1f77bcf86cd799439011",
      "sport": "football",
      "status": "upcoming"
    }
  },
  "message": "Match created successfully"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Sport is required",
    "Date must be in the future"
  ],
  "code": "VALIDATION_ERROR"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "matches": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

## 🛠️ Troubleshooting

### Issue: 401 Unauthorized

**Solution**:

1. Run `Register User` or `Login` to get fresh tokens
2. Check that `accessToken` environment variable is set
3. Verify token hasn't expired (7 day expiry)

### Issue: Environment variables not auto-setting

**Solution**:

1. Ensure environment is selected in Postman (top-right dropdown)
2. Check test scripts are enabled (Settings → General → Allow test scripts)
3. Re-run authentication requests

### Issue: 404 Not Found on resource-specific endpoints

**Solution**:

1. Verify the resource ID environment variable is set (e.g., `matchId`)
2. Create the resource first using POST endpoint
3. Check that ID was captured (view environment variables)

### Issue: 403 Forbidden on admin endpoints

**Solution**:

1. Admin endpoints require admin role
2. Contact system administrator to upgrade account
3. Use regular user endpoints instead

## 📖 Additional Resources

- **API Documentation**: <http://localhost:3000/api/v1/docs>
- **Swagger JSON**: <http://localhost:3000/api/v1/docs/swagger.json>
- **GitHub Repository**: [Link to repo]
- **Backend Guide**: See `.github/copilot-instructions.md`

## 🤝 Contributing

To add new endpoints to the collection:

1. Create request in appropriate module JSON file
2. Add test scripts to auto-capture IDs
3. Include realistic request body examples
4. Document query parameters
5. Update this README with new endpoint info

## 📄 License

Internal use only - Sportification Backend Team

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Total Endpoints**: 104  
**Modules**: 14
