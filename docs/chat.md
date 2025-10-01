# Chat & Messaging

## Features

- Real-time messaging system
- Direct messaging between users
- Group chats
- Match-specific chat rooms
- Tournament chat rooms
- Message history and pagination
- Message editing and deletion
- Typing indicators
- Message reactions
- Unread message counts
- Chat participant management

## Endpoints

### Chat Management

- `POST /api/v1/chats` → Create a new chat (direct or group) (requires auth)
- `GET /api/v1/chats` → Get all user's chats (requires auth)
- `GET /api/v1/chats/:chatId` → Get specific chat details (requires auth)
- `DELETE /api/v1/chats/:chatId` → Delete/leave a chat (requires auth)

### Message Management

- `GET /api/v1/chats/:chatId/messages` → Get chat messages with pagination (requires auth)
- `POST /api/v1/chats/:chatId/messages` → Send a message (requires auth)
- `PUT /api/v1/chats/messages/:messageId` → Edit a message (requires auth)
- `DELETE /api/v1/chats/messages/:messageId` → Delete a message (requires auth)

### Chat Participants

- `POST /api/v1/chats/:chatId/participants` → Add participants to group chat (requires auth)
- `DELETE /api/v1/chats/:chatId/participants/:userId` → Remove participant from group chat (requires auth)

## Request/Response Examples

### Create Chat

**Request (Direct Chat):**
```http
POST /api/v1/chats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "type": "direct",
  "participants": ["60d5ecb54b24a50015c4d1a1"]
}
```

**Request (Group Chat):**
```http
POST /api/v1/chats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "type": "group",
  "name": "Tennis Players NYC",
  "participants": [
    "60d5ecb54b24a50015c4d1a1",
    "60d5ecb54b24a50015c4d1a2",
    "60d5ecb54b24a50015c4d1a3"
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "chat": {
      "_id": "60d5ecb54b24a50015c4d4a0",
      "type": "group",
      "name": "Tennis Players NYC",
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "username": "johndoe",
          "firstName": "John",
          "profile": {
            "avatar": "https://example.com/avatars/johndoe.jpg"
          }
        },
        {
          "_id": "60d5ecb54b24a50015c4d1a1",
          "username": "janedoe",
          "firstName": "Jane",
          "profile": {
            "avatar": "https://example.com/avatars/janedoe.jpg"
          }
        }
      ],
      "lastMessage": null,
      "unreadCount": 0,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Chat created successfully"
}
```

### Get All Chats

**Request:**
```http
GET /api/v1/chats?page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "_id": "60d5ecb54b24a50015c4d4a0",
        "type": "direct",
        "participants": [
          {
            "_id": "60d5ecb54b24a50015c4d1a1",
            "username": "janedoe",
            "firstName": "Jane",
            "profile": {
              "avatar": "https://example.com/avatars/janedoe.jpg"
            },
            "isOnline": true
          }
        ],
        "lastMessage": {
          "_id": "60d5ecb54b24a50015c4d7a0",
          "content": "See you at the match tomorrow!",
          "sender": {
            "_id": "60d5ecb54b24a50015c4d1a1",
            "username": "janedoe"
          },
          "createdAt": "2024-01-15T14:30:00.000Z"
        },
        "unreadCount": 2,
        "updatedAt": "2024-01-15T14:30:00.000Z"
      },
      {
        "_id": "60d5ecb54b24a50015c4d4a1",
        "type": "group",
        "name": "Tennis Players NYC",
        "participants": [
          {
            "_id": "60d5ecb54b24a50015c4d1a1",
            "username": "janedoe",
            "firstName": "Jane"
          },
          {
            "_id": "60d5ecb54b24a50015c4d1a2",
            "username": "mikewilson",
            "firstName": "Mike"
          }
        ],
        "lastMessage": {
          "_id": "60d5ecb54b24a50015c4d7a1",
          "content": "Anyone up for a match this weekend?",
          "sender": {
            "_id": "60d5ecb54b24a50015c4d1a2",
            "username": "mikewilson"
          },
          "createdAt": "2024-01-15T16:00:00.000Z"
        },
        "unreadCount": 0,
        "updatedAt": "2024-01-15T16:00:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

### Get Chat Details

**Request:**
```http
GET /api/v1/chats/60d5ecb54b24a50015c4d4a0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "chat": {
      "_id": "60d5ecb54b24a50015c4d4a0",
      "type": "group",
      "name": "Tennis Players NYC",
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "username": "johndoe",
          "firstName": "John",
          "lastName": "Doe",
          "profile": {
            "avatar": "https://example.com/avatars/johndoe.jpg"
          },
          "isOnline": true,
          "lastSeen": "2024-01-15T17:00:00.000Z"
        },
        {
          "_id": "60d5ecb54b24a50015c4d1a1",
          "username": "janedoe",
          "firstName": "Jane",
          "lastName": "Doe",
          "profile": {
            "avatar": "https://example.com/avatars/janedoe.jpg"
          },
          "isOnline": false,
          "lastSeen": "2024-01-15T16:30:00.000Z"
        }
      ],
      "createdBy": "60d5ecb54b24a50015c4d1a0",
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-15T17:00:00.000Z"
    }
  }
}
```

### Get Chat Messages

**Request:**
```http
GET /api/v1/chats/60d5ecb54b24a50015c4d4a0/messages?page=1&limit=50
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "60d5ecb54b24a50015c4d7a0",
        "chat": "60d5ecb54b24a50015c4d4a0",
        "sender": {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "username": "johndoe",
          "firstName": "John",
          "profile": {
            "avatar": "https://example.com/avatars/johndoe.jpg"
          }
        },
        "content": "Hey everyone, who's available for a match this Saturday?",
        "type": "text",
        "readBy": [
          {
            "user": "60d5ecb54b24a50015c4d1a1",
            "readAt": "2024-01-15T11:00:00.000Z"
          }
        ],
        "reactions": [
          {
            "user": "60d5ecb54b24a50015c4d1a1",
            "emoji": "👍"
          }
        ],
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "isEdited": false
      },
      {
        "_id": "60d5ecb54b24a50015c4d7a1",
        "chat": "60d5ecb54b24a50015c4d4a0",
        "sender": {
          "_id": "60d5ecb54b24a50015c4d1a1",
          "username": "janedoe",
          "firstName": "Jane"
        },
        "content": "I'm in! What time?",
        "type": "text",
        "readBy": [
          {
            "user": "60d5ecb54b24a50015c4d1a0",
            "readAt": "2024-01-15T11:05:00.000Z"
          }
        ],
        "reactions": [],
        "createdAt": "2024-01-15T11:00:00.000Z",
        "isEdited": false
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "pages": 3
  }
}
```

### Send Message

**Request (Text):**
```http
POST /api/v1/chats/60d5ecb54b24a50015c4d4a0/messages
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "content": "Let's meet at 2 PM at Central Park",
  "type": "text"
}
```

**Request (Attachment):**
```http
POST /api/v1/chats/60d5ecb54b24a50015c4d4a0/messages
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "type": "image",
  "attachment": {
    "url": "https://example.com/images/court-photo.jpg",
    "filename": "court-photo.jpg",
    "mimeType": "image/jpeg",
    "size": 245678
  },
  "content": "Check out this court!"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "60d5ecb54b24a50015c4d7a2",
      "chat": "60d5ecb54b24a50015c4d4a0",
      "sender": {
        "_id": "60d5ecb54b24a50015c4d1a0",
        "username": "johndoe",
        "firstName": "John"
      },
      "content": "Let's meet at 2 PM at Central Park",
      "type": "text",
      "readBy": [],
      "reactions": [],
      "createdAt": "2024-01-15T11:10:00.000Z",
      "isEdited": false
    }
  },
  "message": "Message sent successfully"
}
```

### Edit Message

**Request:**
```http
PUT /api/v1/chats/messages/60d5ecb54b24a50015c4d7a2
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "content": "Let's meet at 3 PM at Central Park (updated time)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "60d5ecb54b24a50015c4d7a2",
      "content": "Let's meet at 3 PM at Central Park (updated time)",
      "isEdited": true,
      "updatedAt": "2024-01-15T11:15:00.000Z"
    }
  },
  "message": "Message updated successfully"
}
```

### Delete Message

**Request:**
```http
DELETE /api/v1/chats/messages/60d5ecb54b24a50015c4d7a2
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

### Add Participants

**Request:**
```http
POST /api/v1/chats/60d5ecb54b24a50015c4d4a0/participants
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "participants": [
    "60d5ecb54b24a50015c4d1a3",
    "60d5ecb54b24a50015c4d1a4"
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Participants added successfully",
  "data": {
    "chat": {
      "_id": "60d5ecb54b24a50015c4d4a0",
      "participants": [
        {
          "_id": "60d5ecb54b24a50015c4d1a3",
          "username": "sarahsmith",
          "firstName": "Sarah"
        },
        {
          "_id": "60d5ecb54b24a50015c4d1a4",
          "username": "tomjones",
          "firstName": "Tom"
        }
      ]
    }
  }
}
```

### Remove Participant

**Request:**
```http
DELETE /api/v1/chats/60d5ecb54b24a50015c4d4a0/participants/60d5ecb54b24a50015c4d1a3
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Participant removed successfully"
}
```

### Delete/Leave Chat

**Request:**
```http
DELETE /api/v1/chats/60d5ecb54b24a50015c4d4a0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

## Query Parameters

### Get All Chats (`/chats`)
- `type` - Filter by chat type (direct, group, match, tournament)
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Results per page

### Get Chat Messages (`/chats/:chatId/messages`)
- `page` (default: 1) - Page number
- `limit` (default: 50, max: 100) - Messages per page
- `before` - Get messages before this message ID (for infinite scroll)
- `after` - Get messages after this message ID

## Notes on Auth/Security

### JWT Authentication Required
All chat endpoints require authentication:
```http
Authorization: Bearer <jwt_token>
```

### Permissions
- **Chat Creator**: Can manage participants (group chats only)
- **Participants**: Can send messages, read messages
- **Message Sender**: Can edit and delete their own messages (within 15 minutes)

### Chat Types
- **Direct**: One-on-one conversation
- **Group**: Multiple participants, named chat
- **Match**: Automatically created for each match
- **Tournament**: Automatically created for each tournament

### Rate Limiting
- Message sending: **60 messages per minute per user**
- Chat creation: **10 chats per hour per user**

### Message Constraints
- Maximum message length: 2000 characters
- Supported attachment types: images, videos, documents
- Maximum attachment size: 10MB
- Edit window: 15 minutes after sending
- Delete window: 24 hours after sending

## Real-time Requirements (WebSocket)

### Connection & Room Management

**Join Chat Room:**
```javascript
// Automatically join all user's chats on authentication
socket.emit('join-room', chatId);

socket.on('joined-room', (data) => {
  console.log(`Joined chat room: ${data.roomId}`);
});
```

### Real-time Events

**New Message:**
```javascript
socket.on('new-message', (message) => {
  console.log('New message received:', message);
  // message object structure same as API response
  // Update UI with new message
});
```

**Message Updated:**
```javascript
socket.on('message-updated', (data) => {
  console.log('Message edited:', data);
  // data: { messageId, content, updatedAt }
  // Update message in UI
});
```

**Message Deleted:**
```javascript
socket.on('message-deleted', (data) => {
  console.log('Message deleted:', data.messageId);
  // Remove message from UI
});
```

**Typing Indicator:**
```javascript
// Emit when user is typing
socket.emit('typing', { chatId: '60d5ecb54b24a50015c4d4a0' });

// Listen for typing events
socket.on('user-typing', (data) => {
  console.log(`${data.user.username} is typing in ${data.chatId}...`);
  // Show typing indicator in UI
});

// Emit when user stops typing
socket.emit('stop-typing', { chatId: '60d5ecb54b24a50015c4d4a0' });

socket.on('user-stopped-typing', (data) => {
  console.log(`${data.user.username} stopped typing`);
  // Hide typing indicator
});
```

**Message Read:**
```javascript
// Emit when user reads messages
socket.emit('message-read', {
  chatId: '60d5ecb54b24a50015c4d4a0',
  messageId: '60d5ecb54b24a50015c4d7a0'
});

// Listen for read receipts
socket.on('message-read', (data) => {
  console.log(`Message ${data.messageId} read by ${data.user.username}`);
  // Update read status in UI
});
```

**Message Reaction:**
```javascript
// Emit reaction
socket.emit('message-reaction', {
  messageId: '60d5ecb54b24a50015c4d7a0',
  emoji: '👍'
});

// Listen for reactions
socket.on('message-reaction', (data) => {
  console.log(`${data.user.username} reacted with ${data.emoji}`);
  // Update message reactions in UI
});
```

**Participant Added/Removed:**
```javascript
socket.on('chat-participant-added', (data) => {
  console.log(`${data.user.username} added to chat ${data.chatId}`);
  // Update participant list
});

socket.on('chat-participant-removed', (data) => {
  console.log(`${data.user.username} removed from chat ${data.chatId}`);
  // Update participant list
});
```

### Push Notifications
- New message notifications (when offline or app in background)
- Mention notifications (@username)
- Group chat activity summaries
- Direct message alerts with message preview
