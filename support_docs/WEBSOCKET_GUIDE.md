# WebSocket Events Guide

## Real-time Communication with Sports Companion API

This guide covers all WebSocket events available in the Sports Companion API for implementing real-time features in your frontend application.

---

## Table of Contents

1. [Connection Setup](#connection-setup)
2. [Authentication Events](#authentication-events)
3. [Room Management](#room-management)
4. [Chat Events](#chat-events)
5. [Match Events](#match-events)
6. [Tournament Events](#tournament-events)
7. [Notification Events](#notification-events)
8. [User Status Events](#user-status-events)
9. [System Events](#system-events)
10. [Error Handling](#error-handling)
11. [Best Practices](#best-practices)

---

## Connection Setup

### Basic Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  autoConnect: false
});

// Connect manually
socket.connect();
```

### Production Configuration

```javascript
const socket = io(process.env.REACT_APP_SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 5000
});
```

---

## Authentication Events

### Client → Server

#### `authenticate`
Authenticate the socket connection with JWT token.

```javascript
const token = localStorage.getItem('auth_token');
socket.emit('authenticate', token);
```

### Server → Client

#### `authenticated`
Confirmation of successful authentication.

```javascript
socket.on('authenticated', (data) => {
  console.log('Authenticated as:', data.user);
  // data: { user: User, sessionId: string }
});
```

#### `authentication_error`
Authentication failed.

```javascript
socket.on('authentication_error', (error) => {
  console.error('Authentication failed:', error.message);
  // Redirect to login or show error
});
```

---

## Room Management

### Client → Server

#### `join-room`
Join a room for real-time updates.

```javascript
// Join chat room
socket.emit('join-room', 'chat:60d5ecb54b24a50015c4d2a0');

// Join match room
socket.emit('join-room', 'match:60d5ecb54b24a50015c4d1b0');

// Join tournament room
socket.emit('join-room', 'tournament:60d5ecb54b24a50015c4d1e0');
```

#### `leave-room`
Leave a room.

```javascript
socket.emit('leave-room', 'chat:60d5ecb54b24a50015c4d2a0');
```

### Server → Client

#### `room-joined`
Confirmation of joining a room.

```javascript
socket.on('room-joined', (data) => {
  console.log(`Joined room ${data.roomId} with ${data.participants} participants`);
});
```

#### `room-left`
Confirmation of leaving a room.

```javascript
socket.on('room-left', (data) => {
  console.log(`Left room ${data.roomId}`);
});
```

---

## Chat Events

### Client → Server

#### `send-message`
Send a message to a chat room.

```javascript
socket.emit('send-message', {
  roomId: 'chat:60d5ecb54b24a50015c4d2a0',
  content: 'Hello everyone!',
  messageType: 'text',
  replyTo: 'message-id-optional'
});
```

#### `typing`
Send typing indicator.

```javascript
// Start typing
socket.emit('typing', {
  chatId: '60d5ecb54b24a50015c4d2a0',
  isTyping: true
});

// Stop typing
socket.emit('typing', {
  chatId: '60d5ecb54b24a50015c4d2a0',
  isTyping: false
});
```

### Server → Client

#### `new-message`
New message received in a chat.

```javascript
socket.on('new-message', (message) => {
  console.log('New message:', message);
  // message: Message object (see TypeScript interfaces)
  
  // Update UI
  addMessageToChat(message.chat, message);
  
  // Play notification sound
  if (message.sender._id !== currentUserId) {
    playNotificationSound();
  }
});
```

#### `message-updated`
Message was edited or deleted.

```javascript
socket.on('message-updated', (update) => {
  console.log('Message updated:', update);
  
  if (update.type === 'edit') {
    // Update message content
    updateMessageInChat(update.messageId, update.content);
  } else if (update.type === 'delete') {
    // Remove or mark message as deleted
    removeMessageFromChat(update.messageId);
  }
});
```

#### `user-typing`
Another user is typing.

```javascript
socket.on('user-typing', (data) => {
  const { userId, firstName, isTyping, chatId } = data;
  
  if (isTyping) {
    showTypingIndicator(chatId, userId, firstName);
  } else {
    hideTypingIndicator(chatId, userId);
  }
});
```

#### `message-reaction`
New reaction added to a message.

```javascript
socket.on('message-reaction', (data) => {
  const { messageId, emoji, user, action } = data; // action: 'add' | 'remove'
  
  updateMessageReactions(messageId, emoji, user, action);
});
```

---

## Match Events

### Server → Client

#### `match-updated`
Match details were updated.

```javascript
socket.on('match-updated', (update) => {
  const { matchId, type, data, timestamp } = update;
  
  switch (type) {
    case 'participant_joined':
      console.log('New player joined:', data.player);
      updateMatchParticipants(matchId, data.participants);
      break;
      
    case 'participant_left':
      console.log('Player left:', data.player);
      updateMatchParticipants(matchId, data.participants);
      break;
      
    case 'status_changed':
      console.log('Match status changed to:', data.status);
      updateMatchStatus(matchId, data.status);
      break;
      
    case 'details_updated':
      console.log('Match details updated');
      refreshMatchDetails(matchId);
      break;
  }
});
```

#### `player-joined`
A player joined the match.

```javascript
socket.on('player-joined', (data) => {
  const { matchId, player, currentParticipants } = data;
  
  // Update UI
  addPlayerToMatch(matchId, player);
  updateParticipantCount(matchId, currentParticipants);
  
  // Show notification
  showNotification(`${player.firstName} joined the match`);
});
```

#### `player-left`
A player left the match.

```javascript
socket.on('player-left', (data) => {
  const { matchId, player, currentParticipants } = data;
  
  // Update UI
  removePlayerFromMatch(matchId, player);
  updateParticipantCount(matchId, currentParticipants);
  
  // Show notification
  showNotification(`${player.firstName} left the match`);
});
```

#### `match-started`
Match has started.

```javascript
socket.on('match-started', (data) => {
  const { matchId, startTime } = data;
  
  // Update match status
  updateMatchStatus(matchId, 'in-progress');
  
  // Show notification
  showNotification('Match has started!');
  
  // Navigate to live match view
  navigateToLiveMatch(matchId);
});
```

#### `match-completed`
Match has been completed.

```javascript
socket.on('match-completed', (data) => {
  const { matchId, result, duration } = data;
  
  // Update match with results
  updateMatchResult(matchId, result);
  
  // Show completion notification
  showMatchCompletionDialog(result);
});
```

---

## Tournament Events

### Server → Client

#### `tournament-updated`
Tournament information updated.

```javascript
socket.on('tournament-updated', (update) => {
  const { tournamentId, type, data, timestamp } = update;
  
  switch (type) {
    case 'registration_opened':
      showNotification('Tournament registration is now open!');
      updateTournamentStatus(tournamentId, 'registration_open');
      break;
      
    case 'registration_closed':
      showNotification('Tournament registration has closed');
      updateTournamentStatus(tournamentId, 'upcoming');
      break;
      
    case 'bracket_generated':
      showNotification('Tournament bracket has been generated');
      refreshTournamentBracket(tournamentId);
      break;
      
    case 'match_completed':
      updateTournamentMatch(tournamentId, data.match);
      break;
      
    case 'round_completed':
      showNotification(`Round ${data.round} completed`);
      refreshTournamentBracket(tournamentId);
      break;
  }
});
```

#### `tournament-player-registered`
New player registered for tournament.

```javascript
socket.on('tournament-player-registered', (data) => {
  const { tournamentId, player, currentParticipants } = data;
  
  addPlayerToTournament(tournamentId, player);
  updateTournamentParticipantCount(tournamentId, currentParticipants);
});
```

#### `tournament-started`
Tournament has begun.

```javascript
socket.on('tournament-started', (data) => {
  const { tournamentId, firstRoundMatches } = data;
  
  updateTournamentStatus(tournamentId, 'in-progress');
  showNotification('Tournament has started!');
  
  // Navigate to tournament view
  navigateToTournament(tournamentId);
});
```

---

## Notification Events

### Server → Client

#### `notification`
New notification received.

```javascript
socket.on('notification', (notification) => {
  // notification: Notification object
  
  // Add to notification list
  addNotification(notification);
  
  // Show toast/banner
  showNotificationToast(notification);
  
  // Update notification count
  incrementNotificationCount();
  
  // Play sound if enabled
  if (shouldPlayNotificationSound(notification.type)) {
    playNotificationSound();
  }
});
```

#### `notification-updated`
Notification status changed.

```javascript
socket.on('notification-updated', (update) => {
  const { notificationId, isRead, readAt } = update;
  
  // Update notification in UI
  updateNotificationStatus(notificationId, isRead, readAt);
  
  // Update unread count
  if (isRead) {
    decrementNotificationCount();
  }
});
```

---

## User Status Events

### Server → Client

#### `user-online`
A user came online.

```javascript
socket.on('user-online', (data) => {
  const { userId, timestamp } = data;
  
  // Update user status in UI
  updateUserOnlineStatus(userId, true);
  
  // Update last active time
  updateUserLastActive(userId, timestamp);
});
```

#### `user-offline`
A user went offline.

```javascript
socket.on('user-offline', (data) => {
  const { userId, lastActiveAt } = data;
  
  // Update user status in UI
  updateUserOnlineStatus(userId, false);
  updateUserLastActive(userId, lastActiveAt);
});
```

#### `friends-status-update`
Friend's status changed.

```javascript
socket.on('friends-status-update', (data) => {
  const { friends } = data; // Array of friend status updates
  
  friends.forEach(friend => {
    updateFriendStatus(friend.userId, friend.isOnline, friend.lastActiveAt);
  });
});
```

---

## System Events

### Server → Client

#### `system-announcement`
System-wide announcement.

```javascript
socket.on('system-announcement', (data) => {
  const { message, type, timestamp } = data;
  
  // Show system announcement
  showSystemAnnouncement(message, type);
  
  // Log to console
  console.log(`System ${type}:`, message);
});
```

#### `maintenance-mode`
Server entering maintenance mode.

```javascript
socket.on('maintenance-mode', (data) => {
  const { startTime, estimatedDuration, message } = data;
  
  // Show maintenance notification
  showMaintenanceWarning(message, startTime, estimatedDuration);
});
```

---

## Error Handling

### Connection Errors

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  
  // Show user-friendly error
  showConnectionError();
  
  // Try to reconnect
  setTimeout(() => {
    socket.connect();
  }, 5000);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  
  if (reason === 'io server disconnect') {
    // Server disconnected the client
    // Try to reconnect manually
    socket.connect();
  }
  // Otherwise, Socket.IO will auto-reconnect
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  
  // Re-authenticate
  const token = localStorage.getItem('auth_token');
  if (token) {
    socket.emit('authenticate', token);
  }
  
  // Rejoin rooms
  rejoinActiveRooms();
});
```

### Event Errors

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  
  // Handle specific error types
  switch (error.type) {
    case 'AUTHENTICATION_REQUIRED':
      redirectToLogin();
      break;
      
    case 'RATE_LIMITED':
      showRateLimitWarning();
      break;
      
    case 'ROOM_NOT_FOUND':
      showError('Room not found');
      break;
      
    default:
      showError('An unexpected error occurred');
  }
});
```

---

## Best Practices

### 1. Connection Management

```javascript
class SocketManager {
  constructor() {
    this.socket = null;
    this.isAuthenticated = false;
    this.activeRooms = new Set();
  }

  connect() {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupEventListeners();
    this.socket.connect();
  }

  authenticate(token) {
    if (this.socket && token) {
      this.socket.emit('authenticate', token);
    }
  }

  joinRoom(roomId) {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit('join-room', roomId);
      this.activeRooms.add(roomId);
    }
  }

  rejoinRooms() {
    this.activeRooms.forEach(roomId => {
      this.socket.emit('join-room', roomId);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.activeRooms.clear();
      this.isAuthenticated = false;
    }
  }
}
```

### 2. Event Handlers

```javascript
// Centralized event handling
const eventHandlers = {
  'new-message': (message) => {
    // Handle new message
    chatStore.addMessage(message);
    notificationService.showMessage(message);
  },

  'match-updated': (update) => {
    // Handle match update
    matchStore.updateMatch(update.matchId, update.data);
    
    if (update.type === 'participant_joined') {
      notificationService.showPlayerJoined(update.data.player);
    }
  },

  'notification': (notification) => {
    // Handle notification
    notificationStore.addNotification(notification);
    notificationService.showToast(notification);
  }
};

// Register all handlers
Object.entries(eventHandlers).forEach(([event, handler]) => {
  socket.on(event, handler);
});
```

### 3. React Hook Example

```javascript
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const socketRef = useRef(null);
  const { user, token } = useAuth();

  const connect = useCallback(() => {
    if (!socketRef.current) {
      socketRef.current = new SocketManager();
      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const joinRoom = useCallback((roomId) => {
    if (socketRef.current) {
      socketRef.current.joinRoom(roomId);
    }
  }, []);

  useEffect(() => {
    if (user && token) {
      connect();
      socketRef.current?.authenticate(token);
    } else {
      disconnect();
    }

    return () => disconnect();
  }, [user, token, connect, disconnect]);

  return {
    socket: socketRef.current?.socket,
    isConnected: socketRef.current?.isAuthenticated,
    joinRoom,
    disconnect
  };
};
```

### 4. State Management Integration

```javascript
// Redux actions for socket events
const socketActions = {
  messageReceived: (message) => ({
    type: 'SOCKET_MESSAGE_RECEIVED',
    payload: message
  }),

  matchUpdated: (update) => ({
    type: 'SOCKET_MATCH_UPDATED',
    payload: update
  }),

  userOnline: (userId) => ({
    type: 'SOCKET_USER_ONLINE',
    payload: userId
  })
};

// Socket middleware for Redux
const socketMiddleware = (store) => (next) => (action) => {
  if (action.type.startsWith('SOCKET_')) {
    // Handle socket actions
    switch (action.type) {
      case 'SOCKET_MESSAGE_RECEIVED':
        // Update chat state
        store.dispatch(addMessage(action.payload));
        break;

      case 'SOCKET_MATCH_UPDATED':
        // Update match state
        store.dispatch(updateMatch(action.payload));
        break;
    }
  }

  return next(action);
};
```

### 5. Performance Optimization

```javascript
// Debounce typing indicators
const debouncedTyping = debounce((chatId, isTyping) => {
  socket.emit('typing', { chatId, isTyping });
}, 300);

// Throttle status updates
const throttledStatusUpdate = throttle(() => {
  socket.emit('update-status', { isActive: true });
}, 30000); // Every 30 seconds

// Cleanup on component unmount
useEffect(() => {
  return () => {
    // Cancel any pending operations
    debouncedTyping.cancel();
    throttledStatusUpdate.cancel();
  };
}, []);
```

---

## Testing WebSocket Events

### 1. Browser Console Testing

```javascript
// Test in browser console
const testSocket = io('http://localhost:3000');

testSocket.on('connect', () => {
  console.log('Connected');
  
  // Authenticate
  testSocket.emit('authenticate', 'your-jwt-token');
});

testSocket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
  
  // Join a room
  testSocket.emit('join-room', 'chat:test-room-id');
  
  // Send a test message
  setTimeout(() => {
    testSocket.emit('send-message', {
      roomId: 'chat:test-room-id',
      content: 'Test message',
      messageType: 'text'
    });
  }, 1000);
});

testSocket.on('new-message', (message) => {
  console.log('Received message:', message);
});
```

### 2. Automated Testing

```javascript
// Jest test example
import io from 'socket.io-client';

describe('Socket Events', () => {
  let socket;

  beforeEach((done) => {
    socket = io('http://localhost:3000', {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      done();
    });
  });

  afterEach(() => {
    socket.disconnect();
  });

  test('should authenticate successfully', (done) => {
    socket.emit('authenticate', 'valid-jwt-token');

    socket.on('authenticated', (data) => {
      expect(data.user).toBeDefined();
      done();
    });
  });

  test('should join room and receive confirmation', (done) => {
    socket.emit('join-room', 'test-room');

    socket.on('room-joined', (data) => {
      expect(data.roomId).toBe('test-room');
      done();
    });
  });
});
```

---

This guide provides comprehensive coverage of all WebSocket events in the Sports Companion API. Use it as a reference when implementing real-time features in your frontend application.