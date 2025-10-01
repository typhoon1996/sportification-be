# Frontend Developer Guide

## Sports Companion API - Frontend Integration Guide

This comprehensive guide will help frontend developers integrate with the Sports Companion backend API smoothly and efficiently.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication & Authorization](#authentication--authorization)
3. [User API Endpoints](#user-api-endpoints)
4. [Admin API Endpoints](#admin-api-endpoints)
5. [Real-time Features (WebSocket)](#real-time-features-websocket)
6. [Error Handling](#error-handling)
7. [TypeScript Interfaces](#typescript-interfaces)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.sportification.app/v1
```

### Required Headers
```http
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
```

### Basic Example
```javascript
const API_BASE = 'http://localhost:3000/api/v1';

// Basic API call
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  return response.json();
};
```

---

## Authentication & Authorization

### 1. User Registration

```javascript
const registerUser = async (userData) => {
  const response = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe'
    })
  });
  
  // Response includes: { user, accessToken, refreshToken }
  localStorage.setItem('auth_token', response.accessToken);
  localStorage.setItem('refresh_token', response.refreshToken);
  
  return response;
};
```

### 2. User Login

```javascript
const loginUser = async (credentials) => {
  const response = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'SecurePass123'
    })
  });
  
  localStorage.setItem('auth_token', response.accessToken);
  localStorage.setItem('refresh_token', response.refreshToken);
  
  return response;
};
```

### 3. Token Refresh

```javascript
const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh_token');
  
  const response = await apiCall('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refresh })
  });
  
  localStorage.setItem('auth_token', response.accessToken);
  
  return response;
};
```

### 4. Logout

```javascript
const logoutUser = async () => {
  await apiCall('/auth/logout', { method: 'POST' });
  
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
};
```

---

## User API Endpoints

> **Note**: These endpoints are available to all authenticated users and are designed for standard user functionality.

### Users & Profiles

```javascript
// Get current user profile
const getUserProfile = () => apiCall('/auth/profile');

// Update user profile
const updateProfile = (profileData) => apiCall('/auth/profile', {
  method: 'PATCH',
  body: JSON.stringify(profileData)
});

// Get user by ID
const getUser = (userId) => apiCall(`/users/${userId}`);

// Search users
const searchUsers = (query) => apiCall(`/users/search?q=${encodeURIComponent(query)}`);

// Follow a user
const followUser = (userId) => apiCall(`/users/${userId}/follow`, {
  method: 'POST'
});

// Unfollow a user
const unfollowUser = (userId) => apiCall(`/users/${userId}/follow`, {
  method: 'DELETE'
});

// Get user's followers
const getUserFollowers = (userId) => apiCall(`/users/${userId}/followers`);

// Get user's following
const getUserFollowing = (userId) => apiCall(`/users/${userId}/following`);
```

### Matches

```javascript
// Get matches with filters
const getMatches = (filters = {}) => {
  const params = new URLSearchParams(filters);
  return apiCall(`/matches?${params}`);
};

// Create a new match
const createMatch = (matchData) => apiCall('/matches', {
  method: 'POST',
  body: JSON.stringify({
    type: 'public', // or 'private'
    sport: 'Tennis',
    schedule: {
      date: '2024-01-20T00:00:00.000Z',
      time: '14:00',
      timezone: 'UTC'
    },
    venue: 'venue-id',
    rules: {
      maxPlayers: 2,
      format: 'Singles'
    },
    ...matchData
  })
});

// Join a match
const joinMatch = (matchId) => apiCall(`/matches/${matchId}/join`, {
  method: 'POST'
});

// Leave a match
const leaveMatch = (matchId) => apiCall(`/matches/${matchId}/leave`, {
  method: 'POST'
});

// Get match details
const getMatch = (matchId) => apiCall(`/matches/${matchId}`);
```

### Tournaments

```javascript
// Get tournaments
const getTournaments = (filters = {}) => {
  const params = new URLSearchParams(filters);
  return apiCall(`/tournaments?${params}`);
};

// Create tournament
const createTournament = (tournamentData) => apiCall('/tournaments', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Summer Tennis Championship',
    sport: 'Tennis',
    startDate: '2024-02-01T00:00:00.000Z',
    endDate: '2024-02-07T00:00:00.000Z',
    maxParticipants: 16,
    rules: {
      format: 'Single Elimination',
      matchFormat: 'Best of 3'
    },
    ...tournamentData
  })
});

// Join tournament
const joinTournament = (tournamentId) => apiCall(`/tournaments/${tournamentId}/join`, {
  method: 'POST'
});
```

### Chat & Messaging

```javascript
// Get user's chats
const getChats = () => apiCall('/chats');

// Create new chat
const createChat = (chatData) => apiCall('/chats', {
  method: 'POST',
  body: JSON.stringify({
    type: 'direct', // or 'group'
    participants: ['user-id-1', 'user-id-2'],
    name: 'Chat Name' // for group chats
  })
});

// Get chat messages
const getChatMessages = (chatId, options = {}) => {
  const params = new URLSearchParams(options);
  return apiCall(`/chats/${chatId}/messages?${params}`);
};

// Send message
const sendMessage = (chatId, messageData) => apiCall(`/chats/${chatId}/messages`, {
  method: 'POST',
  body: JSON.stringify({
    content: 'Hello everyone!',
    messageType: 'text',
    ...messageData
  })
});
```

### Notifications

```javascript
// Get notifications
const getNotifications = (options = {}) => {
  const params = new URLSearchParams(options);
  return apiCall(`/notifications?${params}`);
};

// Mark notification as read
const markNotificationRead = (notificationId) => apiCall(
  `/notifications/${notificationId}/read`, 
  { method: 'POST' }
);

// Update notification preferences
const updateNotificationPreferences = (preferences) => apiCall('/notifications/preferences', {
  method: 'PATCH',
  body: JSON.stringify(preferences)
});
```

---

## Admin API Endpoints

> **⚠️ Admin Only**: These endpoints require admin authorization and are designed for administrative and analytics functionality.

### Admin Authentication Setup

```javascript
// Verify admin status in your auth check
const isAdmin = (user) => user.role === 'admin';

// Admin API call wrapper with proper error handling
const adminApiCall = async (endpoint, options = {}) => {
  const user = getCurrentUser();
  
  if (!user || !isAdmin(user)) {
    throw new Error('Admin access required');
  }
  
  return apiCall(`/admin${endpoint}`, options);
};
```

### Analytics Dashboard

```javascript
// Get comprehensive analytics dashboard
const getAnalyticsDashboard = (timeframe = 'week') => 
  adminApiCall(`/analytics/dashboard?timeframe=${timeframe}`);

// Get user engagement analytics
const getUserEngagementAnalytics = (startDate, endDate, options = {}) => {
  const params = new URLSearchParams({
    startDate,
    endDate,
    ...options
  });
  return adminApiCall(`/analytics/user-engagement?${params}`);
};

// Get performance analytics
const getPerformanceAnalytics = (startDate, endDate, options = {}) => {
  const params = new URLSearchParams({
    startDate,
    endDate,
    ...options
  });
  return adminApiCall(`/analytics/performance?${params}`);
};

// Get business intelligence metrics
const getBusinessIntelligence = (startDate, endDate, options = {}) => {
  const params = new URLSearchParams({
    startDate,
    endDate,
    ...options
  });
  return adminApiCall(`/analytics/business-intelligence?${params}`);
};

// Get system health monitoring
const getSystemHealth = (component, timeframe = '24h') => 
  adminApiCall(`/analytics/system-health?component=${component}&timeframe=${timeframe}`);

// Get predictive analytics
const getPredictiveAnalytics = (metric, horizon = '7d') => 
  adminApiCall(`/analytics/predictive?metric=${metric}&horizon=${horizon}`);
```

### Custom Reports

```javascript
// Generate custom analytics report
const generateCustomReport = (reportData) => adminApiCall('/analytics/reports/custom', {
  method: 'POST',
  body: JSON.stringify({
    reportType: 'user_retention', // or 'feature_adoption', 'performance_summary', 'revenue_analysis'
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-01-31T23:59:59.000Z',
    dimensions: ['user_type', 'location'],
    metrics: ['active_users', 'retention_rate'],
    filters: {
      user_status: 'active'
    },
    ...reportData
  })
});
```

### Insights & Intelligence

```javascript
// Get application insights
const getApplicationInsights = () => adminApiCall('/insights/application');

// Get user behavior insights
const getUserBehaviorInsights = (period = '30d') => 
  adminApiCall(`/insights/user-behavior?period=${period}`);

// Get business performance insights
const getBusinessInsights = () => adminApiCall('/insights/business');

// Get predictive insights
const getPredictiveInsights = () => adminApiCall('/insights/predictive');

// Get competitive analysis (admin only)
const getCompetitiveInsights = () => adminApiCall('/insights/competitive');
```

### System Management

```javascript
// Get system overview
const getSystemOverview = (includeDeep = false) => 
  adminApiCall(`/system/overview?deep=${includeDeep}`);

// Get user management data
const getUserManagement = (filters = {}) => {
  const params = new URLSearchParams(filters);
  return adminApiCall(`/users/management?${params}`);
};
```

### Admin Development Notes

**Role-Based Access Control**:
```javascript
// Check admin status before making admin API calls
const checkAdminAccess = () => {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }
};

// Component wrapper for admin features
const AdminOnlyComponent = ({ children }) => {
  const user = useCurrentUser();
  
  if (!user || user.role !== 'admin') {
    return <div>Access Denied - Admin privileges required</div>;
  }
  
  return children;
};
```

**Error Handling for Admin Routes**:
```javascript
// Enhanced error handling for admin operations
const handleAdminError = (error) => {
  if (error.response?.status === 403) {
    return 'Admin access required';
  }
  if (error.response?.status === 429) {
    return 'Rate limit exceeded for admin operations';
  }
  return error.message || 'Admin operation failed';
};
```

---

## Real-time Features (WebSocket)

### 1. Connection Setup

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling']
});

// Authenticate the socket connection
const token = localStorage.getItem('auth_token');
socket.emit('authenticate', token);

socket.on('authenticated', (data) => {
  console.log('Socket authenticated:', data.user);
});

socket.on('authentication_error', (error) => {
  console.error('Socket authentication failed:', error);
});
```

### 2. Chat Events

```javascript
// Join a chat room
socket.emit('join-room', `chat:${chatId}`);

// Listen for new messages
socket.on('new-message', (message) => {
  console.log('New message received:', message);
  // Update your chat UI
});

// Send a message via socket
socket.emit('send-message', {
  roomId: `chat:${chatId}`,
  content: 'Hello everyone!',
  messageType: 'text'
});

// Listen for message updates (edits, deletions)
socket.on('message-updated', (update) => {
  console.log('Message updated:', update);
});

// Listen for typing indicators
socket.on('user-typing', ({ userId, isTyping }) => {
  // Show/hide typing indicator
});

// Send typing indicator
socket.emit('typing', { roomId: `chat:${chatId}`, isTyping: true });
```

### 3. Match Events

```javascript
// Join match room for real-time updates
socket.emit('join-room', `match:${matchId}`);

// Listen for match updates
socket.on('match-updated', (update) => {
  console.log('Match updated:', update);
  // Update match details in UI
});

// Listen for player joins/leaves
socket.on('player-joined', (player) => {
  console.log('Player joined:', player);
});

socket.on('player-left', (player) => {
  console.log('Player left:', player);
});
```

### 4. Notification Events

```javascript
// Listen for real-time notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // Show notification in UI
  showNotification(notification);
});
```

### 5. Connection Management

```javascript
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('reconnect', () => {
  console.log('Reconnected to server');
  // Re-authenticate and rejoin rooms
  const token = localStorage.getItem('auth_token');
  socket.emit('authenticate', token);
});
```

---

## Error Handling

### Standard Error Response Format

```javascript
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error message"],
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `AUTHENTICATION_REQUIRED` - Missing or invalid token
- `AUTHORIZATION_FAILED` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error

### Error Handling Example

```javascript
const apiCallWithErrorHandling = async (endpoint, options = {}) => {
  try {
    const response = await apiCall(endpoint, options);
    return { success: true, data: response };
  } catch (error) {
    console.error('API Error:', error);
    
    // Handle specific error types
    if (error.message.includes('401')) {
      // Token expired, try to refresh
      try {
        await refreshToken();
        // Retry the original request
        const response = await apiCall(endpoint, options);
        return { success: true, data: response };
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return { success: false, error: 'Authentication failed' };
      }
    }
    
    return { 
      success: false, 
      error: error.message || 'Request failed' 
    };
  }
};
```

---

## TypeScript Interfaces

### User & Authentication

```typescript
interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  profile: UserProfile;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  bio?: string;
  location?: string;
  sports: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  achievements: Achievement[];
  statistics: UserStatistics;
}

interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

### Match & Tournament

```typescript
interface Match {
  _id: string;
  type: 'public' | 'private';
  sport: string;
  participants: User[];
  maxParticipants: number;
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  schedule: {
    date: string;
    time: string;
    timezone: string;
  };
  venue: Venue;
  rules: MatchRules;
  result?: MatchResult;
  createdAt: string;
  updatedAt: string;
}

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  participants: User[];
  maxParticipants: number;
  status: 'upcoming' | 'in-progress' | 'completed';
  startDate: string;
  endDate: string;
  rules: TournamentRules;
  bracket: TournamentBracket;
  createdAt: string;
  updatedAt: string;
}
```

### Chat & Messaging

```typescript
interface Chat {
  _id: string;
  type: 'direct' | 'group' | 'match' | 'tournament';
  name?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  chat: string;
  sender: User;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  isEdited: boolean;
  reactions: MessageReaction[];
  createdAt: string;
  updatedAt: string;
}
```

### API Response Types

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ErrorResponse {
  success: false;
  message: string;
  errors: string[];
  code: string;
}
```

---

## Best Practices

### 1. Token Management

```javascript
// Create an axios instance with interceptors
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1'
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('/auth/refresh', { refreshToken });
        
        localStorage.setItem('auth_token', response.data.accessToken);
        
        // Retry the original request
        error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return axios.request(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### 2. Real-time State Management

```javascript
// React hook for socket management
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef(null);
  
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL);
    socketRef.current.emit('authenticate', token);
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  return socketRef.current;
};
```

### 3. Optimistic Updates

```javascript
// Example for sending a message with optimistic update
const sendMessageOptimistic = async (chatId, content) => {
  const tempMessage = {
    _id: `temp-${Date.now()}`,
    content,
    sender: currentUser,
    createdAt: new Date().toISOString(),
    isOptimistic: true
  };
  
  // Add message to UI immediately
  addMessageToChat(chatId, tempMessage);
  
  try {
    const response = await sendMessage(chatId, { content });
    // Replace temp message with real message
    replaceMessage(tempMessage._id, response.data);
  } catch (error) {
    // Remove temp message and show error
    removeMessage(tempMessage._id);
    showError('Failed to send message');
  }
};
```

### 4. Caching Strategy

```javascript
// Simple cache implementation
class APICache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
}

const cache = new APICache();

// Cached API call
const getCachedData = async (endpoint) => {
  const cached = cache.get(endpoint);
  if (cached) return cached;
  
  const data = await apiCall(endpoint);
  cache.set(endpoint, data);
  return data;
};
```

---

## Troubleshooting

### Common Issues

#### 1. CORS Errors
```javascript
// If you encounter CORS issues, ensure your frontend URL is configured in the backend
// Check the CORS_ORIGIN environment variable in the backend
```

#### 2. Token Expiration
```javascript
// Always handle 401 responses by attempting token refresh
// Implement automatic token refresh in your HTTP client
```

#### 3. WebSocket Connection Issues
```javascript
// Check if the socket URL is correct
// Verify that the authentication token is valid
// Monitor connection events for debugging

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});
```

#### 4. Rate Limiting
```javascript
// The API has rate limits: 100 requests per 15 minutes
// Implement retry logic with exponential backoff

const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};
```

### Environment Variables

Create a `.env` file in your frontend project:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_SOCKET_URL=http://localhost:3000

# Authentication
REACT_APP_JWT_REFRESH_THRESHOLD=300000  # 5 minutes in ms

# Features
REACT_APP_ENABLE_REALTIME=true
REACT_APP_ENABLE_PUSH_NOTIFICATIONS=true
```

### Debugging Tools

1. **Network Tab**: Monitor API calls in browser dev tools
2. **Socket.IO Debug**: Enable socket debugging
   ```javascript
   localStorage.debug = 'socket.io-client:socket';
   ```
3. **API Health Check**: 
   ```javascript
   const healthCheck = () => fetch('http://localhost:3000/health');
   ```

---

## Support & Resources

- **API Documentation**: [Swagger UI](http://localhost:3000/api-docs)
- **Postman Collection**: Import from `API_EXAMPLES.md`
- **GitHub Issues**: Report bugs and request features
- **Architecture Overview**: See `ARCHITECTURE.md`

For additional help, create an issue in the repository or contact the development team.