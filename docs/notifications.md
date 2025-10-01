# Notifications System

## Features

- Real-time notification delivery
- Multiple notification types (match, tournament, chat, social, system)
- Notification preferences management
- Read/unread status tracking
- Notification statistics
- Bulk operations (mark all as read, delete all read)
- Push notification support
- Email notification integration
- Notification filtering and pagination

## Endpoints

### Notification Management

- `GET /api/v1/notifications` → Get user notifications with filtering (requires auth)
- `GET /api/v1/notifications/:id` → Get specific notification details (requires auth)
- `POST /api/v1/notifications` → Create notification (system/admin use)
- `DELETE /api/v1/notifications/:id` → Delete a notification (requires auth)

### Notification Actions

- `PUT /api/v1/notifications/:id/read` → Mark notification as read (requires auth)
- `PUT /api/v1/notifications/read-all` → Mark all notifications as read (requires auth)
- `DELETE /api/v1/notifications/read-all` → Delete all read notifications (requires auth)

### Notification Settings

- `GET /api/v1/notifications/stats` → Get notification statistics (requires auth)
- `PUT /api/v1/notifications/preferences` → Update notification preferences (requires auth)

## Request/Response Examples

### Get Notifications

**Request:**
```http
GET /api/v1/notifications?type=match&read=false&page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "60d5ecb54b24a50015c4d8a0",
        "type": "match",
        "title": "New Match Invitation",
        "message": "John Doe invited you to join a tennis match",
        "data": {
          "matchId": "60d5ecb54b24a50015c4d2a0",
          "match": {
            "sport": "tennis",
            "schedule": {
              "date": "2024-01-20T00:00:00.000Z",
              "time": "14:00"
            },
            "venue": {
              "name": "Central Park Tennis Courts"
            }
          },
          "invitedBy": {
            "_id": "60d5ecb54b24a50015c4d1a1",
            "username": "johndoe",
            "firstName": "John"
          }
        },
        "read": false,
        "actionUrl": "/matches/60d5ecb54b24a50015c4d2a0",
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "_id": "60d5ecb54b24a50015c4d8a1",
        "type": "tournament",
        "title": "Tournament Starting Soon",
        "message": "Summer Tennis Championship starts in 1 hour",
        "data": {
          "tournamentId": "60d5ecb54b24a50015c4d5a0",
          "tournament": {
            "name": "Summer Tennis Championship 2024",
            "startDate": "2024-02-01T00:00:00.000Z"
          }
        },
        "read": false,
        "actionUrl": "/tournaments/60d5ecb54b24a50015c4d5a0",
        "createdAt": "2024-01-15T09:00:00.000Z"
      },
      {
        "_id": "60d5ecb54b24a50015c4d8a2",
        "type": "social",
        "title": "New Follower",
        "message": "Jane Doe started following you",
        "data": {
          "userId": "60d5ecb54b24a50015c4d1a2",
          "user": {
            "username": "janedoe",
            "firstName": "Jane",
            "profile": {
              "avatar": "https://example.com/avatars/janedoe.jpg"
            }
          }
        },
        "read": false,
        "actionUrl": "/users/60d5ecb54b24a50015c4d1a2",
        "createdAt": "2024-01-15T08:00:00.000Z"
      },
      {
        "_id": "60d5ecb54b24a50015c4d8a3",
        "type": "chat",
        "title": "New Message",
        "message": "You have 3 unread messages from Mike Wilson",
        "data": {
          "chatId": "60d5ecb54b24a50015c4d4a0",
          "sender": {
            "_id": "60d5ecb54b24a50015c4d1a3",
            "username": "mikewilson",
            "firstName": "Mike"
          },
          "messageCount": 3
        },
        "read": false,
        "actionUrl": "/chats/60d5ecb54b24a50015c4d4a0",
        "createdAt": "2024-01-15T07:30:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Get Notification by ID

**Request:**
```http
GET /api/v1/notifications/60d5ecb54b24a50015c4d8a0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notification": {
      "_id": "60d5ecb54b24a50015c4d8a0",
      "type": "match",
      "title": "New Match Invitation",
      "message": "John Doe invited you to join a tennis match",
      "data": {
        "matchId": "60d5ecb54b24a50015c4d2a0",
        "match": {
          "_id": "60d5ecb54b24a50015c4d2a0",
          "sport": "tennis",
          "schedule": {
            "date": "2024-01-20T00:00:00.000Z",
            "time": "14:00"
          },
          "venue": {
            "name": "Central Park Tennis Courts",
            "location": {
              "address": "Central Park, New York"
            }
          },
          "participants": 3,
          "maxPlayers": 4
        },
        "invitedBy": {
          "_id": "60d5ecb54b24a50015c4d1a1",
          "username": "johndoe",
          "firstName": "John",
          "lastName": "Doe",
          "profile": {
            "avatar": "https://example.com/avatars/johndoe.jpg"
          }
        }
      },
      "read": false,
      "actionUrl": "/matches/60d5ecb54b24a50015c4d2a0",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Mark Notification as Read

**Request:**
```http
PUT /api/v1/notifications/60d5ecb54b24a50015c4d8a0/read
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "notification": {
      "_id": "60d5ecb54b24a50015c4d8a0",
      "read": true,
      "readAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Mark All as Read

**Request:**
```http
PUT /api/v1/notifications/read-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "markedCount": 15
  }
}
```

### Delete Notification

**Request:**
```http
DELETE /api/v1/notifications/60d5ecb54b24a50015c4d8a0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

### Delete All Read Notifications

**Request:**
```http
DELETE /api/v1/notifications/read-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "All read notifications deleted",
  "data": {
    "deletedCount": 23
  }
}
```

### Get Notification Statistics

**Request:**
```http
GET /api/v1/notifications/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 45,
      "unread": 12,
      "read": 33,
      "byType": {
        "match": 15,
        "tournament": 8,
        "chat": 12,
        "social": 7,
        "system": 3
      },
      "recent": {
        "today": 5,
        "thisWeek": 18,
        "thisMonth": 45
      }
    }
  }
}
```

### Update Notification Preferences

**Request:**
```http
PUT /api/v1/notifications/preferences
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "email": true,
  "push": true,
  "types": {
    "match": {
      "enabled": true,
      "email": true,
      "push": true
    },
    "tournament": {
      "enabled": true,
      "email": true,
      "push": true
    },
    "chat": {
      "enabled": true,
      "email": false,
      "push": true
    },
    "social": {
      "enabled": true,
      "email": false,
      "push": true
    },
    "system": {
      "enabled": true,
      "email": true,
      "push": true
    }
  },
  "quiet_hours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00",
    "timezone": "America/New_York"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification preferences updated successfully",
  "data": {
    "preferences": {
      "email": true,
      "push": true,
      "types": {
        "match": {
          "enabled": true,
          "email": true,
          "push": true
        },
        "tournament": {
          "enabled": true,
          "email": true,
          "push": true
        },
        "chat": {
          "enabled": true,
          "email": false,
          "push": true
        },
        "social": {
          "enabled": true,
          "email": false,
          "push": true
        },
        "system": {
          "enabled": true,
          "email": true,
          "push": true
        }
      },
      "quiet_hours": {
        "enabled": true,
        "start": "22:00",
        "end": "08:00",
        "timezone": "America/New_York"
      },
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

### Create Notification (System/Admin)

**Request:**
```http
POST /api/v1/notifications
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "userId": "60d5ecb54b24a50015c4d1a0",
  "type": "system",
  "title": "System Maintenance",
  "message": "The system will undergo maintenance on Jan 20, 2024 from 2-4 AM UTC",
  "data": {
    "maintenanceWindow": {
      "start": "2024-01-20T02:00:00.000Z",
      "end": "2024-01-20T04:00:00.000Z"
    }
  },
  "priority": "high"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "notification": {
      "_id": "60d5ecb54b24a50015c4d8a4",
      "type": "system",
      "title": "System Maintenance",
      "message": "The system will undergo maintenance on Jan 20, 2024 from 2-4 AM UTC",
      "priority": "high",
      "createdAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

## Query Parameters

### Get Notifications (`/notifications`)
- `type` - Filter by notification type (match, tournament, chat, social, system)
- `read` - Filter by read status (true/false)
- `priority` - Filter by priority (low, normal, high)
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Results per page
- `sort` - Sort field (createdAt, priority)
- `order` - Sort order (asc, desc) (default: desc)

## Notification Types

### Match Notifications
- Match invitation
- Match reminder (1 hour before)
- Player joined/left match
- Match time/venue changed
- Match started
- Match completed with results

### Tournament Notifications
- Tournament invitation
- Tournament registration confirmation
- Tournament reminder (1 day before)
- Tournament started
- Match scheduled in tournament
- Bracket advancement
- Tournament completed

### Chat Notifications
- New direct message
- New group message
- Mention in chat (@username)
- Message reaction
- Added to group chat

### Social Notifications
- New follower
- Follow request (if private profile)
- Achievement unlocked
- Friend request
- Tagged in post/comment

### System Notifications
- System maintenance announcements
- New feature announcements
- Terms of service updates
- Account security alerts
- App update notifications

## Notes on Auth/Security

### JWT Authentication Required
All notification endpoints require authentication:
```http
Authorization: Bearer <jwt_token>
```

### Permissions
- **Users**: Can view, read, and delete their own notifications
- **System/Admin**: Can create notifications for specific users or broadcast

### Privacy
- Users only see their own notifications
- Notification data includes only public information
- Sensitive data never included in notification payloads

### Rate Limiting
- Notification queries: **100 requests per 15 minutes per user**
- Notification creation (admin): **1000 notifications per hour**

## Real-time Requirements (WebSocket)

### Real-time Notification Delivery

**Listen for New Notifications:**
```javascript
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // notification structure same as API response
  
  // Show notification in UI
  showNotification(notification);
  
  // Update notification badge count
  updateNotificationBadge();
  
  // Play sound if enabled
  if (notification.priority === 'high') {
    playNotificationSound();
  }
});
```

**Notification Read Event:**
```javascript
// Emit when notification is read in UI
socket.emit('notification-read', {
  notificationId: '60d5ecb54b24a50015c4d8a0'
});

// Listen for read confirmations
socket.on('notification-read-confirmed', (data) => {
  console.log(`Notification ${data.notificationId} marked as read`);
});
```

**Notification Count Update:**
```javascript
socket.on('notification-count-updated', (data) => {
  console.log(`Unread notifications: ${data.unreadCount}`);
  // Update badge in UI
  updateBadgeCount(data.unreadCount);
});
```

### Push Notifications

**Platform Support:**
- Firebase Cloud Messaging (FCM) for Android
- Apple Push Notification Service (APNS) for iOS
- Web Push API for browsers

**Push Notification Payload:**
```json
{
  "title": "New Match Invitation",
  "body": "John Doe invited you to join a tennis match",
  "icon": "https://example.com/icons/match.png",
  "badge": "https://example.com/icons/badge.png",
  "data": {
    "notificationId": "60d5ecb54b24a50015c4d8a0",
    "type": "match",
    "actionUrl": "/matches/60d5ecb54b24a50015c4d2a0"
  },
  "actions": [
    {
      "action": "view",
      "title": "View Match"
    },
    {
      "action": "dismiss",
      "title": "Dismiss"
    }
  ]
}
```

**Register Device for Push:**
```http
POST /api/v1/notifications/devices
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "deviceToken": "fcm-or-apns-token",
  "platform": "ios",
  "deviceId": "unique-device-identifier"
}
```

### Email Notifications

Email notifications are sent based on user preferences:
- Immediate delivery for high-priority notifications
- Digest emails for low-priority notifications (daily/weekly)
- Unsubscribe links included in all emails
- HTML and plain text versions provided

## Best Practices

### Frontend Implementation
1. Subscribe to WebSocket notifications on login
2. Fetch initial notifications on app start
3. Show badge with unread count
4. Group notifications by type/date
5. Implement pull-to-refresh for notification list
6. Auto-mark as read when notification is viewed
7. Support notification actions (accept/decline/view)

### Performance
- Use pagination for notification lists
- Implement infinite scroll for better UX
- Cache notifications locally
- Batch mark-as-read operations
- Debounce notification queries
