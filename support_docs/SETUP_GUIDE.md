# Environment Setup Guide for Frontend Developers

## Quick Setup Guide for Sports Companion API Integration

This guide will help frontend developers quickly set up and connect to the Sports Companion backend API for development and testing.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Environment Configuration](#environment-configuration)
4. [Frontend Integration Setup](#frontend-integration-setup)
5. [Testing the Connection](#testing-the-connection)
6. [Development Workflow](#development-workflow)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **MongoDB**: v5.0 or higher (or MongoDB Atlas account)
- **Git**: Latest version

### Optional but Recommended

- **Docker & Docker Compose**: For containerized development
- **Postman**: For API testing
- **MongoDB Compass**: GUI for MongoDB
- **Redis**: For caching (optional in development)

---

## Backend Setup

### Option 1: Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/SlenderShield/sportificatoin-be.git
cd sportificatoin-be
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Environment Configuration

Copy the development environment file:

```bash
cp .env.development .env
```

Edit the `.env` file with your configuration:

```bash
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
MONGODB_URI=mongodb://localhost:27017/sportificatoin_dev

# JWT Secrets (generate secure ones for production)
JWT_SECRET=your-super-secret-jwt-key-for-development
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-for-development
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12

# CORS - Add your frontend URL here
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379

# Optional: Email configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-dev-email@gmail.com
EMAIL_PASS=your-app-password
```

#### 4. Start MongoDB

**Option A: Local MongoDB**
```bash
# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb  # macOS
```

**Option B: MongoDB Atlas (Recommended)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string and update `MONGODB_URI` in `.env`

#### 5. Start the Backend Server

```bash
# Development mode with hot reload
npm run dev

# Or build and start
npm run build
npm start
```

The server will start at `http://localhost:3000`

### Option 2: Docker Setup (Recommended)

#### 1. Clone and Setup

```bash
git clone https://github.com/SlenderShield/sportificatoin-be.git
cd sportificatoin-be
```

#### 2. Start with Docker Compose

```bash
# Start all services (API, MongoDB, Redis)
docker-compose up -d

# View logs
docker-compose logs -f api
```

This will start:
- API server on `http://localhost:3000`
- MongoDB on `localhost:27017`
- Redis on `localhost:6379`

---

## Environment Configuration

### Frontend Environment Variables

Create a `.env` file in your frontend project:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_SOCKET_URL=http://localhost:3000

# For Vue.js, use VUE_APP_ prefix
VUE_APP_API_URL=http://localhost:3000/api/v1
VUE_APP_SOCKET_URL=http://localhost:3000

# For Next.js, use NEXT_PUBLIC_ prefix
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Development flags
REACT_APP_DEBUG=true
REACT_APP_MOCK_API=false
```

### CORS Configuration

Make sure your frontend URL is added to the backend CORS configuration. Update the backend `.env` file:

```bash
# Single origin
CORS_ORIGIN=http://localhost:3000

# Multiple origins (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:8080
```

---

## Frontend Integration Setup

### 1. HTTP Client Setup (Axios Example)

Create an API client file (`src/api/client.js` or `src/api/client.ts`):

```javascript
import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data.data;
        localStorage.setItem('auth_token', accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. API Service Functions

Create API service files (`src/api/auth.js`, `src/api/matches.js`, etc.):

```javascript
// src/api/auth.js
import apiClient from './client';

export const authAPI = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.patch('/auth/profile', data),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken })
};

// src/api/matches.js
export const matchAPI = {
  getMatches: (params) => apiClient.get('/matches', { params }),
  getMatch: (id) => apiClient.get(`/matches/${id}`),
  createMatch: (data) => apiClient.post('/matches', data),
  joinMatch: (id) => apiClient.post(`/matches/${id}/join`),
  leaveMatch: (id) => apiClient.post(`/matches/${id}/leave`),
  updateMatch: (id, data) => apiClient.patch(`/matches/${id}`, data)
};

// src/api/chats.js
export const chatAPI = {
  getChats: () => apiClient.get('/chats'),
  getChat: (id) => apiClient.get(`/chats/${id}`),
  getChatMessages: (id, params) => apiClient.get(`/chats/${id}/messages`, { params }),
  sendMessage: (id, message) => apiClient.post(`/chats/${id}/messages`, message),
  createChat: (data) => apiClient.post('/chats', data)
};
```

### 3. WebSocket Setup

Create a WebSocket client (`src/api/socket.js`):

```javascript
import io from 'socket.io-client';

class SocketClient {
  constructor() {
    this.socket = null;
    this.isAuthenticated = false;
  }

  connect() {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: false
    });

    this.setupEventListeners();
    this.socket.connect();

    return this.socket;
  }

  authenticate() {
    const token = localStorage.getItem('auth_token');
    if (token && this.socket) {
      this.socket.emit('authenticate', token);
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.authenticate();
    });

    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data.user);
      this.isAuthenticated = true;
    });

    this.socket.on('authentication_error', (error) => {
      console.error('Socket authentication failed:', error);
      this.isAuthenticated = false;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isAuthenticated = false;
    });

    this.socket.on('reconnect', () => {
      console.log('Reconnected to server');
      this.authenticate();
    });
  }

  joinRoom(roomId) {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit('join-room', roomId);
    }
  }

  leaveRoom(roomId) {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit('leave-room', roomId);
    }
  }

  sendMessage(roomId, message) {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit('send-message', { roomId, ...message });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isAuthenticated = false;
    }
  }
}

export default new SocketClient();
```

### 4. React Hooks (if using React)

Create custom hooks for API integration:

```javascript
// src/hooks/useAuth.js
import { useState, useEffect, useContext, createContext } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data.data.user);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    const { user, accessToken, refreshToken } = response.data.data;
    
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setUser(user);
    
    return user;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import socketClient from '../api/socket';

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = socketClient.connect();

    return () => {
      socketClient.disconnect();
    };
  }, []);

  return socketRef.current;
};

// src/hooks/useAPI.js
import { useState, useEffect } from 'react';

export const useAPI = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiCall();
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: () => fetchData() };
};
```

---

## Testing the Connection

### 1. Health Check

Test if the backend is running:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### 2. API Documentation

Visit the Swagger documentation:
- Open browser: `http://localhost:3000/api-docs`

### 3. Test Authentication

```javascript
// Test registration
const testAuth = async () => {
  try {
    // Register
    const registerResponse = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Registration:', registerData);
    
    // Login
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123!'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login:', loginData);
    
    return loginData.data.accessToken;
  } catch (error) {
    console.error('Auth test failed:', error);
  }
};
```

### 4. Test WebSocket Connection

```javascript
const testSocket = () => {
  const socket = io('http://localhost:3000');
  
  socket.on('connect', () => {
    console.log('Socket connected');
    
    // Test authentication
    const token = localStorage.getItem('auth_token');
    socket.emit('authenticate', token);
  });
  
  socket.on('authenticated', (data) => {
    console.log('Socket authenticated:', data);
  });
  
  socket.on('authentication_error', (error) => {
    console.error('Socket auth error:', error);
  });
};
```

---

## Development Workflow

### 1. Daily Development Setup

```bash
# Start backend
cd sportificatoin-be
npm run dev

# Start frontend (in another terminal)
cd your-frontend-project
npm start
```

### 2. Code Changes Workflow

1. **Backend Changes**: 
   - The server auto-restarts with `npm run dev`
   - Check logs for errors
   - Test endpoints in browser or Postman

2. **Frontend Changes**:
   - Use browser dev tools Network tab
   - Monitor API calls and responses
   - Check console for errors

### 3. Database Management

**View Data:**
```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/sportificatoin_dev

# List collections
show collections

# Find users
db.users.find().pretty()

# Find matches
db.matches.find().pretty()
```

**Reset Database:**
```bash
# Drop database
mongo mongodb://localhost:27017/sportificatoin_dev --eval "db.dropDatabase()"

# Or use the seed script
npm run seed
```

### 4. Testing API Changes

Create a test file (`test-api.js`):

```javascript
const apiClient = require('./src/api/client.js');

const runTests = async () => {
  try {
    // Test health
    const health = await fetch('http://localhost:3000/health');
    console.log('Health:', await health.json());
    
    // Test registration
    const user = await apiClient.post('/auth/register', {
      email: 'dev@test.com',
      password: 'DevPass123!',
      firstName: 'Dev',
      lastName: 'User',
      username: 'devuser'
    });
    
    console.log('User created:', user.data);
    
    // Test login
    const login = await apiClient.post('/auth/login', {
      email: 'dev@test.com',
      password: 'DevPass123!'
    });
    
    console.log('Login successful:', login.data);
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
};

runTests();
```

---

## Troubleshooting

### Common Issues

#### 1. CORS Errors
```
Access to fetch at 'http://localhost:3000/api/v1/auth/login' from origin 'http://localhost:3001' has been blocked by CORS policy
```

**Solution:**
- Add your frontend URL to backend `.env`:
  ```bash
  CORS_ORIGIN=http://localhost:3001
  ```
- Restart backend server

#### 2. MongoDB Connection Failed
```
MongoServerError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**
- Start MongoDB service: `sudo systemctl start mongod`
- Use MongoDB Atlas: Update `MONGODB_URI` in `.env`
- Check if MongoDB is running: `mongo --eval "db.stats()"`

#### 3. Port Already in Use
```
Error: listen EADDRINUSE :::3000
```

**Solutions:**
- Kill process using port: `sudo lsof -ti:3000 | xargs kill -9`
- Use different port: Change `PORT=3001` in `.env`

#### 4. JWT Token Issues
```
401 Unauthorized - Invalid token
```

**Solutions:**
- Check token in localStorage: `localStorage.getItem('auth_token')`
- Verify token format: Should start with `eyJ`
- Check if token expired: Login again
- Verify JWT_SECRET in backend `.env`

#### 5. WebSocket Connection Failed
```
WebSocket connection failed
```

**Solutions:**
- Check if server is running
- Verify socket URL in frontend
- Check browser console for detailed errors
- Try different transport: `{ transports: ['polling'] }`

### Debug Tools

#### 1. Backend Debugging
```bash
# Enable debug logs
DEBUG=* npm run dev

# Or specific modules
DEBUG=express:*,mongoose:* npm run dev
```

#### 2. Frontend Debugging
```javascript
// Enable API debugging
localStorage.setItem('debug', 'api:*');

// Enable socket debugging
localStorage.setItem('debug', 'socket.io-client:*');
```

#### 3. Network Monitoring
- Use browser DevTools → Network tab
- Monitor API calls and responses
- Check request/response headers
- Verify request payloads

### Environment Variables Checklist

**Backend (.env):**
- [ ] `NODE_ENV=development`
- [ ] `PORT=3000`
- [ ] `MONGODB_URI=mongodb://localhost:27017/sportificatoin_dev`
- [ ] `JWT_SECRET` (at least 32 characters)
- [ ] `CORS_ORIGIN=http://localhost:3000` (your frontend URL)

**Frontend (.env):**
- [ ] `REACT_APP_API_URL=http://localhost:3000/api/v1`
- [ ] `REACT_APP_SOCKET_URL=http://localhost:3000`

### Getting Help

1. **Check logs**: Backend console output and browser DevTools
2. **API Documentation**: `http://localhost:3000/api-docs`
3. **Health endpoint**: `http://localhost:3000/health`
4. **MongoDB logs**: Check database connection and queries
5. **GitHub Issues**: Create issue with error details and environment info

---

## Production Deployment Notes

When deploying to production, update environment variables:

**Backend:**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sportificatoin
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=super-secure-production-secret
```

**Frontend:**
```bash
REACT_APP_API_URL=https://api.yourdomain.com/api/v1
REACT_APP_SOCKET_URL=https://api.yourdomain.com
```

For detailed production deployment instructions, see the main `README.md`.