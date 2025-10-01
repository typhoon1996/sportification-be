# Sports Companion API Backend

A comprehensive, production-ready backend API for the Sports Companion Application. This backend provides a robust foundation for connecting sports enthusiasts worldwide through matches, tournaments, real-time chat, and social features.

## 🚀 Features

### Core Functionality

- **User Management**: Complete user registration, authentication, and profile management
- **Match System**: Create, join, and manage sports matches with real-time updates
- **Tournament Management**: Organize tournaments with bracket generation and standings
- **Team Management**: Create teams, manage members, assign roles, and coordinate through team chat
- **Real-time Chat**: WebSocket-powered messaging for matches, tournaments, teams, and direct messaging
- **Social Features**: Friends system, achievements, and user stats
- **Venue Management**: Location-based venue system for matches
- **Notifications**: Real-time push notifications for match updates, team events, and social interactions

### Technical Features

- **Authentication**: JWT-based authentication with refresh tokens
- **Security**: Comprehensive security middleware including rate limiting, CORS, and input sanitization
- **Database**: MongoDB with Mongoose ODM for robust data modeling
- **Real-time**: Socket.IO integration for live updates
- **File Upload**: Support for media uploads with validation
- **Logging**: Structured logging with Winston
- **Error Handling**: Centralized error handling with detailed error responses
- **Validation**: Request validation using express-validator
- **Documentation**: OpenAPI/Swagger documentation
- **Testing**: Unit and integration test setup with Jest
- **Docker**: Full containerization support
- **CI/CD**: GitHub Actions workflow configuration

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **MongoDB**: v5.0 or higher
- **Redis**: v6.0 or higher (optional, for caching)
- **Docker**: v20.0 or higher (for containerized deployment)

## 🛠️ Installation & Setup

### Option 1: Local Development

#### Quick Setup (Recommended)

For the fastest setup, use our automated setup script:

```bash
git clone <repository-url>
cd sportificatoin-be
./scripts/setup.sh
```

This script will:
- Check prerequisites (Node.js, npm)
- Install dependencies
- Create `.env` file from template
- Build the project
- Run code quality checks

#### Manual Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd sportificatoin-be
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   # Copy environment file for development
   cp .env.development .env
   
   # Edit the .env file with your configuration
   nano .env
   ```

4. **Start MongoDB** (if not using Docker)

   ```bash
   # Using MongoDB locally
   mongod --dbpath /path/to/your/db
   
   # Or using MongoDB Atlas (update MONGODB_URI in .env)
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

### Option 2: Docker Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd sportificatoin-be
   ```

2. **Start with Docker Compose**

   ```bash
   docker-compose up -d
   ```

3. **Check the logs**

   ```bash
   docker-compose logs -f api
   ```

## 🚀 Production Deployment

### Docker Production Setup

1. **Build production image**

   ```bash
   docker build -t sportificatoin-api:latest .
   ```

2. **Run with production environment**

   ```bash
   docker run -d \
     --name sportificatoin-api \
     -p 3000:3000 \
     --env-file .env.production \
     sportificatoin-api:latest
   ```

### Environment Variables

Create appropriate `.env` files for your environment:

#### Development (.env.development)

```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sportificatoin_dev
JWT_SECRET=your-dev-jwt-secret
JWT_REFRESH_SECRET=your-dev-refresh-secret
CORS_ORIGIN=http://localhost:3000
```

#### Production (.env.production)

```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/sportificatoin_prod
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
CORS_ORIGIN=https://yourdomain.com
```

## 📚 API Documentation

The API follows RESTful conventions with the following base structure:

**Base URL**: `http://localhost:3000/api/v1`

### Authentication Endpoints

```http
POST   /api/v1/auth/register      # User registration
POST   /api/v1/auth/login         # User login
POST   /api/v1/auth/refresh       # Refresh access token
POST   /api/v1/auth/logout        # User logout
GET    /api/v1/auth/profile       # Get current user profile
PATCH  /api/v1/auth/profile       # Update user profile
```

### Core Endpoints

```http
# Users
GET    /api/v1/users              # Get all users
GET    /api/v1/users/:id          # Get user by ID
GET    /api/v1/users/:id/friends  # Get user friends
POST   /api/v1/users/:id/friend   # Add friend

# Matches
GET    /api/v1/matches            # Get matches
POST   /api/v1/matches            # Create match
GET    /api/v1/matches/:id        # Get match details
PATCH  /api/v1/matches/:id        # Update match

# Tournaments
GET    /api/v1/tournaments        # Get tournaments
POST   /api/v1/tournaments        # Create tournament
GET    /api/v1/tournaments/:id    # Get tournament details

# Teams
GET    /api/v1/teams              # Get teams
POST   /api/v1/teams              # Create team
GET    /api/v1/teams/my/teams     # Get user's teams
GET    /api/v1/teams/:id          # Get team details
PATCH  /api/v1/teams/:id          # Update team
DELETE /api/v1/teams/:id          # Delete team
POST   /api/v1/teams/:id/join     # Join team
POST   /api/v1/teams/:id/leave    # Leave team

# Chats & Messaging
GET    /api/v1/chats              # Get user's chats
POST   /api/v1/chats              # Create new chat
GET    /api/v1/chats/:id          # Get chat details
GET    /api/v1/chats/:id/messages # Get chat messages
POST   /api/v1/chats/:id/messages # Send message
PUT    /api/v1/chats/messages/:id # Edit message
DELETE /api/v1/chats/messages/:id # Delete message

# Notifications
GET    /api/v1/notifications      # Get user notifications
POST   /api/v1/notifications/:id/read # Mark as read
PATCH  /api/v1/notifications/preferences # Update preferences

# And more...
```

### Example API Usage

**Register a new user:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe"
  }'
```

**Create a match:**

```bash
curl -X POST http://localhost:3000/api/v1/matches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "type": "public",
    "sport": "football",
    "schedule": {
      "date": "2024-01-15T00:00:00.000Z",
      "time": "18:00",
      "timezone": "UTC"
    },
    "venue": "venue-object-id"
  }'
```

## 🛠️ Scripts & Utilities

### Setup & Installation

```bash
# Quick setup (automated)
./scripts/setup.sh

# Manual setup
npm install
cp .env.development .env
npm run build
```

### Development Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

### Database Operations

```bash
# Run migrations
npm run migrate

# Seed database with sample data
npm run seed
```

### Health Checks

```bash
# Check application health (local)
./scripts/health-check.sh

# Check specific environment
./scripts/health-check.sh https://api.example.com
```

### Docker Operations

```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run

# Docker Compose (full stack)
docker-compose up -d
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```markdown
src/
├── tests/
│   ├── setup.ts           # Test configuration
│   ├── auth.test.ts       # Authentication tests
│   ├── matches.test.ts    # Match functionality tests
│   └── users.test.ts      # User management tests
```

## 🏗️ Project Structure

```markdown
sportificatoin-be/
├── src/
│   ├── config/            # Configuration files
│   │   ├── index.ts       # Main config
│   │   └── database.ts    # Database connection
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # Route definitions
│   ├── services/         # Business logic services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── validators/       # Input validation schemas
│   ├── app.ts           # Express app setup
│   └── index.ts         # Application entry point
├── logs/                # Application logs
├── docker-compose.yml   # Docker development setup
├── Dockerfile          # Production container
└── README.md          # This file
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues

# Database
npm run migrate          # Run database migrations
npm run seed             # Seed database with sample data

# Docker
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
```

### Code Style & Standards

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Configured with TypeScript-specific rules
- **Prettier**: Code formatting (configure as needed)
- **Naming Conventions**:
  - PascalCase for classes and types
  - camelCase for variables and functions
  - UPPER_SNAKE_CASE for constants

### Database Models

The application uses the following main models:

- **User**: User accounts and authentication
- **Profile**: User profile information
- **Match**: Sports matches and games
- **Tournament**: Tournament management
- **Team**: Team management with members and roles
- **Chat**: Real-time messaging (direct, group, match, tournament, team)
- **Message**: Individual chat messages
- **Venue**: Sports venues and locations
- **Notification**: User notifications
- **Achievement**: User achievements and gamification

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: MongoDB sanitization
- **CORS Configuration**: Proper cross-origin resource sharing
- **Security Headers**: Helmet.js for security headers
- **Password Hashing**: bcrypt for password security
- **Environment Variables**: Sensitive data protection

## 📈 Monitoring & Logging

### Logging

- **Development**: Console logging with colors
- **Production**: File-based logging with rotation
- **Levels**: Error, Warning, Info, Debug
- **Structure**: JSON format for production

### Health Checks

```bash
# Check application health
curl http://localhost:3000/health

# Response:
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

## 🚀 Deployment Options

### Cloud Platforms

- **AWS**: ECS, Lambda, or EC2
- **Google Cloud**: Cloud Run or Compute Engine
- **Azure**: Container Instances or App Service
- **Heroku**: Direct deployment support
- **DigitalOcean**: App Platform or Droplets

### Database Options

- **MongoDB Atlas**: Managed MongoDB service
- **AWS DocumentDB**: MongoDB-compatible service
- **Self-hosted**: Docker or traditional installation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new functionality
- Follow the existing code style
- Update documentation as needed
- Ensure all tests pass before submitting PR
- See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines

## 🔧 Troubleshooting

### Common Issues

#### MongoDB Connection Issues

**Problem**: `MongoNetworkError: connect ECONNREFUSED`

**Solutions**:
1. Ensure MongoDB is running: `mongod` or check your MongoDB service
2. Verify `MONGODB_URI` in your `.env` file
3. Check if MongoDB is listening on the correct port (default: 27017)

```bash
# Check MongoDB status (macOS)
brew services list | grep mongodb

# Check MongoDB status (Linux)
sudo systemctl status mongod

# Start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

#### Redis Connection Issues (Optional Feature)

**Problem**: Redis connection errors

**Solutions**:
1. Redis is optional - the app will work without it (caching disabled)
2. To use Redis, ensure it's running: `redis-server`
3. Verify `REDIS_URL` in your `.env` file

#### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use a different port in .env
PORT=3001
```

#### Build Errors

**Problem**: TypeScript compilation errors

**Solutions**:
1. Ensure you're using Node.js >= 18.0.0: `node --version`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Clear TypeScript cache: `rm -rf dist/`
4. Check for syntax errors: `npm run lint`

#### Environment Variables Not Loading

**Problem**: `undefined` values for config variables

**Solutions**:
1. Ensure `.env` file exists in project root
2. Check file has correct format: `KEY=value` (no spaces around `=`)
3. Restart development server after changing `.env`
4. Verify environment: `NODE_ENV=development npm run dev`

#### Test Failures

**Problem**: Tests failing unexpectedly

**Solutions**:
```bash
# Clear test cache
npm test -- --clearCache

# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- path/to/test.ts
```

#### Linting Errors

**Problem**: ESLint errors blocking commits

**Solutions**:
```bash
# Auto-fix issues
npm run lint:fix

# Check remaining issues
npm run lint

# See CODE_QUALITY.md for more details
```

### Performance Issues

#### Slow API Response Times

1. **Check database indexes**: Ensure proper indexes on frequently queried fields
2. **Enable Redis caching**: Set up Redis for caching frequently accessed data
3. **Monitor queries**: Use MongoDB profiling to identify slow queries
4. **Review logs**: Check `logs/combined.log` for performance metrics

#### High Memory Usage

1. **Limit result sets**: Always use pagination for large data queries
2. **Close database connections**: Ensure connections are properly closed
3. **Clear logs**: Rotate or delete old log files in `logs/`

### Getting Help

If you're still experiencing issues:

1. **Check Documentation**: Review docs in `/docs` directory
2. **Search Issues**: Check [GitHub Issues](https://github.com/SlenderShield/sportificatoin-be/issues)
3. **Create an Issue**: Provide:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)
   - Relevant logs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the test files for usage examples

## 🔮 Roadmap

- [ ] Advanced tournament bracket systems
- [ ] Real-time match score tracking
- [ ] Push notification service integration
- [ ] Advanced user analytics
- [ ] Mobile app API optimizations
- [ ] GraphQL API support
- [ ] Microservices architecture migration
- [ ] Advanced caching strategies
- [ ] Machine learning for match recommendations

---

## 📖 Additional Documentation

### For Frontend Developers

- **[Frontend Developer Guide](FRONTEND_GUIDE.md)** - Comprehensive guide for user-facing frontend integration
- **[Admin Frontend Guide](ADMIN_FRONTEND_GUIDE.md)** - Specialized guide for admin dashboard development
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference with examples and schemas (includes user and admin APIs)
- **[TypeScript Interfaces](TYPESCRIPT_INTERFACES.md)** - Type definitions for TypeScript projects
- **[WebSocket Events Guide](WEBSOCKET_GUIDE.md)** - Real-time events documentation
- **[Environment Setup Guide](SETUP_GUIDE.md)** - Quick setup for frontend developers

### For Backend Developers

- **[Architecture Overview](ARCHITECTURE.md)** - System architecture and design patterns
- **[API Examples](API_EXAMPLES.md)** - cURL examples for testing endpoints
- **[Data Models](data-model-entity.md)** - Database schema and relationships
- **[Security Guide](SECURITY.md)** - Security implementation details

---

### Built with ❤️ for the sports community
# sportification-be
