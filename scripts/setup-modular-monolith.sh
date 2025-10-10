#!/bin/bash

# Modular Monolith Setup Script
# This script sets up the basic structure for modular monolith architecture

set -e

echo "🚀 Setting up Modular Monolith Architecture for Sportification"
echo "================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create shared infrastructure
echo -e "${BLUE}📁 Creating shared infrastructure...${NC}"
mkdir -p src/shared/{events,database,cache,logging,middleware,types}
echo -e "${GREEN}✓ Shared infrastructure directories created${NC}"

# Create module directories
echo -e "${BLUE}📁 Creating module directories...${NC}"
modules=("iam" "users" "matches" "tournaments" "teams" "chat" "notifications" "venues" "analytics" "ai")

for module in "${modules[@]}"; do
    echo "  Creating $module module..."
    mkdir -p "src/modules/$module"/{api/{controllers,routes,validators},domain/{services,repositories},data/models,events/{publishers,subscribers},types}
    
    # Create module entry point
    cat > "src/modules/$module/index.ts" << EOF
/**
 * $module Module - Public API
 * 
 * This is the ONLY file that other modules should import from.
 * All internal implementation is hidden.
 */

// Export module types
export * from './types';

// Export services (to be implemented)
// export { ${module^}Service } from './domain/services/${module^}Service';

// Export events (to be implemented)
// export { ${module^}CreatedEvent } from './events/publishers/${module^}EventPublisher';
EOF
    
    # Create types file
    cat > "src/modules/$module/types/index.ts" << EOF
/**
 * $module Module Types
 */

// TODO: Add your module-specific types here
export interface I${module^} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
EOF

    echo -e "${GREEN}  ✓ $module module created${NC}"
done

echo -e "${GREEN}✓ All modules created${NC}"
echo ""

# Create EventBus
echo -e "${BLUE}📝 Creating EventBus...${NC}"
cat > src/shared/events/EventBus.ts << 'EOF'
import { EventEmitter } from 'events';
import logger from '../../utils/logger';

export interface DomainEvent {
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  timestamp: Date;
  payload: any;
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
  };
}

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(100); // Allow many subscribers
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  publish(event: DomainEvent): void {
    logger.info(`📢 Event published: ${event.eventType}`, {
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType
    });

    this.emit(event.eventType, event);
    this.emit('*', event); // Global event listener
  }

  subscribe(eventType: string, handler: (event: DomainEvent) => void | Promise<void>): void {
    this.on(eventType, async (event: DomainEvent) => {
      try {
        await handler(event);
        logger.info(`✓ Event handled: ${eventType}`, { aggregateId: event.aggregateId });
      } catch (error) {
        logger.error(`❌ Error handling event ${eventType}:`, error);
        // Optionally: publish to dead letter queue
      }
    });
  }

  subscribeAll(handler: (event: DomainEvent) => void | Promise<void>): void {
    this.subscribe('*', handler);
  }

  unsubscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    this.off(eventType, handler);
  }
}

export const eventBus = EventBus.getInstance();
EOF

echo -e "${GREEN}✓ EventBus created${NC}"
echo ""

# Create Module base class
echo -e "${BLUE}📝 Creating Module base class...${NC}"
mkdir -p src/shared/module
cat > src/shared/module/Module.ts << 'EOF'
import { Router } from 'express';
import { eventBus, DomainEvent } from '../events/EventBus';

export interface ModuleConfig {
  name: string;
  version: string;
  basePath: string;
  dependencies?: string[];
}

export abstract class Module {
  protected config: ModuleConfig;
  protected router: Router;

  constructor(config: ModuleConfig) {
    this.config = config;
    this.router = Router();
  }

  /**
   * Initialize the module
   * Called during application bootstrap
   */
  abstract initialize(): Promise<void>;

  /**
   * Get the module's Express router
   */
  abstract getRouter(): Router;

  /**
   * Register event handlers for this module
   */
  abstract registerEventHandlers(): void;

  /**
   * Get module name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get module base path
   */
  getBasePath(): string {
    return this.config.basePath;
  }

  /**
   * Get module version
   */
  getVersion(): string {
    return this.config.version;
  }

  /**
   * Get module dependencies
   */
  getDependencies(): string[] {
    return this.config.dependencies || [];
  }

  /**
   * Publish a domain event
   */
  protected publishEvent(eventType: string, payload: any, aggregateId?: string): void {
    eventBus.publish({
      eventType,
      aggregateId: aggregateId || payload.id || 'unknown',
      aggregateType: this.config.name,
      timestamp: new Date(),
      payload,
      metadata: {
        correlationId: payload.correlationId
      }
    });
  }

  /**
   * Subscribe to a domain event
   */
  protected subscribeToEvent(
    eventType: string,
    handler: (event: DomainEvent) => void | Promise<void>
  ): void {
    eventBus.subscribe(eventType, handler);
  }
}
EOF

echo -e "${GREEN}✓ Module base class created${NC}"
echo ""

# Create example IAM module
echo -e "${BLUE}📝 Creating example IAM module implementation...${NC}"

# IAM Service
cat > src/modules/iam/domain/services/AuthService.ts << 'EOF'
import bcrypt from 'bcryptjs';
import { User } from '../../../../models/User';
import { generateToken } from '../../../../utils/jwt';
import { eventBus } from '../../../../shared/events/EventBus';

export class AuthService {
  async register(email: string, password: string, firstName: string, lastName: string) {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isActive: true
    });

    // Generate tokens
    const accessToken = generateToken(user.id, '7d');
    const refreshToken = generateToken(user.id, '30d');

    // Publish event
    eventBus.publish({
      eventType: 'iam.user.registered',
      aggregateId: user.id,
      aggregateType: 'User',
      timestamp: new Date(),
      payload: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      accessToken,
      refreshToken
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = generateToken(user.id, '7d');
    const refreshToken = generateToken(user.id, '30d');

    // Publish event
    eventBus.publish({
      eventType: 'iam.user.logged_in',
      aggregateId: user.id,
      aggregateType: 'User',
      timestamp: new Date(),
      payload: {
        userId: user.id,
        email: user.email
      }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      accessToken,
      refreshToken
    };
  }
}
EOF

# IAM Controller
cat > src/modules/iam/api/controllers/AuthController.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../domain/services/AuthService';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const result = await authService.register(email, password, firstName, lastName);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login(email, password);
      
      res.json({
        success: true,
        data: result,
        message: 'Login successful'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
EOF

# IAM Routes
cat > src/modules/iam/api/routes/index.ts << 'EOF'
import { Router } from 'express';
import { authController } from '../controllers/AuthController';

const router = Router();

// Authentication routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

export default router;
EOF

# Update IAM index.ts
cat > src/modules/iam/index.ts << 'EOF'
/**
 * IAM (Identity & Access Management) Module - Public API
 * 
 * This module handles authentication, authorization, and user identity.
 */

// Export services
export { AuthService } from './domain/services/AuthService';

// Export types
export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface IAuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

// Export events
export const UserRegisteredEvent = 'iam.user.registered';
export const UserLoggedInEvent = 'iam.user.logged_in';
export const UserLoggedOutEvent = 'iam.user.logged_out';
EOF

echo -e "${GREEN}✓ IAM module implementation created${NC}"
echo ""

# Create example Users module event subscriber
echo -e "${BLUE}📝 Creating example Users module event subscriber...${NC}"

cat > src/modules/users/events/subscribers/UserEventSubscriber.ts << 'EOF'
import { eventBus } from '../../../../shared/events/EventBus';
import { UserRegisteredEvent } from '../../../iam';
import { Profile } from '../../../../models/Profile';
import logger from '../../../../utils/logger';

export class UserEventSubscriber {
  static initialize() {
    // Subscribe to IAM events
    eventBus.subscribe(UserRegisteredEvent, this.handleUserRegistered.bind(this));
    
    logger.info('✓ Users module event subscribers initialized');
  }

  private static async handleUserRegistered(event: any): Promise<void> {
    const { userId, email, firstName, lastName } = event.payload;

    try {
      // Create user profile automatically when user registers
      await Profile.create({
        user: userId,
        firstName,
        lastName,
        username: email.split('@')[0], // Generate initial username from email
        achievements: [],
        stats: {
          matchesPlayed: 0,
          wins: 0,
          losses: 0
        }
      });

      logger.info(`✓ Profile created for user ${userId}`);
    } catch (error) {
      logger.error(`❌ Failed to create profile for user ${userId}:`, error);
      throw error;
    }
  }
}
EOF

echo -e "${GREEN}✓ Users module event subscriber created${NC}"
echo ""

# Create README for modules
echo -e "${BLUE}📝 Creating module documentation...${NC}"

cat > src/modules/README.md << 'EOF'
# Modules

This directory contains all application modules following the Modular Monolith architecture.

## Module Structure

Each module follows this structure:

```
module-name/
├── api/                    # HTTP layer (controllers, routes, validators)
│   ├── controllers/
│   ├── routes/
│   └── validators/
├── domain/                 # Business logic layer
│   ├── services/          # Business services
│   └── repositories/      # Data access repositories
├── data/                   # Data layer
│   └── models/            # Database models
├── events/                 # Event layer
│   ├── publishers/        # Event publishers
│   └── subscribers/       # Event subscribers
├── types/                  # TypeScript types and interfaces
│   └── index.ts
├── index.ts               # PUBLIC API - Only exports from here!
└── README.md              # Module documentation
```

## Available Modules

- **iam**: Identity & Access Management (authentication, authorization)
- **users**: User profiles, friends, achievements
- **matches**: Match management and real-time updates
- **tournaments**: Tournament creation and management
- **teams**: Team management with roles
- **chat**: Real-time messaging
- **notifications**: Notification system
- **venues**: Venue management with geospatial features
- **analytics**: Analytics and insights
- **ai**: AI/ML features

## Module Communication

### Synchronous (Direct Calls)

Use for immediate responses and validation:

```typescript
import { UserService } from '../users';

const userService = new UserService();
const user = await userService.getUserById(userId);
```

### Asynchronous (Events)

Use for loose coupling and eventual consistency:

```typescript
// Publishing
eventBus.publish({
  eventType: 'matches.match.completed',
  aggregateId: matchId,
  timestamp: new Date(),
  payload: { matchId, winnerId }
});

// Subscribing
eventBus.subscribe('matches.match.completed', async (event) => {
  // Handle event
});
```

## Rules

1. **Only import from index.ts**: Never import directly from module internals
2. **No circular dependencies**: Module A → B → A is forbidden
3. **Hide implementation**: Only expose what's necessary via index.ts
4. **Use events for decoupling**: Modules should communicate via events when possible
5. **Keep modules focused**: Each module should have a single responsibility

## Adding a New Module

1. Create directory structure: `mkdir -p src/modules/my-module/{api,domain,data,events,types}`
2. Create `index.ts` with public API
3. Implement your business logic
4. Register routes in `app.ts`
5. Initialize event subscribers in `index.ts` (server startup)
EOF

echo -e "${GREEN}✓ Module documentation created${NC}"
echo ""

# Create migration guide
cat > MIGRATION_STEPS.md << 'EOF'
# Migration Steps to Modular Monolith

## Phase 1: Foundation (✅ DONE)

- [x] Create module directories
- [x] Create EventBus
- [x] Create Module base class
- [x] Create IAM module example
- [x] Create Users event subscriber example

## Phase 2: Update Application Bootstrap (TODO)

1. Update `src/index.ts` to initialize event subscribers:

```typescript
import { UserEventSubscriber } from './modules/users/events/subscribers/UserEventSubscriber';

// After database connection
await connectDatabase();

// Initialize event subscribers
UserEventSubscriber.initialize();
// Add more subscriber initializations as you create them

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Architecture: Modular Monolith`);
});
```

2. Update `src/app.ts` to use IAM module routes:

```typescript
import iamRoutes from './modules/iam/api/routes';

// Add module routes
app.use('/api/v1/auth', iamRoutes);

// Keep existing routes for now (gradually migrate them)
```

## Phase 3: Test IAM Module (TODO)

1. Start your server
2. Test registration:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

3. Check logs - you should see:
   - "📢 Event published: iam.user.registered"
   - "✓ Profile created for user ..."

## Phase 4: Migrate Other Modules (TODO)

Gradually migrate your existing code:

1. **Users Module**: Move user-related controllers, services
2. **Matches Module**: Move match-related code
3. **Tournaments Module**: Move tournament code
4. **Teams Module**: Move team code
5. **Chat Module**: Move chat code
6. **Notifications Module**: Move notification code
7. **Venues Module**: Move venue code
8. **Analytics Module**: Move analytics code
9. **AI Module**: Move AI/ML code

## Phase 5: Clean Up (TODO)

1. Remove old controller files
2. Remove old route files
3. Update all imports to use module public APIs
4. Update tests
5. Update documentation

## Progress Tracking

| Module | Status | Routes Migrated | Events Working | Tests Updated |
|--------|--------|----------------|----------------|---------------|
| IAM | ✅ Done | 2/2 | Yes | TODO |
| Users | ⚠️ Events Only | 0/5 | Yes | TODO |
| Matches | ⏳ TODO | 0/8 | No | TODO |
| Tournaments | ⏳ TODO | 0/6 | No | TODO |
| Teams | ⏳ TODO | 0/7 | No | TODO |
| Chat | ⏳ TODO | 0/4 | No | TODO |
| Notifications | ⏳ TODO | 0/3 | No | TODO |
| Venues | ⏳ TODO | 0/5 | No | TODO |
| Analytics | ⏳ TODO | 0/4 | No | TODO |
| AI | ⏳ TODO | 0/3 | No | TODO |

## Next Steps

1. Update `src/index.ts` with event subscriber initialization
2. Update `src/app.ts` with IAM routes
3. Test the IAM module
4. Start migrating Users module
5. Repeat for other modules

Good luck! 🚀
EOF

echo -e "${GREEN}✓ Migration guide created${NC}"
echo ""

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Modular Monolith Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📁 Created:"
echo "  - Module directories for 10 modules"
echo "  - EventBus implementation"
echo "  - Module base class"
echo "  - IAM module example (AuthService, Controller, Routes)"
echo "  - Users event subscriber example"
echo "  - Documentation and migration guide"
echo ""
echo "📝 Next Steps:"
echo "  1. Read MIGRATION_STEPS.md"
echo "  2. Update src/index.ts to initialize event subscribers"
echo "  3. Update src/app.ts to use IAM module routes"
echo "  4. Test the IAM module"
echo "  5. Gradually migrate other modules"
echo ""
echo "📖 Documentation:"
echo "  - MODULAR_MONOLITH_REFACTORING.md (Complete guide)"
echo "  - MODULAR_MONOLITH_QUICK_START.md (Quick start)"
echo "  - ARCHITECTURE_COMPARISON.md (Architecture comparison)"
echo "  - MIGRATION_STEPS.md (Step-by-step migration)"
echo ""
echo -e "${YELLOW}⚠️  Remember: Migrate gradually, test often!${NC}"
echo ""
