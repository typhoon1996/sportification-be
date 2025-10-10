# Security & API Keys

## Features

- API key management
- Security dashboard
- Audit logs
- Security metrics
- Alert management
- Access control
- Rate limiting configuration
- IP whitelisting
- Permission management

## Endpoints

### API Key Management

- `POST /api/v1/api-keys` → Create a new API key (requires auth)
- `GET /api/v1/api-keys` → List all user's API keys (requires auth)
- `GET /api/v1/api-keys/stats` → Get API key usage statistics (requires auth)
- `GET /api/v1/api-keys/:keyId` → Get specific API key details (requires auth)
- `PATCH /api/v1/api-keys/:keyId` → Update API key settings (requires auth)
- `DELETE /api/v1/api-keys/:keyId` → Delete/revoke an API key (requires auth)
- `POST /api/v1/api-keys/:keyId/regenerate` → Regenerate API key (requires auth)

### Security Monitoring

- `GET /api/v1/security/dashboard` → Get security dashboard (requires auth)
- `GET /api/v1/security/audit-logs` → Get audit logs (requires auth)
- `GET /api/v1/security/metrics` → Get security metrics (requires auth)
- `GET /api/v1/security/alerts` → Get security alerts (requires auth)
- `POST /api/v1/security/alerts/:alertId/acknowledge` → Acknowledge security alert (requires auth)

## Request/Response Examples

### Create API Key

**Request:**
```http
POST /api/v1/api-keys
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Mobile App Production",
  "permissions": ["matches:read", "tournaments:read", "users:read", "chats:write"],
  "allowedIPs": ["203.0.113.0", "198.51.100.0"],
  "expiresInDays": 365,
  "maxRequests": 1000,
  "windowMs": 900000
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "apiKey": {
      "_id": "60d5ecb54b24a50015c4d9a0",
      "name": "Mobile App Production",
      "key": "sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
      "permissions": ["matches:read", "tournaments:read", "users:read", "chats:write"],
      "allowedIPs": ["203.0.113.0", "198.51.100.0"],
      "maxRequests": 1000,
      "windowMs": 900000,
      "expiresAt": "2025-01-15T10:30:00.000Z",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "API key created successfully. Store it securely as it won't be shown again."
}
```

### List API Keys

**Request:**
```http
GET /api/v1/api-keys?page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "apiKeys": [
      {
        "_id": "60d5ecb54b24a50015c4d9a0",
        "name": "Mobile App Production",
        "keyPreview": "sk_live_...o5p6",
        "permissions": ["matches:read", "tournaments:read", "users:read", "chats:write"],
        "allowedIPs": ["203.0.113.0", "198.51.100.0"],
        "usage": {
          "requestsToday": 245,
          "requestsThisWeek": 1567,
          "requestsThisMonth": 6234
        },
        "isActive": true,
        "expiresAt": "2025-01-15T10:30:00.000Z",
        "lastUsed": "2024-01-15T09:45:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "_id": "60d5ecb54b24a50015c4d9a1",
        "name": "Development Testing",
        "keyPreview": "sk_test_...x7y8",
        "permissions": ["matches:read", "tournaments:read"],
        "usage": {
          "requestsToday": 12,
          "requestsThisWeek": 89,
          "requestsThisMonth": 234
        },
        "isActive": true,
        "expiresAt": "2024-04-15T10:30:00.000Z",
        "lastUsed": "2024-01-15T08:20:00.000Z",
        "createdAt": "2024-01-10T10:30:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "pages": 1
  }
}
```

### Get API Key Statistics

**Request:**
```http
GET /api/v1/api-keys/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalKeys": 2,
      "activeKeys": 2,
      "expiredKeys": 0,
      "totalRequests": {
        "today": 257,
        "thisWeek": 1656,
        "thisMonth": 6468
      },
      "requestsByKey": [
        {
          "keyId": "60d5ecb54b24a50015c4d9a0",
          "name": "Mobile App Production",
          "requests": 6234
        },
        {
          "keyId": "60d5ecb54b24a50015c4d9a1",
          "name": "Development Testing",
          "requests": 234
        }
      ],
      "topEndpoints": [
        {
          "endpoint": "GET /api/v1/matches",
          "requests": 2345
        },
        {
          "endpoint": "GET /api/v1/tournaments",
          "requests": 1567
        }
      ]
    }
  }
}
```

### Get API Key Details

**Request:**
```http
GET /api/v1/api-keys/60d5ecb54b24a50015c4d9a0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "apiKey": {
      "_id": "60d5ecb54b24a50015c4d9a0",
      "name": "Mobile App Production",
      "keyPreview": "sk_live_...o5p6",
      "permissions": ["matches:read", "tournaments:read", "users:read", "chats:write"],
      "allowedIPs": ["203.0.113.0", "198.51.100.0"],
      "maxRequests": 1000,
      "windowMs": 900000,
      "usage": {
        "requestsToday": 245,
        "requestsThisWeek": 1567,
        "requestsThisMonth": 6234,
        "lastHourRequests": [
          { "timestamp": "2024-01-15T10:00:00.000Z", "count": 15 },
          { "timestamp": "2024-01-15T09:00:00.000Z", "count": 23 }
        ]
      },
      "recentActivity": [
        {
          "timestamp": "2024-01-15T09:45:00.000Z",
          "endpoint": "GET /api/v1/matches",
          "ip": "203.0.113.0",
          "statusCode": 200
        }
      ],
      "isActive": true,
      "expiresAt": "2025-01-15T10:30:00.000Z",
      "lastUsed": "2024-01-15T09:45:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Update API Key

**Request:**
```http
PATCH /api/v1/api-keys/60d5ecb54b24a50015c4d9a0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Mobile App Production (Updated)",
  "permissions": ["matches:read", "tournaments:read", "users:read", "chats:write", "notifications:read"],
  "maxRequests": 2000,
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "apiKey": {
      "_id": "60d5ecb54b24a50015c4d9a0",
      "name": "Mobile App Production (Updated)",
      "permissions": ["matches:read", "tournaments:read", "users:read", "chats:write", "notifications:read"],
      "maxRequests": 2000,
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  },
  "message": "API key updated successfully"
}
```

### Regenerate API Key

**Request:**
```http
POST /api/v1/api-keys/60d5ecb54b24a50015c4d9a0/regenerate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "apiKey": {
      "_id": "60d5ecb54b24a50015c4d9a0",
      "key": "sk_live_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4",
      "name": "Mobile App Production (Updated)",
      "regeneratedAt": "2024-01-15T11:30:00.000Z"
    }
  },
  "message": "API key regenerated successfully. Update your applications immediately as the old key is now invalid."
}
```

### Delete API Key

**Request:**
```http
DELETE /api/v1/api-keys/60d5ecb54b24a50015c4d9a0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

### Get Security Dashboard

**Request:**
```http
GET /api/v1/security/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dashboard": {
      "overview": {
        "securityScore": 92,
        "activeThreats": 0,
        "recentIncidents": 2,
        "lastAuditDate": "2024-01-10T00:00:00.000Z"
      },
      "recentEvents": [
        {
          "type": "login_success",
          "timestamp": "2024-01-15T10:30:00.000Z",
          "ip": "203.0.113.45",
          "userAgent": "Mozilla/5.0...",
          "location": "New York, USA"
        },
        {
          "type": "password_change",
          "timestamp": "2024-01-14T15:20:00.000Z",
          "ip": "203.0.113.45",
          "status": "success"
        },
        {
          "type": "failed_login",
          "timestamp": "2024-01-13T08:15:00.000Z",
          "ip": "198.51.100.23",
          "reason": "Invalid password",
          "severity": "medium"
        }
      ],
      "statistics": {
        "loginAttempts": {
          "successful": 145,
          "failed": 3,
          "successRate": 98
        },
        "apiKeyUsage": {
          "totalRequests": 6468,
          "invalidKeyAttempts": 0
        },
        "ipAddresses": {
          "unique": 5,
          "flagged": 0
        }
      },
      "trends": {
        "loginActivity": [
          { "date": "2024-01-15", "successful": 25, "failed": 0 },
          { "date": "2024-01-14", "successful": 32, "failed": 1 }
        ]
      },
      "recommendations": [
        "Enable two-factor authentication for enhanced security",
        "Review and rotate API keys older than 6 months"
      ]
    }
  }
}
```

### Get Audit Logs

**Request:**
```http
GET /api/v1/security/audit-logs?page=1&limit=50&severity=high&startDate=2024-01-01T00:00:00.000Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "60d5ecb54b24a50015c4daa0",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "userId": "60d5ecb54b24a50015c4d1a0",
        "action": "password_change",
        "resource": "user_account",
        "severity": "medium",
        "details": {
          "oldPasswordHash": "sha256:...",
          "ip": "203.0.113.45",
          "userAgent": "Mozilla/5.0..."
        },
        "status": "success"
      },
      {
        "_id": "60d5ecb54b24a50015c4daa1",
        "timestamp": "2024-01-14T18:45:00.000Z",
        "userId": "60d5ecb54b24a50015c4d1a0",
        "action": "api_key_created",
        "resource": "api_keys",
        "severity": "high",
        "details": {
          "keyName": "Mobile App Production",
          "permissions": ["matches:read", "tournaments:read"]
        },
        "status": "success"
      },
      {
        "_id": "60d5ecb54b24a50015c4daa2",
        "timestamp": "2024-01-13T08:15:00.000Z",
        "userId": null,
        "action": "failed_login",
        "resource": "authentication",
        "severity": "high",
        "details": {
          "email": "john.doe@example.com",
          "ip": "198.51.100.23",
          "reason": "Invalid password",
          "attemptNumber": 3
        },
        "status": "failed"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "pages": 5
  }
}
```

### Get Security Metrics

**Request:**
```http
GET /api/v1/security/metrics?period=7d
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkjXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "period": "7d",
      "authentication": {
        "totalAttempts": 1245,
        "successfulLogins": 1198,
        "failedLogins": 47,
        "successRate": 96.2,
        "uniqueIPs": 156,
        "suspiciousIPs": 2
      },
      "apiSecurity": {
        "totalRequests": 45678,
        "validRequests": 45234,
        "invalidKeyAttempts": 12,
        "rateLimitExceeded": 432
      },
      "threats": {
        "blocked": 15,
        "detected": 23,
        "resolved": 21,
        "active": 2
      },
      "vulnerabilities": {
        "critical": 0,
        "high": 0,
        "medium": 2,
        "low": 5
      },
      "incidents": {
        "total": 8,
        "resolved": 6,
        "investigating": 2
      }
    }
  }
}
```

### Get Security Alerts

**Request:**
```http
GET /api/v1/security/alerts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "_id": "60d5ecb54b24a50015c4dab0",
        "type": "suspicious_login",
        "severity": "high",
        "title": "Login from new location",
        "message": "Login detected from London, UK - This is a new location for your account",
        "timestamp": "2024-01-15T08:30:00.000Z",
        "status": "active",
        "details": {
          "ip": "198.51.100.89",
          "location": "London, UK",
          "device": "iPhone 13"
        },
        "actions": [
          {
            "type": "acknowledge",
            "label": "This was me"
          },
          {
            "type": "deny",
            "label": "Not me - secure my account"
          }
        ]
      },
      {
        "_id": "60d5ecb54b24a50015c4dab1",
        "type": "api_key_expiring",
        "severity": "medium",
        "title": "API Key expiring soon",
        "message": "Your API key 'Mobile App Production' expires in 30 days",
        "timestamp": "2024-01-15T00:00:00.000Z",
        "status": "active",
        "details": {
          "keyName": "Mobile App Production",
          "expiresAt": "2024-02-15T10:30:00.000Z",
          "daysRemaining": 30
        },
        "actions": [
          {
            "type": "extend",
            "label": "Extend expiration"
          }
        ]
      }
    ]
  }
}
```

### Acknowledge Security Alert

**Request:**
```http
POST /api/v1/security/alerts/60d5ecb54b24a50015c4dab0/acknowledge
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "action": "acknowledge",
  "note": "Confirmed - this was me logging in from vacation"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Alert acknowledged successfully",
  "data": {
    "alert": {
      "_id": "60d5ecb54b24a50015c4dab0",
      "status": "acknowledged",
      "acknowledgedAt": "2024-01-15T10:45:00.000Z"
    }
  }
}
```

## Query Parameters

### List API Keys (`/api-keys`)
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Results per page

### Get Audit Logs (`/security/audit-logs`)
- `page` (default: 1) - Page number
- `limit` (default: 50, max: 100) - Results per page
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `severity` - Filter by severity (low, medium, high, critical)
- `userId` - Filter by user ID

### Get Security Metrics (`/security/metrics`)
- `period` (default: 7d) - Time period (24h, 7d, 30d, 90d)

## API Key Permissions

Available permissions for API keys:
- `matches:read` - Read matches
- `matches:write` - Create/update matches
- `tournaments:read` - Read tournaments
- `tournaments:write` - Create/update tournaments
- `users:read` - Read user data
- `chats:read` - Read chat messages
- `chats:write` - Send messages
- `notifications:read` - Read notifications
- `venues:read` - Read venues
- `admin:*` - Admin access (use with caution)

## Notes on Auth/Security

### JWT Authentication Required
All endpoints require authentication:
```http
Authorization: Bearer <jwt_token>
```

### API Key Authentication
For programmatic access, use API keys:
```http
X-API-Key: sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Rate Limiting
- API key creation: **5 keys per day per user**
- Security queries: **60 requests per 15 minutes**
- Audit log access: **30 requests per 15 minutes**

### Best Practices
1. Rotate API keys every 6 months
2. Use separate keys for different applications
3. Implement IP whitelisting when possible
4. Monitor API key usage regularly
5. Revoke unused keys immediately
6. Store keys securely (environment variables, secret managers)
7. Never commit keys to version control

## Real-time Requirements

### WebSocket Events

**Security Alert:**
```javascript
socket.on('security-alert', (alert) => {
  console.log('Security alert:', alert);
  // Show alert notification to user
});
```

**Suspicious Activity:**
```javascript
socket.on('suspicious-activity', (activity) => {
  console.log('Suspicious activity detected:', activity);
  // Prompt user to verify activity
});
```

## Audit Log Events

All security-sensitive actions are logged:
- User login/logout
- Password changes
- API key creation/deletion/regeneration
- Permission changes
- Failed authentication attempts
- Account setting changes
- Data access/modifications
