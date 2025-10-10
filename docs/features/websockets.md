# Real-time Communication (WebSocket)

## Features

- Real-time bidirectional communication
- Instant message delivery
- Live match updates
- Tournament notifications
- User presence tracking
- Typing indicators
- Notification delivery
- System alerts
- Auto-reconnection

## Connection Setup

### Basic Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

### Production Configuration

```javascript
const socket = io(process.env.REACT_APP_SOCKET_URL || 'https://api.sportification.app', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  auth: {
    token: localStorage.getItem('auth_token')
  }
});
```

### Connection Events

```javascript
// Connection established
socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});

// Connection lost
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Connection error
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// Reconnecting
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Reconnection attempt ${attemptNumber}`);
});

// Reconnected
socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);
});
```

## Authentication

### Authenticate Socket Connection

**Client → Server:**
```javascript
const token = localStorage.getItem('auth_token');
socket.emit('authenticate', token);
```

**Server → Client:**
```javascript
// Success
socket.on('authenticated', (data) => {
  console.log('Authenticated as:', data.user);
  // data: { user: { id, email, profile }, sessionId }
});

// Error
socket.on('authentication_error', (error) => {
  console.error('Auth failed:', error.message);
  // Redirect to login
});
```

## Room Management

Rooms are used to group related events (matches, tournaments, chats).

### Join Room

**Client → Server:**
```javascript
// Join chat room
socket.emit('join-room', 'chat:60d5ecb54b24a50015c4d2a0');

// Join match room
socket.emit('join-room', 'match:60d5ecb54b24a50015c4d1b0');

// Join tournament room
socket.emit('join-room', 'tournament:60d5ecb54b24a50015c4d1e0');
```

**Server → Client:**
```javascript
socket.on('room-joined', (data) => {
  console.log(`Joined room: ${data.roomId}`);
  console.log(`Participants: ${data.participants}`);
});
```

### Leave Room

**Client → Server:**
```javascript
socket.emit('leave-room', 'chat:60d5ecb54b24a50015c4d2a0');
```

**Server → Client:**
```javascript
socket.on('room-left', (data) => {
  console.log(`Left room: ${data.roomId}`);
});
```

## Chat Events

### New Message

**Server → Client:**
```javascript
socket.on('new-message', (message) => {
  console.log('New message:', message);
  /*
  message: {
    _id: string,
    chat: string,
    sender: { _id, username, firstName, profile },
    content: string,
    type: 'text' | 'image' | 'file',
    createdAt: Date
  }
  */
  
  // Add message to chat UI
  addMessageToChat(message);
  
  // Play notification sound if not from current user
  if (message.sender._id !== currentUserId) {
    playNotificationSound();
  }
});
```

### Message Updated/Edited

**Server → Client:**
```javascript
socket.on('message-updated', (update) => {
  console.log('Message edited:', update);
  /*
  update: {
    messageId: string,
    content: string,
    isEdited: true,
    updatedAt: Date
  }
  */
  
  updateMessageInUI(update);
});
```

### Message Deleted

**Server → Client:**
```javascript
socket.on('message-deleted', (data) => {
  console.log('Message deleted:', data.messageId);
  removeMessageFromUI(data.messageId);
});
```

### Typing Indicator

**Client → Server:**
```javascript
// User started typing
socket.emit('typing', { chatId: '60d5ecb54b24a50015c4d2a0' });

// User stopped typing
socket.emit('stop-typing', { chatId: '60d5ecb54b24a50015c4d2a0' });
```

**Server → Client:**
```javascript
socket.on('user-typing', (data) => {
  console.log(`${data.user.username} is typing...`);
  showTypingIndicator(data.chatId, data.user);
});

socket.on('user-stopped-typing', (data) => {
  hideTypingIndicator(data.chatId, data.user);
});
```

### Message Read Receipt

**Client → Server:**
```javascript
socket.emit('message-read', {
  chatId: '60d5ecb54b24a50015c4d2a0',
  messageId: '60d5ecb54b24a50015c4d7a0'
});
```

**Server → Client:**
```javascript
socket.on('message-read', (data) => {
  console.log(`Message ${data.messageId} read by ${data.user.username}`);
  updateReadStatus(data.messageId, data.user);
});
```

### Message Reaction

**Client → Server:**
```javascript
socket.emit('message-reaction', {
  messageId: '60d5ecb54b24a50015c4d7a0',
  emoji: '👍'
});
```

**Server → Client:**
```javascript
socket.on('message-reaction', (data) => {
  console.log(`${data.user.username} reacted with ${data.emoji}`);
  addReactionToMessage(data.messageId, data.user, data.emoji);
});
```

## Match Events

### Player Joined Match

**Server → Client:**
```javascript
socket.on('player-joined', (data) => {
  console.log(`${data.player.username} joined match`);
  /*
  data: {
    matchId: string,
    player: { _id, username, firstName, profile },
    participantCount: number
  }
  */
  
  updateParticipantList(data.matchId, data.player);
  showNotification(`${data.player.username} joined the match`);
});
```

### Player Left Match

**Server → Client:**
```javascript
socket.on('player-left', (data) => {
  console.log(`${data.player.username} left match`);
  removeParticipant(data.matchId, data.player);
});
```

### Match Updated

**Server → Client:**
```javascript
socket.on('match-updated', (data) => {
  console.log('Match updated:', data);
  /*
  data: {
    matchId: string,
    type: 'schedule' | 'venue' | 'details',
    changes: object,
    updatedBy: { _id, username }
  }
  */
  
  if (data.type === 'schedule') {
    showNotification('Match time changed!');
  }
  
  refreshMatchDetails(data.matchId);
});
```

### Match Status Changed

**Server → Client:**
```javascript
socket.on('match-status-changed', (data) => {
  console.log(`Match status: ${data.status}`);
  /*
  data: {
    matchId: string,
    status: 'upcoming' | 'active' | 'completed' | 'cancelled',
    previousStatus: string
  }
  */
  
  updateMatchStatus(data.matchId, data.status);
});
```

### Match Started

**Server → Client:**
```javascript
socket.on('match-started', (data) => {
  console.log('Match started!');
  showMatchStartNotification(data.matchId);
  navigateToLiveMatch(data.matchId);
});
```

### Match Completed

**Server → Client:**
```javascript
socket.on('match-completed', (data) => {
  console.log('Match completed!');
  /*
  data: {
    matchId: string,
    winner: string,
    score: object,
    duration: number
  }
  */
  
  showMatchResults(data);
});
```

## Tournament Events

### Player Registered

**Server → Client:**
```javascript
socket.on('tournament-player-registered', (data) => {
  console.log(`${data.player.username} registered`);
  /*
  data: {
    tournamentId: string,
    player: { _id, username, firstName },
    participantCount: number
  }
  */
  
  updateParticipantCount(data.tournamentId, data.participantCount);
});
```

### Tournament Started

**Server → Client:**
```javascript
socket.on('tournament-started', (data) => {
  console.log('Tournament started!');
  /*
  data: {
    tournamentId: string,
    name: string,
    currentRound: number,
    startedAt: Date
  }
  */
  
  showTournamentStartNotification(data);
  navigateToBracket(data.tournamentId);
});
```

### Bracket Updated

**Server → Client:**
```javascript
socket.on('tournament-bracket-updated', (data) => {
  console.log('Bracket updated');
  /*
  data: {
    tournamentId: string,
    round: number,
    matchId: string,
    winner: string,
    nextMatch: object
  }
  */
  
  refreshBracket(data.tournamentId);
});
```

### Match Scheduled

**Server → Client:**
```javascript
socket.on('tournament-match-scheduled', (data) => {
  console.log('Your match is scheduled');
  /*
  data: {
    tournamentId: string,
    tournamentName: string,
    matchId: string,
    opponent: { _id, username },
    scheduledFor: Date,
    venue: object
  }
  */
  
  showMatchScheduledNotification(data);
});
```

### Tournament Completed

**Server → Client:**
```javascript
socket.on('tournament-completed', (data) => {
  console.log('Tournament completed');
  /*
  data: {
    tournamentId: string,
    winner: { _id, username, firstName },
    runnerUp: { _id, username, firstName },
    finalStandings: array
  }
  */
  
  showTournamentResults(data);
});
```

## Notification Events

### New Notification

**Server → Client:**
```javascript
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  /*
  notification: {
    _id: string,
    type: 'match' | 'tournament' | 'chat' | 'social' | 'system',
    title: string,
    message: string,
    data: object,
    priority: 'low' | 'normal' | 'high',
    actionUrl: string,
    createdAt: Date
  }
  */
  
  // Show notification in UI
  showNotification(notification);
  
  // Update badge count
  incrementNotificationBadge();
  
  // Play sound for high priority
  if (notification.priority === 'high') {
    playNotificationSound();
  }
});
```

### Notification Count Updated

**Server → Client:**
```javascript
socket.on('notification-count-updated', (data) => {
  console.log(`Unread notifications: ${data.unreadCount}`);
  updateNotificationBadge(data.unreadCount);
});
```

## User Status Events

### User Status Changed

**Server → Client:**
```javascript
socket.on('user-status-changed', (data) => {
  console.log(`${data.userId} is now ${data.status}`);
  /*
  data: {
    userId: string,
    username: string,
    status: 'online' | 'offline' | 'away',
    lastSeen: Date
  }
  */
  
  updateUserStatus(data.userId, data.status);
});
```

### New Follower

**Server → Client:**
```javascript
socket.on('new-follower', (data) => {
  console.log(`${data.follower.username} started following you`);
  showFollowerNotification(data.follower);
});
```

### Achievement Unlocked

**Server → Client:**
```javascript
socket.on('achievement-unlocked', (achievement) => {
  console.log('Achievement unlocked!', achievement);
  /*
  achievement: {
    _id: string,
    name: string,
    description: string,
    icon: string,
    points: number
  }
  */
  
  showAchievementAnimation(achievement);
});
```

## System Events

### System Alert

**Server → Client:**
```javascript
socket.on('system-alert', (alert) => {
  console.log('System alert:', alert);
  /*
  alert: {
    level: 'info' | 'warning' | 'critical',
    message: string,
    timestamp: Date
  }
  */
  
  if (alert.level === 'critical') {
    showCriticalAlert(alert.message);
  }
});
```

### Session Expired

**Server → Client:**
```javascript
socket.on('session-expired', () => {
  console.log('Session expired');
  logoutUser();
  redirectToLogin();
});
```

### Force Logout

**Server → Client:**
```javascript
socket.on('force-logout', (data) => {
  console.log('Forced logout:', data.reason);
  logoutUser();
  showMessage(data.reason);
  redirectToLogin();
});
```

### Maintenance Mode

**Server → Client:**
```javascript
socket.on('maintenance-mode', (data) => {
  console.log('Maintenance scheduled:', data);
  /*
  data: {
    startTime: Date,
    endTime: Date,
    message: string
  }
  */
  
  showMaintenanceWarning(data);
});
```

## Error Handling

### Connection Errors

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  showConnectionError();
});

socket.on('connect_timeout', () => {
  console.error('Connection timeout');
  showTimeoutError();
});
```

### Event Errors

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  /*
  error: {
    code: string,
    message: string,
    details: object
  }
  */
  
  handleSocketError(error);
});
```

## Best Practices

### 1. Connection Management

```javascript
// Connect on app start
useEffect(() => {
  socket.connect();
  
  return () => {
    socket.disconnect();
  };
}, []);

// Reconnect on auth
useEffect(() => {
  if (isAuthenticated) {
    socket.emit('authenticate', token);
  }
}, [isAuthenticated, token]);
```

### 2. Room Management

```javascript
// Join room when entering chat/match/tournament view
useEffect(() => {
  if (chatId) {
    socket.emit('join-room', `chat:${chatId}`);
  }
  
  return () => {
    if (chatId) {
      socket.emit('leave-room', `chat:${chatId}`);
    }
  };
}, [chatId]);
```

### 3. Event Cleanup

```javascript
useEffect(() => {
  // Register event handlers
  socket.on('new-message', handleNewMessage);
  socket.on('player-joined', handlePlayerJoined);
  
  // Cleanup on unmount
  return () => {
    socket.off('new-message', handleNewMessage);
    socket.off('player-joined', handlePlayerJoined);
  };
}, []);
```

### 4. Error Recovery

```javascript
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server forced disconnect, reconnect manually
    socket.connect();
  }
  // Other reasons will auto-reconnect
});
```

### 5. State Management Integration

```javascript
// Redux example
socket.on('new-message', (message) => {
  dispatch(addMessage(message));
});

// Context example
socket.on('notification', (notification) => {
  notificationContext.addNotification(notification);
});
```

### 6. Throttling/Debouncing

```javascript
// Throttle typing indicators
const emitTyping = throttle(() => {
  socket.emit('typing', { chatId });
}, 2000);

// Debounce stop typing
const emitStopTyping = debounce(() => {
  socket.emit('stop-typing', { chatId });
}, 3000);
```

## Testing WebSocket Events

### Browser Console

```javascript
// Connect and authenticate
const socket = io('http://localhost:3000');
socket.emit('authenticate', 'your-jwt-token');

// Test joining room
socket.emit('join-room', 'match:123');

// Listen for events
socket.onAny((eventName, ...args) => {
  console.log(`Event: ${eventName}`, args);
});
```

### Testing Tools

- **Socket.IO Client Tool**: Browser extension for testing
- **Postman**: Supports WebSocket connections
- **wscat**: Command-line WebSocket client

## Performance Optimization

### 1. Selective Event Listening

```javascript
// Only listen to events for current view
if (currentView === 'chat') {
  socket.on('new-message', handleMessage);
} else {
  socket.off('new-message');
}
```

### 2. Batch Updates

```javascript
// Batch multiple updates to reduce re-renders
const messageQueue = [];
socket.on('new-message', (message) => {
  messageQueue.push(message);
});

// Process queue periodically
setInterval(() => {
  if (messageQueue.length > 0) {
    dispatch(addMessages(messageQueue));
    messageQueue.length = 0;
  }
}, 1000);
```

### 3. Connection Pooling

```javascript
// Reuse same connection across app
// Export socket instance from a module
export const socket = io(SOCKET_URL);
```

## Security Considerations

1. **Always authenticate** socket connections
2. **Validate** data received from server
3. **Never trust** client-side events alone
4. **Use HTTPS/WSS** in production
5. **Implement** rate limiting on client
6. **Handle** authentication errors gracefully
7. **Clear sensitive data** on disconnect

## Connection URL

- **Development**: `http://localhost:3000`
- **Production**: `https://api.sportification.app`

Use environment variables to configure the connection URL.
