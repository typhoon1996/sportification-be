# Developer Onboarding Guide

Welcome to the Sports Companion Backend project! This guide will help you get up to speed quickly.

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Key Concepts](#key-concepts)
4. [Development Workflow](#development-workflow)
5. [Common Tasks](#common-tasks)
6. [Learning Resources](#learning-resources)

## 🚀 Quick Start

### Your First Day

1. **Setup Your Environment** (30 minutes)
   ```bash
   # Clone the repository
   git clone https://github.com/SlenderShield/sportificatoin-be.git
   cd sportificatoin-be
   
   # Install dependencies
   npm install
   
   # Copy environment file
   cp .env.development .env
   
   # Start development server
   npm run dev
   ```

2. **Verify Setup** (10 minutes)
   - Server should start on http://localhost:3000
   - Visit http://localhost:3000/health for health check
   - Visit http://localhost:3000/api/v1/docs for API documentation

3. **Read Key Documentation** (1 hour)
   - [README.md](README.md) - Project overview
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
   - [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

4. **Explore the Codebase** (1-2 hours)
   - Browse `/src` directory structure
   - Read through key controllers
   - Review middleware implementations

## 📁 Project Structure

```
sportificatoin-be/
├── src/
│   ├── app.ts              # Express app setup & middleware
│   ├── index.ts            # Application entry point
│   ├── config/             # Configuration management
│   │   ├── index.ts        # Main config file
│   │   ├── database.ts     # MongoDB connection
│   │   └── passport.ts     # OAuth strategies
│   ├── controllers/        # Request handlers
│   │   ├── AuthController.ts         # Authentication
│   │   ├── UserController.ts         # User management
│   │   ├── MatchController.ts        # Match operations
│   │   └── ...
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts         # Authentication middleware
│   │   ├── errorHandler.ts # Error handling
│   │   ├── validation.ts   # Request validation
│   │   └── security.ts     # Security middleware
│   ├── models/             # Mongoose schemas
│   │   ├── User.ts         # User model
│   │   ├── Match.ts        # Match model
│   │   └── ...
│   ├── routes/             # API routes
│   │   ├── auth.ts         # Auth endpoints
│   │   ├── users.ts        # User endpoints
│   │   └── ...
│   ├── services/           # Business logic
│   ├── utils/              # Helper functions
│   │   ├── logger.ts       # Winston logger
│   │   ├── jwt.ts          # JWT utilities
│   │   ├── cache.ts        # Redis caching
│   │   └── ...
│   ├── validators/         # Input validation schemas
│   └── types/              # TypeScript types
├── docs/                   # API documentation
├── tests/                  # Test files
└── logs/                   # Application logs
```

## 🧠 Key Concepts

### Architecture Patterns

**1. MVC Pattern**
- **Models**: Database schemas and data logic (Mongoose models)
- **Controllers**: Request handlers and response formatting
- **Routes**: URL mapping and middleware chaining

**2. Middleware Pipeline**
Every request flows through:
```
Request → Rate Limiting → CORS → Authentication → Authorization → Controller → Response
```

**3. Error Handling**
Centralized error handling using custom error classes:
- `ValidationError`: Invalid input (400)
- `AuthenticationError`: Auth required (401)
- `ForbiddenError`: Insufficient permissions (403)
- `NotFoundError`: Resource not found (404)
- `ConflictError`: Resource conflict (409)

### Key Technologies

- **Express.js**: Web framework
- **TypeScript**: Type-safe JavaScript
- **MongoDB + Mongoose**: Database and ODM
- **Socket.IO**: Real-time WebSocket communication
- **JWT**: Token-based authentication
- **Redis**: Caching (optional)
- **Winston**: Logging
- **Jest**: Testing

### Authentication Flow

```
1. User registers/logs in → POST /api/v1/auth/login
2. Server validates credentials
3. Server generates JWT tokens (access + refresh)
4. Client stores tokens
5. Client sends access token in Authorization header
6. Server validates token in middleware
7. Request proceeds to controller
```

### Database Models

Key relationships:
- **User** ↔ **Profile** (1:1)
- **User** ↔ **Match** (Many:Many via participants)
- **Match** ↔ **Venue** (Many:1)
- **Tournament** ↔ **Match** (1:Many)
- **User** ↔ **Team** (Many:Many via members)

## 💻 Development Workflow

### Day-to-Day Development

1. **Pull Latest Changes**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Write code following [coding standards](CONTRIBUTING.md#coding-standards)
   - Add tests for new functionality
   - Update documentation

4. **Test Your Changes**
   ```bash
   npm run lint       # Check code style
   npm run build      # Verify TypeScript compilation
   npm test           # Run tests
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```
   See [Commit Guidelines](CONTRIBUTING.md#commit-message-guidelines)

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

### Debugging

**Using VS Code Debugger:**

1. Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug TypeScript",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/src/index.ts"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

2. Set breakpoints in your code
3. Press F5 to start debugging

**Console Logging:**
Use the logger utility (not console.log):
```typescript
import logger from '../utils/logger';

logger.info('User logged in', { userId: user.id });
logger.error('Database error', { error: err.message });
logger.debug('Debugging info', { data });
```

## 🔧 Common Tasks

### Adding a New API Endpoint

1. **Create/Update Model** (if needed)
   ```typescript
   // src/models/NewModel.ts
   import { Schema, model } from 'mongoose';
   
   interface INewModel extends Document {
     name: string;
     // ... fields
   }
   
   const schema = new Schema({
     name: { type: String, required: true }
   });
   
   export const NewModel = model<INewModel>('NewModel', schema);
   ```

2. **Create Controller**
   ```typescript
   // src/controllers/NewController.ts
   import { Response } from 'express';
   import { NewModel } from '../models/NewModel';
   import { sendSuccess, asyncHandler } from '../middleware/errorHandler';
   import { AuthRequest } from '../middleware/auth';
   
   export class NewController {
     static create = asyncHandler(async (req: AuthRequest, res: Response) => {
       const newItem = await NewModel.create(req.body);
       sendSuccess(res, newItem, 'Created successfully', 201);
     });
   }
   ```

3. **Add Routes**
   ```typescript
   // src/routes/newRoutes.ts
   import { Router } from 'express';
   import { NewController } from '../controllers/NewController';
   import { authenticate } from '../middleware/auth';
   
   const router = Router();
   
   router.post('/', authenticate, NewController.create);
   
   export default router;
   ```

4. **Register Routes**
   ```typescript
   // src/app.ts
   import newRoutes from './routes/newRoutes';
   
   app.use('/api/v1/new', newRoutes);
   ```

5. **Add Tests**
   ```typescript
   // src/tests/new.test.ts
   describe('NewController', () => {
     it('should create new item', async () => {
       // Test implementation
     });
   });
   ```

### Adding Database Migration

```typescript
// src/scripts/migrate.ts
import { connectDB } from '../config/database';
import { User } from '../models/User';

async function migrate() {
  await connectDB();
  
  // Your migration logic
  await User.updateMany({}, { $set: { newField: 'default' } });
  
  console.log('Migration completed');
  process.exit(0);
}

migrate();
```

Run with: `npm run migrate`

### Working with WebSocket Events

```typescript
// In your controller or service
import { getIO } from '../app';

// Emit event to all clients
getIO().emit('event-name', data);

// Emit to specific room
getIO().to(roomId).emit('event-name', data);

// Emit to specific socket
socket.emit('event-name', data);
```

## 📖 Learning Resources

### Internal Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design and architecture
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
- [SECURITY.md](SECURITY.md) - Security features and best practices
- [WEBSOCKET_GUIDE.md](WEBSOCKET_GUIDE.md) - WebSocket implementation
- [TYPESCRIPT_INTERFACES.md](TYPESCRIPT_INTERFACES.md) - Type definitions

### External Resources

**TypeScript:**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

**Node.js & Express:**
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

**MongoDB & Mongoose:**
- [Mongoose Documentation](https://mongoosejs.com/docs/guide.html)
- [MongoDB University](https://university.mongodb.com/)

**Testing:**
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🎯 Next Steps

### Week 1
- [ ] Complete environment setup
- [ ] Read all documentation
- [ ] Explore codebase
- [ ] Fix a "good first issue"

### Week 2
- [ ] Implement a small feature
- [ ] Write tests for your feature
- [ ] Submit your first PR
- [ ] Participate in code review

### Week 3
- [ ] Take on a medium-complexity task
- [ ] Improve existing documentation
- [ ] Help onboard new team members

### Month 1
- [ ] Lead a feature implementation
- [ ] Contribute to architecture decisions
- [ ] Mentor other developers

## 💬 Getting Help

- **Code Questions**: Ask in team chat or create GitHub Discussion
- **Bug Reports**: Create GitHub Issue with reproduction steps
- **Feature Requests**: Discuss with team lead first
- **Documentation**: Check `/docs` or create PR to improve it

## 🎉 Welcome Aboard!

You're now ready to start contributing! Don't hesitate to ask questions - we're here to help.

Remember:
- 🧪 Test your code
- 📝 Document your changes
- 🔍 Review others' code
- 🚀 Keep learning

Happy coding! 🎊
