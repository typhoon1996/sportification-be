# Authentication & User Management

## Features

- User registration with email/password
- User login with JWT token generation
- OAuth authentication (Google, GitHub, Facebook)
- Token refresh mechanism
- Password management (change, forgot, reset)
- Multi-factor authentication (MFA/2FA)
- Profile management
- Security settings
- Session management

## Endpoints

### Registration & Login

- `POST /api/v1/auth/register` → Register a new user account
- `POST /api/v1/auth/login` → Login and receive JWT tokens
- `POST /api/v1/auth/logout` → Logout and invalidate refresh token

### Token Management

- `POST /api/v1/auth/refresh` → Refresh access token using refresh token

### Profile Management

- `GET /api/v1/auth/profile` → Get current user profile (requires auth)
- `PATCH /api/v1/auth/profile` → Update current user profile (requires auth)
- `PATCH /api/v1/auth/change-password` → Change password (requires auth)

### OAuth Providers

- `GET /api/v1/auth/google` → Initiate Google OAuth flow
- `GET /api/v1/auth/google/callback` → Google OAuth callback
- `GET /api/v1/auth/github` → Initiate GitHub OAuth flow
- `GET /api/v1/auth/github/callback` → GitHub OAuth callback
- `GET /api/v1/auth/facebook` → Initiate Facebook OAuth flow
- `GET /api/v1/auth/facebook/callback` → Facebook OAuth callback

### Password Recovery

- `POST /api/v1/auth/forgot-password` → Request password reset email
- `POST /api/v1/auth/reset-password` → Reset password with token from email

### Multi-Factor Authentication

- `POST /api/v1/auth/mfa/setup` → Setup MFA (get QR code for authenticator app)
- `POST /api/v1/auth/mfa/verify` → Verify MFA setup with code
- `POST /api/v1/auth/mfa/disable` → Disable MFA
- `POST /api/v1/auth/verify-mfa` → Verify MFA code during login

### Security

- `GET /api/v1/auth/security` → Get security settings and active sessions

## Request/Response Examples

### Register User

**Request:**
```http
POST /api/v1/auth/register
Content-Type: application/json

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
      "profile": {
        "bio": "Tennis enthusiast",
        "location": "New York, NY",
        "sports": ["tennis", "basketball"],
        "skillLevel": "intermediate"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  },
  "message": "User registered successfully"
}
```

### Login User

**Request:**
```http
POST /api/v1/auth/login
Content-Type: application/json

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
      "username": "johndoe"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  },
  "message": "Login successful"
}
```

### Refresh Token

**Request:**
```http
POST /api/v1/auth/refresh
Content-Type: application/json

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
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### Get Profile

**Request:**
```http
GET /api/v1/auth/profile
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
        "location": "New York, NY",
        "sports": ["tennis", "basketball"],
        "skillLevel": "intermediate",
        "avatar": "https://example.com/avatar.jpg"
      },
      "stats": {
        "matchesPlayed": 25,
        "matchesWon": 18,
        "winRate": 72,
        "tournamentsJoined": 5,
        "tournamentsWon": 2
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

### Update Profile

**Request:**
```http
PATCH /api/v1/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "profile": {
    "bio": "Professional tennis player",
    "location": "Los Angeles, CA",
    "sports": ["tennis", "basketball", "volleyball"],
    "skillLevel": "advanced"
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
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Smith",
      "username": "johndoe",
      "profile": {
        "bio": "Professional tennis player",
        "location": "Los Angeles, CA",
        "sports": ["tennis", "basketball", "volleyball"],
        "skillLevel": "advanced"
      },
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  },
  "message": "Profile updated successfully"
}
```

### Change Password

**Request:**
```http
PATCH /api/v1/auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Forgot Password

**Request:**
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Reset Password

**Request:**
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Setup MFA

**Request:**
```http
POST /api/v1/auth/mfa/setup
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backupCodes": [
      "12345678",
      "87654321",
      "11223344"
    ]
  },
  "message": "MFA setup initiated. Scan QR code with authenticator app."
}
```

### Verify MFA Setup

**Request:**
```http
POST /api/v1/auth/mfa/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "MFA enabled successfully"
}
```

### MFA Login Verification

**Request:**
```http
POST /api/v1/auth/verify-mfa
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60d5ecb54b24a50015c4d1a0",
      "email": "john.doe@example.com"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

## Query Parameters

### None for most endpoints

OAuth callback endpoints may include state and code parameters handled by the server.

## Notes on Auth/Security

### JWT Authentication
- All authenticated endpoints require `Authorization: Bearer <token>` header
- Access tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Use `/auth/refresh` endpoint before access token expires

### Rate Limiting
- Auth endpoints are rate-limited to **5 requests per 15 minutes per IP**
- Failed login attempts trigger additional security measures after 5 attempts

### Password Requirements
- Minimum 8 characters
- Must include uppercase, lowercase, number, and special character
- Cannot be a common password

### MFA/2FA
- Optional but recommended for enhanced security
- Uses TOTP (Time-based One-Time Password) algorithm
- Compatible with Google Authenticator, Authy, etc.
- Backup codes provided for account recovery

### OAuth Integration
- Supports Google, GitHub, and Facebook
- Automatically creates user account on first OAuth login
- Links OAuth account to existing account if email matches

### Security Best Practices
- Store JWT tokens securely (HttpOnly cookies recommended)
- Never expose tokens in URLs or client-side logs
- Implement automatic token refresh before expiration
- Clear all tokens on logout
- Use HTTPS in production

## Real-time Requirements

### WebSocket Authentication
After establishing WebSocket connection, authenticate:

```javascript
socket.emit('authenticate', accessToken);

socket.on('authenticated', (data) => {
  console.log('Authenticated as:', data.user);
});
```

### Session Events
- `user-status-changed` - User online/offline status updates
- `session-expired` - Server notifies client of session expiration
- `force-logout` - Admin-triggered logout event
