# 🎯 Sportification Backend Developer Guide

**AI-Assisted Development Manual for Modular Monolith Architecture**

> **Version**: 3.0 | **Last Updated**: October 27, 2025 | **Architecture**: Modular Monolith → Microservices-Ready

---

## ⚠️ IMPORTANT: Living Document Guidelines

> **This is a LIVING DOCUMENT** - Keep it in sync with the codebase at all times.

**For All Developers (Human & AI):**
- ✅ **ALWAYS update this file** when adding/modifying features, modules, services, or files
- ✅ **REVIEW this file FIRST** before starting any new feature development
- ✅ **Check for existing implementations** to prevent duplicate work
- ✅ **Document integration points** when connecting modules or external services
- ✅ **Update examples** when patterns or best practices change
- ✅ **Maintain accuracy** - outdated documentation is worse than no documentation

**What to Update:**
- New modules added → Update "Codebase Overview" and "Module Structure Deep Dive"
- New shared services → Update "Shared Infrastructure" section
- New utilities/middleware → Update relevant sections with usage examples
- Architecture changes → Update "Architecture Philosophy" and patterns
- New dependencies → Update configuration sections
- Breaking changes → Update all affected examples and guidelines

**Benefits of Keeping This Updated:**
- 🚀 Faster onboarding for new team members
- 🔄 Better code reuse and consistency
- 🤝 Streamlined collaboration across the team
- 🧠 AI agents stay context-aware and produce better code
- 📚 Single source of truth for architectural decisions

---

## 📚 Table of Contents

1. [Codebase Overview](#codebase-overview) ⭐ NEW
2. [Architecture Philosophy](#architecture-philosophy)
3. [Quick Start for AI Agents](#quick-start-for-ai-agents)
4. [Module Structure Deep Dive](#module-structure-deep-dive)
5. [Critical Design Patterns](#critical-design-patterns)
6. [Development Workflows](#development-workflows)
7. [API Design Standards](#api-design-standards)
8. [Testing Strategy](#testing-strategy)
9. [Security & Performance](#security--performance)
10. [Migration Roadmap](#migration-roadmap)
11. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🗺️ Codebase Overview

### Project Structure at a Glance

```
sportification-be/
├── src/
│   ├── app.ts                          # Main application entry point
│   ├── index.ts                        # Server bootstrapper
│   ├── modules/                        # Feature modules (bounded contexts)
│   │   ├── iam/                        # Identity & Access Management ⭐ FOUNDATION
│   │   ├── users/                      # User profiles & relationships
│   │   ├── matches/                    # Match management
│   │   ├── tournaments/                # Tournament brackets & scheduling
│   │   ├── teams/                      # Team creation & membership
│   │   ├── venues/                     # Venue directory
│   │   ├── chat/                       # Real-time messaging
│   │   ├── notifications/              # Push notifications
│   │   └── analytics/                  # Metrics & insights
│   ├── shared/                         # Cross-cutting concerns
│   │   ├── config/                     # Environment & configuration
│   │   ├── middleware/                 # Express middleware
│   │   ├── services/                   # Shared services (cache, metrics, email)
│   │   ├── events/                     # EventBus implementation
│   │   ├── utils/                      # Helper functions
│   │   ├── validators/                 # Request validators
│   │   ├── lib/                        # Reusable libraries (auth, pagination)
│   │   └── infrastructure/             # Logging, database
│   ├── docs/                           # Swagger/OpenAPI specs
│   └── tests/                          # E2E & integration test helpers
├── config/                             # Configuration files
├── docs/                               # Documentation
├── scripts/                            # Build & deployment scripts
└── infrastructure/                     # Docker, K8s configs
```

### Core Components Deep Dive

#### 1. Application Entry Point

**File**: `src/app.ts` (400+ lines)  
**Purpose**: Express application setup, middleware configuration, module registration  
**Key Responsibilities**:
- Initialize Express app with middleware stack
- Register all module routes
- Configure Socket.IO for real-time features
- Set up error handling and logging
- Health check endpoint

**Integration Points**:
```typescript
// Module registration pattern
const modules = [iamModule, usersModule, matchesModule, ...];
modules.forEach(module => {
  app.use(module.getBasePath(), module.getRouter());
  await module.initialize();
});
```

**Reuse Pattern**: When adding a new module, always register it in the `modules` array following existing patterns.

---

#### 2. Modules (Feature Domains)

Each module is a self-contained feature domain following Clean Architecture:

**🔐 IAM Module** (`src/modules/iam/`) - **MOST CRITICAL**  
**Lines**: 5000+  
**Endpoints**: 46  
**Purpose**: Authentication, authorization, security  
**Key Files**:
- `domain/services/AuthService.ts` - Login, registration, token management
- `domain/services/MfaService.ts` - Multi-factor authentication (TOTP)
- `domain/services/OAuthService.ts` - Social login (Google, Facebook, GitHub)
- `domain/services/EmailService.ts` - Email verification, password reset
- `domain/services/SessionService.ts` - Session management
- `api/controllers/AuthController.ts` - HTTP handlers for auth
- `api/routes/index.ts` - Route definitions

**Usage Example**:
```typescript
// Import from IAM for authentication
import {authenticate, authorize} from '@/shared/middleware/auth';

// Protect routes
router.get('/protected', authenticate, controller.method);
router.get('/admin', authenticate, authorize(['admin']), controller.method);
```

**Dependencies**: None (foundation module)  
**Dependents**: All other modules  
**Events Published**: `iam.user.registered`, `iam.user.logged_in`, `iam.mfa.enabled`

---

**👤 Users Module** (`src/modules/users/`)  
**Purpose**: User profiles, preferences, friend relationships  
**Key Files**:
- `domain/models/User.ts` - User schema (Mongoose model)
- `domain/services/UserService.ts` - Profile CRUD operations
- `domain/services/FriendService.ts` - Friend request management

**Schema Fields**: email, password, profile (firstName, lastName, bio), preferences, friends[], refreshTokens[]

**Dependencies**: IAM (auth)  
**Events Published**: `users.profile.updated`, `users.friend.added`  
**Events Consumed**: `iam.user.registered`

---

**⚽ Matches Module** (`src/modules/matches/`) - **REFERENCE IMPLEMENTATION**  
**Purpose**: Match creation, roster management, scheduling  
**Key Files**:
- `domain/models/Match.ts` - Match schema with participants, venue, schedule
- `domain/services/MatchService.ts` - Business logic (create, join, update)
- `data/repositories/MatchRepository.ts` - Database queries
- `events/subscribers/MatchEventSubscriber.ts` - Event handlers

**Best Practice Example**: This module demonstrates perfect Clean Architecture implementation. Use it as a template for new modules.

**Dependencies**: Users, Venues  
**Events Published**: `matches.match.created`, `matches.match.joined`, `matches.score.updated`  
**Events Consumed**: `users.friend.added`, `venues.venue.updated`

---

**🏆 Tournaments Module** (`src/modules/tournaments/`)  
**Purpose**: Tournament brackets, scheduling, management  
**Dependencies**: Matches, Users  
**Events**: `tournaments.created`, `tournaments.bracket.updated`

---

**👥 Teams Module** (`src/modules/teams/`)  
**Purpose**: Team creation, roster management  
**Dependencies**: Users  
**Events**: `teams.created`, `teams.member.added`

---

**📍 Venues Module** (`src/modules/venues/`)  
**Purpose**: Venue directory, availability, geospatial search  
**Key Feature**: MongoDB 2dsphere indexing for location-based queries  
**Dependencies**: None  
**Events**: `venues.created`, `venues.updated`

---

**💬 Chat Module** (`src/modules/chat/`)  
**Purpose**: Real-time messaging via Socket.IO  
**Key Files**:
- `socketHandlers/` - Socket.IO event handlers
- `domain/models/Message.ts` - Message persistence

**Dependencies**: Users, Matches, Teams  
**Integration**: Socket.IO rooms for match/team/tournament chats

---

**🔔 Notifications Module** (`src/modules/notifications/`)  
**Purpose**: Push notifications, email alerts  
**Dependencies**: All modules (cross-cutting)  
**Pattern**: Subscribes to events from all modules

---

**📊 Analytics Module** (`src/modules/analytics/`)  
**Purpose**: Metrics, insights, reporting  
**Dependencies**: All modules (cross-cutting)  
**Pattern**: Event-driven data aggregation

---

#### 3. Shared Infrastructure

**🔧 Configuration** (`src/shared/config/`)

**File**: `index.ts` (300+ lines)  
**Purpose**: Centralized configuration management  
**Exports**:
```typescript
export default {
  env: 'development' | 'production' | 'test',
  port: 3000,
  database: { uri, options },
  redis: { url, maxRetriesPerRequest },
  jwt: { secret, expiresIn, refreshSecret },
  oauth: { google, facebook, github },
  email: { smtp, from },
  // ... more
}
```

**Usage**: Always import config via `import config from '@/shared/config'`  
**Never**: Hardcode environment variables in business logic

---

**🚦 Middleware** (`src/shared/middleware/`)

Essential middleware for all routes:

| File | Purpose | When to Use |
|------|---------|-------------|
| `auth.ts` | JWT authentication | Protect routes requiring login |
| `apiKeyAuth.ts` | API key validation | Public API endpoints |
| `errorHandler.ts` | Error formatting | Auto-applied (asyncHandler) |
| `validation.ts` | Request validation | With express-validator |
| `security.ts` | Rate limiting, helmet | Auto-applied |
| `logging.ts` | Request/response logging | Auto-applied |
| `performance.ts` | Response time tracking | Auto-applied |

**Example**:
```typescript
import {authenticate, authorize} from '@/shared/middleware/auth';
import {asyncHandler} from '@/shared/middleware/errorHandler';

router.post('/create',
  authenticate,                           // JWT auth
  authorize(['user', 'admin']),          // Role check
  [body('name').notEmpty()],             // Validation
  validateRequest,                        // Validation execution
  asyncHandler(controller.create)        // Error handling
);
```

---

**📦 Services** (`src/shared/services/`)

Reusable services available to all modules:

**CacheManager** (`src/shared/infrastructure/cache/CacheManager.ts`)  
**Purpose**: Redis-based caching layer with automatic serialization  
**Methods**:
```typescript
await CacheManager.get<T>(key: string): Promise<T | null>
await CacheManager.set(key: string, value: any, expirationSeconds?: number): Promise<void>
await CacheManager.delete(key: string): Promise<boolean>
await CacheManager.increment(key: string, by?: number): Promise<number>
await CacheManager.cacheWithRefresh<T>(key, fetchFunction, ttl): Promise<T>
```
**Common Use Cases**: User sessions, API response caching, rate limiting  
**Usage**: Check cache before database queries to improve performance by 90%+

---

**MetricsService** (`MetricsService.ts`)  
**Purpose**: Application metrics collection (Prometheus-compatible)  
**Methods**:
```typescript
await metricsService.incrementCounter(metric, labels)
await metricsService.recordGauge(metric, value, labels)
await metricsService.recordLoginAttempt(success, method)
await metricsService.recordMfaVerification(success, usedBackupCode)
await metricsService.getMetricsSummary(): Promise<IMetricsSummary>
```
**Metrics Tracked**: Login attempts, MFA verifications, OAuth logins, API key usage  
**Export**: Prometheus format via `/api/v1/metrics/prometheus`

---

**AuditLogger** (`audit/AuditService.ts`)  
**Purpose**: Security audit logging  
**Methods**:
```typescript
await AuditLogger.logSecurity({req, action, status, details})
await AuditLogger.logAuth({userId, action, ip, details})
```
**Storage**: MongoDB AuditLog collection  
**Use For**: Security-sensitive operations (login, password change, MFA)

---

**EmailService** (`email/EmailService.ts`)  
**Purpose**: Transactional emails (SendGrid/SMTP)  
**Templates**: Welcome, verification, password reset, MFA alerts  
**Usage**: Import and call `emailService.sendVerification(user, token)`

---

**AnalyticsService** (`analytics/AnalyticsService.ts`)  
**Purpose**: Event tracking, user behavior analytics  
**Integration**: Google Analytics, Mixpanel

---

**MLService** (`ml/MLService.ts`)  
**Purpose**: Machine learning predictions (match recommendations, skill ratings)  
**Usage**: Called by matches module for intelligent matching

---

**🔄 EventBus** (`src/shared/events/EventBus.ts`)

**Purpose**: Pub/sub messaging for inter-module communication  
**Pattern**: Observer pattern with async event delivery

**Usage**:
```typescript
// Publisher (in any service)
import {eventBus} from '@/shared/events/EventBus';

eventBus.publish({
  eventType: 'matches.match.created',
  aggregateId: match.id,
  aggregateType: 'Match',
  timestamp: new Date(),
  payload: {matchId, sport, participants}
});

// Subscriber (in event subscriber file)
export class NotificationEventSubscriber {
  static initialize(): void {
    eventBus.subscribe('matches.match.created', this.handleMatchCreated);
    eventBus.subscribe('users.friend.added', this.handleFriendAdded);
  }

  private static handleMatchCreated = async (event: DomainEvent) => {
    // Send notifications to participants
    await notificationService.notifyParticipants(event.payload);
  };
}
```

**Critical Rule**: ❌ NEVER import services from other modules directly. ✅ ALWAYS use EventBus.

---

**🛠️ Utilities** (`src/shared/utils/`)

Helper functions for common tasks:

| File | Purpose | Key Functions |
|------|---------|---------------|
| `validateEnv.ts` | Environment validation | `validateEnv()` on startup |
| `jwt.ts` | JWT operations | `generateToken()`, `verifyToken()` |
| `pagination.ts` | Query pagination | `validatePagination()`, `buildPaginatedResponse()` |
| `logger.ts` | Winston logger | `logger.info()`, `logger.error()` |

**Example**:
```typescript
import logger from '@/shared/utils/logger';
import {validatePagination} from '@/shared/utils/pagination';

const {page, limit, skip} = validatePagination(req.query);
logger.info('Fetching paginated results', {page, limit});
```

---

**✅ Validators** (`src/shared/validators/`)

**File**: `index.ts` (200+ lines)  
**Purpose**: express-validator schemas for common request patterns

**Available Validators**:
```typescript
import {
  registerValidation,           // Email, password, username
  loginValidation,              // Email, password
  refreshTokenValidation,       // Refresh token
  changePasswordValidation,     // Old & new password
  deactivateAccountValidation,  // Password confirmation
  paginationValidation,         // Page, limit
  idValidation                  // MongoDB ObjectId
} from '@/shared/validators';
```

**Usage**:
```typescript
router.post('/register', registerValidation, validateRequest, controller.register);
```

**Extend**: Add new validators here for reuse across modules.

---

**📚 Libraries** (`src/shared/lib/`)

Reusable library code:

**Auth** (`lib/auth/`)
- `jwt.ts` - JWT generation, verification, refresh
- Usage: `import {generateAccessToken, generateRefreshToken} from '@/shared/lib/auth/jwt'`

**Pagination** (`lib/pagination/`)
- `paginator.ts` - Pagination utilities
- Usage: `import {Paginator} from '@/shared/lib/pagination'`

**Security** (`lib/security/`)
- Security utilities (password hashing, encryption)

---

#### 4. Database & Models

**Connection**: `src/shared/config/database.ts`  
**Pattern**: Singleton MongoDB connection via Mongoose  
**Models**: Each module defines its own models in `domain/models/`

**Key Models**:
- `User` - Users module (email, password, profile, refreshTokens, mfaSettings)
- `Match` - Matches module (sport, participants, venue, schedule, status)
- `Tournament` - Tournaments module (name, bracket, participants, matches)
- `Team` - Teams module (name, members, captain, sport)
- `Venue` - Venues module (name, location (GeoJSON), capacity)
- `Message` - Chat module (content, sender, room, timestamp)
- `AuditLog` - Shared (action, userId, ip, details, timestamp)

**Naming Convention**: PascalCase for models (User, Match, Tournament)  
**Import**: `import {User} from '@/modules/users/domain/models/User'`

---

#### 5. API Documentation

**Swagger/OpenAPI**: `src/docs/swagger.ts`  
**Endpoint**: `http://localhost:3000/api/v1/docs`  
**Tags**: Authentication, MFA, OAuth, Users, Matches, Tournaments, Teams, Venues, Chat, Notifications, Analytics, Security, Monitoring, Session Management

**Adding Documentation**:
```typescript
/**
 * @swagger
 * /api/v1/matches:
 *   post:
 *     summary: Create a new match
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMatchDTO'
 *     responses:
 *       201:
 *         description: Match created successfully
 */
```

---

#### 6. Testing Infrastructure

**Unit Tests**: Colocated in `__tests__/` within each module  
**Integration Tests**: `src/modules/*/api/__tests__/*.integration.test.ts`  
**E2E Tests**: `src/tests/e2e/`  
**Test Helpers**: `src/tests/helpers/` (testDb, factories)

**Available Tests** (41 integration tests):
- `auth.integration.test.ts` - 14 tests (registration, login, token refresh)
- `mfa.integration.test.ts` - 15 tests (MFA setup, enable, verify)
- `apiKeys.integration.test.ts` - 12 tests (API key CRUD)

**Running Tests**:
```bash
npm test                          # All tests
npm run test:watch               # Watch mode
npm run test:coverage            # Coverage report
npm test -- path/to/test.ts      # Specific test
```

---

### Naming Conventions

**Files**:
- Controllers: `PascalCase` + `Controller.ts` (e.g., `MatchController.ts`)
- Services: `PascalCase` + `Service.ts` (e.g., `MatchService.ts`)
- Models: `PascalCase` + `.ts` (e.g., `Match.ts`, `User.ts`)
- Routes: `camelCase` + `.ts` or `index.ts`
- Tests: `*.test.ts` or `*.integration.test.ts`

**Code**:
- Classes: `PascalCase` (MatchController, MatchService)
- Functions/methods: `camelCase` (createMatch, getUserById)
- Constants: `UPPER_SNAKE_CASE` (MAX_PARTICIPANTS, DEFAULT_LIMIT)
- Interfaces: `PascalCase` with `I` prefix optional (IMatchService, MatchDTO)
- Types: `PascalCase` (UserId, MatchStatus)
- Enums: `PascalCase` (MatchStatus.UPCOMING)

**Event Names**:
```
{module}.{entity}.{action}
Examples: matches.match.created, users.friend.added, iam.mfa.enabled
```

**API Endpoints**:
```
{verb} /api/v1/{resource}
Examples: GET /api/v1/matches, POST /api/v1/auth/login
```

---

### Architectural Patterns in Use

**1. Clean Architecture**
- API Layer (controllers) → Domain Layer (services) → Data Layer (repositories)
- Dependency inversion: Interfaces in domain, implementations in infrastructure

**2. Domain-Driven Design (DDD)**
- Bounded contexts = Modules
- Aggregates = Domain models
- Domain events = EventBus events

**3. Repository Pattern**
- Data access abstraction in `data/repositories/`
- Example: `MatchRepository.findUpcoming(filters)`

**4. Service Layer Pattern**
- Business logic in `domain/services/`
- Example: `MatchService.create(dto, userId)`

**5. Factory Pattern**
- Module factory in `src/shared/module/Module.ts`
- Each module extends `Module` base class

**6. Observer Pattern**
- EventBus for pub/sub
- Subscribers listen to domain events

**7. Singleton Pattern**
- Database connection, Redis client, CacheManager, MetricsService

**8. Strategy Pattern**
- OAuth providers (Google, Facebook, GitHub strategies)

---

### Integration Points

**Between Modules** (via EventBus):
```typescript
// Matches publishes
eventBus.publish('matches.match.created', {matchId, participants});

// Notifications subscribes
eventBus.subscribe('matches.match.created', notifyParticipants);
```

**With External Services**:
- **MongoDB**: Via Mongoose ODM
- **Redis**: Via ioredis (caching, sessions, metrics)
- **Socket.IO**: Real-time communication (chat, live updates)
- **OAuth Providers**: Via Passport.js strategies
- **Email**: Via SendGrid API
- **Monitoring**: Prometheus metrics export

**API Versioning**:
- Current: `/api/v1/*`
- All routes prefixed with version
- Breaking changes require new version (/api/v2/*)

---

### Configuration Management

**Environment Files**:
- `.env.development` - Local development
- `.env.production` - Production
- `.env.test` - Testing
- `.env.example` - Template with all keys

**Required Environment Variables**:
```env
# Core
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/sportification

# Redis (caching, metrics)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret

# OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Email (optional)
SENDGRID_API_KEY=...
```

---

### Quick Reference: Common Tasks

**Adding a New Endpoint**:
1. Define route in `api/routes/index.ts`
2. Add controller method in `api/controllers/`
3. Implement service logic in `domain/services/`
4. Add Swagger documentation
5. Write integration test

**Adding a New Module**:
1. Create directory structure: `src/modules/{module}/api|domain|data|events`
2. Create `module.ts` extending Module base class
3. Register in `src/app.ts` modules array
4. Define models in `domain/models/`
5. Implement services, controllers, routes
6. Add event publishers/subscribers

**Using Caching**:
```typescript
import CacheManager from '@/shared/infrastructure/cache/CacheManager';

// Get with cache
const cached = await CacheManager.get<T>(key);
if (cached) return cached;

const data = await fetchFromDatabase();
await CacheManager.set(key, data, 600); // 10min TTL
return data;
```
return data;
```

**Recording Metrics**:
```typescript
import {metricsService} from '@/shared/services/MetricsService';

await metricsService.recordLoginAttempt(success, 'password');
await metricsService.incrementCounter('custom.metric', {label: 'value'});
```

**Publishing Events**:
```typescript
import {eventBus} from '@/shared/events/EventBus';

eventBus.publish({
  eventType: 'module.entity.action',
  aggregateId: entityId,
  aggregateType: 'Entity',
  timestamp: new Date(),
  payload: {/* data */}
});
```

---

### Before Writing New Code - Checklist

✅ **Check if similar functionality exists**:
- Search in `src/shared/services/` for reusable services
- Check `src/shared/utils/` for helper functions
- Review `src/shared/validators/` for validation schemas
- Look at `src/shared/middleware/` for cross-cutting concerns

✅ **Follow existing patterns**:
- Use `src/modules/matches/` as reference implementation
- Extend `Module` base class for new modules
- Use `asyncHandler` for all controller methods
- Publish domain events for cross-module communication

✅ **Leverage shared infrastructure**:
- Use `CacheManager` instead of implementing your own caching
- Use `MetricsService` for application metrics
- Use `AuditLogger` for security-sensitive operations
- Use `EmailService` for transactional emails

✅ **Don't reinvent the wheel**:
- Pagination: Use `validatePagination()` from validators
- Auth: Use `authenticate` and `authorize` middleware
- Error handling: Use typed errors from `errorHandler.ts`
- Logging: Use Winston logger from `utils/logger.ts`

---

### The Big Picture

Sportification Backend is a **modular monolith** architected using **Clean Architecture** and **Domain-Driven Design (DDD)** principles. Think of it as a microservices architecture living in a single deployable unit—each module is a bounded context that could become an independent service tomorrow.

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│           (Express Middleware, Socket.IO, Auth)             │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    ┌───▼───┐      ┌───▼───┐      ┌───▼───┐
    │  IAM  │      │ Users │      │Matches│
    │Module │      │Module │      │Module │
    └───┬───┘      └───┬───┘      └───┬───┘
        │               │               │
        └───────────────▼───────────────┘
                        │
        ┌───────────────────────────────┐
        │     EventBus (Pub/Sub)        │
        │  Decoupled Communication      │
        └───────────────────────────────┘
                        │
        ┌───────────────▼───────────────┐
        │  Shared Infrastructure        │
        │  (Config, Utils, Middleware)  │
        └───────────────────────────────┘
```

### Core Architectural Principles

| Principle                      | Implementation                                                        | Why It Matters                                          |
| ------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------- |
| **Module Independence**        | Each module in `src/modules/` is self-contained with clear boundaries | Enables independent deployment in future microservices  |
| **Event-Driven Communication** | Inter-module communication via EventBus only—zero direct imports      | Loose coupling, async scalability, audit trail          |
| **Clean Architecture Layers**  | API → Domain → Data → Events separation                               | Testability, maintainability, dependency inversion      |
| **Shared Infrastructure**      | Common code in `src/shared/`                                          | DRY principle, consistent patterns, reduced duplication |
| **Database Per Module**        | Each module owns its data models                                      | Data isolation, independent scaling, clear ownership    |

### Why This Architecture?

**Today**: Single deployment, simplified development, shared database
**Tomorrow**: Extract modules to microservices using Strangler Fig pattern (6-month roadmap in `docs/future/microservices/`)

This architecture gives us:

- 🚀 **Fast iteration** with monolith simplicity
- 🔒 **Strong boundaries** that prevent module coupling
- 📈 **Scalability path** to microservices without rewriting
- 🧪 **Testability** through dependency injection and mocking
- 👥 **Team autonomy** with module ownership

---

## 🚀 Quick Start for AI Agents

### 60-Second Context

```typescript
// Modules communicate via events, NOT direct imports
❌ import { UserService } from '../../users/domain/services';
✅ this.publishEvent('user.profileUpdated', { userId, changes });

// Controllers use asyncHandler + typed errors
export class MatchController {
  createMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const match = await this.matchService.create(req.body);
    sendCreated(res, { match }, 'Match created successfully');
  });
}

// Modules extend base class and register in src/app.ts
export class MatchesModule extends Module {
  constructor() {
    super({ name: "matches", version: "1.0.0", basePath: "/api/v1/matches" });
  }
}
```

### Module Dependency Graph

```
IAM (Auth) ──────────► No Dependencies (Foundation)
    │
    ▼
Users (Profiles) ─────► Subscribes: iam.user.registered
    │
    ├──► Matches ──────► Subscribes: users.*, venues.*
    │
    ├──► Tournaments ──► Subscribes: matches.*, users.*
    │
    ├──► Teams ────────► Subscribes: users.*
    │
    └──► Chat ─────────► Subscribes: matches.*, tournaments.*, teams.*

Notifications ────────► Subscribes: ALL events (cross-cutting)
Analytics ────────────► Subscribes: ALL events (cross-cutting)
AI/ML ────────────────► Subscribes: matches.*, users.*
Venues ───────────────► No dependencies
```

---

## 🏗️ Module Structure Deep Dive

### Canonical Module Structure

Every module follows this **exact** structure (deviations require architectural review):

```
src/modules/{module-name}/
├── api/                         # 🌐 API Layer (Presentation)
│   ├── controllers/             # HTTP handlers (class-based)
│   │   └── {Module}Controller.ts    # Arrow functions for `this` binding
│   ├── routes/                  # Express route definitions
│   │   └── index.ts                 # Route registration with validation
│   └── validators/              # Request validation schemas
│       └── {module}.validators.ts   # express-validator rules
│
├── domain/                      # 💼 Domain Layer (Business Logic)
│   ├── models/                  # Mongoose schemas
│   │   └── {Entity}.ts              # Domain entities with business rules
│   ├── services/                # Business logic orchestration
│   │   └── {Module}Service.ts       # Use case implementations
│   └── interfaces/              # TypeScript contracts
│       └── I{Module}Service.ts      # Service interfaces for DI
│
├── data/                        # 💾 Data Layer (Persistence)
│   └── repositories/            # Database access patterns
│       └── {Module}Repository.ts    # Query abstractions
│
├── events/                      # 📢 Event Layer (Integration)
│   ├── publishers/              # Outbound events
│   │   └── {Module}EventPublisher.ts
│   └── subscribers/             # Inbound event handlers
│       └── {Module}EventSubscriber.ts
│
├── types/                       # 📝 Module-Specific Types
│   └── index.ts                     # DTOs, enums, interfaces
│
├── module.ts                    # 🎯 Module Definition
│   └── extends Module base class
│
└── index.ts                     # 📦 Public API (Barrel Export)
    └── Exports: module, services, events, types
```

### Layer Responsibilities & Rules

| Layer      | Responsibility                           | Can Import From       | Cannot Import From    | Example                                |
| ---------- | ---------------------------------------- | --------------------- | --------------------- | -------------------------------------- |
| **API**    | HTTP handling, validation, serialization | Domain, Shared        | Other modules, Data   | `MatchController.createMatch()`        |
| **Domain** | Business rules, orchestration            | Data, Shared          | API, Other modules    | `MatchService.validateSchedule()`      |
| **Data**   | Database queries, persistence            | Domain models, Shared | API, Domain services  | `MatchRepository.findUpcoming()`       |
| **Events** | Pub/sub integration                      | Domain, Shared        | Direct module imports | `MatchEventPublisher.publishCreated()` |

### Module Lifecycle

```typescript
// 1. Module Definition (module.ts)
export class MatchesModule extends Module {
  constructor() {
    super({
      name: "matches",
      version: "1.0.0",
      basePath: "/api/v1/matches",
      dependencies: ["users", "venues"] // Declarative dependencies
    });
  }

  // 2. Initialization (called by app.ts)
  async initialize(): Promise<void> {
    this.registerEventHandlers();
    // Optional: seed data, cache warming, etc.
  }

  // 3. Router Registration
  getRouter(): Router {
    return matchRoutes; // From api/routes/index.ts
  }

  // 4. Event Handler Registration
  registerEventHandlers(): void {
    MatchEventSubscriber.initialize();
  }
}

// 5. Registration in src/app.ts
const modules = [iamModule, usersModule, matchesModule, ...];
modules.forEach(module => {
  app.use(module.getBasePath(), module.getRouter());
  await module.initialize();
});
```

---

## 🎨 Critical Design Patterns

### Pattern 1: Event-Driven Communication (★★★★★ Critical)

**Golden Rule**: Modules communicate ONLY via EventBus. Direct imports between modules are **architectural violations**.

#### Event Publishing Pattern

```typescript
// ✅ CORRECT: Publishing domain events
export class MatchService {
  async createMatch(data: CreateMatchDTO): Promise<Match> {
    const match = await Match.create(data);

    // Publish event for other modules
    this.publishEvent('match.created', {
      matchId: match.id,
      sport: match.sport,
      participants: match.participants,
      venue: match.venue,
      schedule: match.schedule,
    });

    return match;
  }

  private publishEvent(eventType: string, payload: any): void {
    eventBus.publish({
      eventType: `matches.${eventType}`,
      aggregateId: payload.matchId,
      aggregateType: 'Match',
      timestamp: new Date(),
      payload,
      metadata: {
        correlationId: payload.correlationId,
      },
    });
  }
}
```

#### Event Subscription Pattern

```typescript
// ✅ CORRECT: Subscribing to events from other modules
export class MatchEventSubscriber {
  static initialize(): void {
    // Subscribe to user events
    eventBus.subscribe('users.friend.added', this.handleFriendAdded);

    // Subscribe to venue events
    eventBus.subscribe('venues.venue.updated', this.handleVenueUpdated);
  }

  private static handleFriendAdded = async (event: DomainEvent) => {
    const { userId, friendId } = event.payload;
    // Recommend matches to new friends
    await matchService.recommendToFriends(userId, friendId);
  };

  private static handleVenueUpdated = async (event: DomainEvent) => {
    const { venueId, changes } = event.payload;
    // Update affected matches
    await matchService.handleVenueChange(venueId, changes);
  };
}
```

#### Anti-Pattern: Direct Module Imports

```typescript
// ❌ WRONG: Direct import creates tight coupling
import { UserService } from '../../users/domain/services/UserService';
import { VenueService } from '../../venues/domain/services/VenueService';

// This creates a compile-time dependency and prevents independent deployment
const user = await UserService.findById(userId); // DON'T DO THIS!
```

### Pattern 2: Controller-Service-Repository (CSR)

#### Controller Layer (API)

```typescript
export class MatchController {
  private matchService: MatchService;

  constructor() {
    this.matchService = new MatchService();
  }

  // ✅ Arrow functions preserve `this` binding
  createMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
    // 1. Extract & validate
    const dto: CreateMatchDTO = req.body;

    // 2. Delegate to service
    const match = await this.matchService.create(dto, req.userId);

    // 3. Format response
    sendCreated(res, { match }, 'Match created successfully');
  });

  getMatches = asyncHandler(async (req: Request, res: Response) => {
    // 1. Parse query params
    const { page, limit, skip } = validatePagination(req.query);
    const filters = this.buildFilters(req.query);

    // 2. Delegate to service
    const result = await this.matchService.findAll(filters, { page, limit, skip });

    // 3. Format response with pagination
    sendSuccess(res, {
      matches: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  });

  private buildFilters(query: any): MatchFilters {
    const filters: MatchFilters = {};
    if (query.sport) filters.sport = query.sport;
    if (query.status) filters.status = query.status;
    if (query.fromDate) filters.dateFrom = new Date(query.fromDate);
    return filters;
  }
}
```

#### Service Layer (Domain)

```typescript
export class MatchService {
  private matchRepository: MatchRepository;

  constructor() {
    this.matchRepository = new MatchRepository();
  }

  async create(dto: CreateMatchDTO, createdBy: string): Promise<Match> {
    // 1. Business rule validation
    this.validateSchedule(dto.schedule);
    this.validateParticipants(dto.maxParticipants);

    // 2. Create domain entity
    const match = await this.matchRepository.create({
      ...dto,
      createdBy,
      participants: [createdBy],
      status: MatchStatus.UPCOMING,
    });

    // 3. Publish domain event
    this.publishMatchCreated(match);

    // 4. Trigger side effects (async)
    this.scheduleReminders(match).catch((err) =>
      logger.error('Failed to schedule reminders:', err)
    );

    return match;
  }

  private validateSchedule(schedule: MatchSchedule): void {
    const scheduledDate = new Date(schedule.date);
    if (scheduledDate <= new Date()) {
      throw new ValidationError('Match date must be in the future');
    }
    if (scheduledDate > addMonths(new Date(), 6)) {
      throw new ValidationError('Cannot schedule matches more than 6 months ahead');
    }
  }

  private publishMatchCreated(match: Match): void {
    eventBus.publish({
      eventType: 'matches.match.created',
      aggregateId: match.id,
      aggregateType: 'Match',
      timestamp: new Date(),
      payload: {
        matchId: match.id,
        sport: match.sport,
        participants: match.participants,
        venue: match.venue,
      },
    });
  }
}
```

#### Repository Layer (Data)

```typescript
export class MatchRepository {
  async create(data: CreateMatchData): Promise<Match> {
    const match = new Match(data);
    await match.save();
    await match.populate(['createdBy', 'participants', 'venue']);
    return match;
  }

  async findUpcoming(filters: MatchFilters): Promise<Match[]> {
    const query = Match.find({
      status: MatchStatus.UPCOMING,
      'schedule.date': { $gte: new Date() },
    });

    if (filters.sport) query.where('sport').equals(filters.sport);
    if (filters.venueId) query.where('venue').equals(filters.venueId);

    return query
      .populate('createdBy', 'profile')
      .populate('participants', 'profile')
      .populate('venue', 'name location')
      .sort({ 'schedule.date': 1 })
      .exec();
  }
}
```

### Pattern 3: Authentication & Authorization

```typescript
// Route-level authentication
router.post(
  '/',
  authenticate, // Verifies JWT, attaches user to req
  [body('sport').notEmpty().trim(), body('schedule.date').isISO8601()],
  matchController.createMatch
);

// Role-based authorization
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'moderator']), // Only specific roles
  matchController.deleteMatch
);

// Resource ownership verification
router.patch(
  '/:id',
  authenticate,
  requireOwnership('createdBy'), // Verified in controller
  matchController.updateMatch
);

// Controller with auth
export class MatchController {
  updateMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError('Match');
    }

    // Verify ownership (req.userId set by authenticate middleware)
    if (match.createdBy.toString() !== req.userId) {
      throw new ForbiddenError('Only match creator can update');
    }

    // Update logic...
  });
}
```

### Pattern 4: Request Validation

```typescript
// In routes/index.ts
import { body, param, query } from 'express-validator';

router.post(
  '/',
  authenticate,
  [
    // Field validation
    body('sport').notEmpty().trim().withMessage('Sport is required'),

    body('schedule.date').isISO8601().withMessage('Invalid date format'),

    body('schedule.time')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Time must be in HH:mm format'),

    // Custom validation
    body('maxParticipants')
      .optional()
      .isInt({ min: 2, max: 100 })
      .withMessage('Max participants must be between 2 and 100'),

    // Conditional validation
    body('venue')
      .if(body('type').equals('public'))
      .notEmpty()
      .withMessage('Venue required for public matches'),
  ],
  matchController.createMatch
);

// Query param validation
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['upcoming', 'ongoing', 'completed']),
  ],
  matchController.getMatches
);
```

### Pattern 5: Error Handling Hierarchy

```typescript
// Throw typed errors in services
export class MatchService {
  async joinMatch(matchId: string, userId: string): Promise<Match> {
    const match = await this.matchRepository.findById(matchId);

    if (!match) {
      throw new NotFoundError('Match');
    }

    if (match.status !== MatchStatus.UPCOMING) {
      throw new ConflictError('Cannot join match that is not upcoming');
    }

    if (match.participants.includes(userId)) {
      throw new ConflictError('Already participating in this match');
    }

    if (match.participants.length >= match.maxParticipants) {
      throw new ConflictError('Match is full');
    }

    // Business logic...
  }
}

// Available error types (src/shared/middleware/errorHandler.ts)
throw new NotFoundError('Resource'); // 404
throw new ValidationError('Invalid input'); // 400
throw new ConflictError('State conflict'); // 409
throw new UnauthorizedError('Auth failed'); // 401
throw new ForbiddenError('Access denied'); // 403
throw new BadRequestError('Bad request'); // 400

// asyncHandler catches and formats errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### Pattern 6: Response Formatting

```typescript
// Success responses
sendSuccess(res, { matches, pagination });
// → { success: true, data: { matches, pagination } }

sendCreated(res, { match }, 'Match created successfully');
// → { success: true, data: { match }, message: '...' } (201)

// Error responses (handled by errorHandler middleware)
// → { success: false, message: '...', errors: [...], code: '...' }
```

---

## 🔧 Development Workflows

### Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.development .env
# Edit .env with your MongoDB URI and secrets

# 3. Start MongoDB (if local)
docker-compose up mongodb -d

# 4. Start development server
npm run dev
# → Runs on http://localhost:3000
# → Hot reload enabled via nodemon
# → API docs at http://localhost:3000/api/v1/docs
```

### Docker Development

```bash
# Start full stack (MongoDB + Redis + API)
docker-compose up

# Start specific services
docker-compose up mongodb redis

# View logs
docker-compose logs -f api

# Rebuild after dependency changes
docker-compose up --build
```

### Testing Strategy

```bash
# Run all tests
npm test

# Watch mode for TDD
npm run test:watch

# Coverage report
npm run test:coverage
# → Generates coverage/ directory with HTML report

# Run specific test file
npm test -- src/modules/matches/__tests__/MatchService.test.ts

# Debug tests
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### Test Organization

```
src/
├── modules/
│   └── matches/
│       └── __tests__/
│           ├── unit/
│           │   ├── MatchService.test.ts
│           │   └── MatchRepository.test.ts
│           └── integration/
│               └── MatchController.test.ts
└── tests/
    ├── e2e/
    │   └── match-flow.test.ts
    ├── helpers/
    │   ├── testDb.ts
    │   └── factories.ts
    └── setup.ts
```

### Database Management

#### Configuration

- **Connection**: `src/shared/config/database.ts` (singleton pattern)
- **Models**:
  - Shared: `src/models/` (legacy, being migrated)
  - Module-specific: `src/modules/{module}/domain/models/`
- **Environment**: Loads from `.env.{NODE_ENV}` or fallback `.env`

#### Common Database Operations

```bash
# Run migrations (if any)
npm run migrate

# Seed database with test data
npm run seed

# Connect to MongoDB shell
docker-compose exec mongodb mongosh -u admin -p password123

# Backup database
docker-compose exec mongodb mongodump -u admin -p password123 -o /backup

# View database logs
docker-compose logs mongodb
```

### Adding a New Module (Step-by-Step)

#### Step 1: Create Module Structure

```bash
MODULE_NAME="payments"  # Change this

mkdir -p src/modules/$MODULE_NAME/{api/{controllers,routes,validators},domain/{models,services,interfaces},data/repositories,events/{publishers,subscribers},types}

touch src/modules/$MODULE_NAME/module.ts
touch src/modules/$MODULE_NAME/index.ts
```

#### Step 2: Create Module Class

```typescript
// src/modules/payments/module.ts
import { Module } from '../../shared/module/Module';
import { Router } from 'express';
import paymentRoutes from './api/routes';
import { PaymentEventSubscriber } from './events/subscribers/PaymentEventSubscriber';

export class PaymentsModule extends Module {
  constructor() {
    super({
      name: 'payments',
      version: '1.0.0',
      basePath: '/api/v1/payments',
      dependencies: ['users', 'matches'], // Declare dependencies
    });
  }

  async initialize(): Promise<void> {
    this.registerEventHandlers();
    // Optional: initialize payment gateway, cache, etc.
  }

  getRouter(): Router {
    return paymentRoutes;
  }

  registerEventHandlers(): void {
    PaymentEventSubscriber.initialize();
  }
}

export const paymentsModule = new PaymentsModule();
```

#### Step 3: Create Barrel Export

```typescript
// src/modules/payments/index.ts
export { paymentsModule } from './module';
export { PaymentService } from './domain/services/PaymentService';
export { PaymentEventPublisher } from './events/publishers/PaymentEventPublisher';
export { PaymentEventSubscriber } from './events/subscribers/PaymentEventSubscriber';
export type * from './types';
```

#### Step 4: Register in App

```typescript
// src/app.ts
import { paymentsModule } from './modules/payments';

// Add to modules array
const modules = [
  iamModule,
  usersModule,
  matchesModule,
  // ... other modules
  paymentsModule, // Add here
];
```

#### Step 5: Implement Core Files

See `src/modules/matches/` for reference implementation of:

- `api/controllers/PaymentController.ts`
- `domain/services/PaymentService.ts`
- `domain/models/Payment.ts`
- `api/routes/index.ts`
- `events/subscribers/PaymentEventSubscriber.ts`

### Code Quality & Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changing
npm run format:check
```

### Building & Deployment

```bash
# Compile TypeScript
npm run build
# → Outputs to dist/

# Start production server
NODE_ENV=production npm start

# Docker production build
docker build -t sportification-api:latest .
docker run -p 3000:3000 --env-file .env.production sportification-api:latest
```

### Debugging

#### VS Code Launch Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/src/index.ts"],
      "env": { "NODE_ENV": "development" },
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal"
    }
  ]
}
```

#### Logging Debug Info

```typescript
import logger from '@/shared/utils/logger';

// Development logging
logger.debug('Match validation', { matchId, rules });
logger.info('User joined match', { userId, matchId });
logger.warn('Rate limit approaching', { userId, requests });
logger.error('Payment failed', { error, userId, matchId });

// Production: Only info, warn, error are logged
// Development: All levels including debug
```

---

## 📡 API Design Standards

### RESTful Conventions

```
Base URL: /api/v1

Resource Endpoints:
GET    /resources              # List (with pagination)
POST   /resources              # Create
GET    /resources/:id          # Get by ID
PATCH  /resources/:id          # Partial update
PUT    /resources/:id          # Full replacement
DELETE /resources/:id          # Delete

Nested Resources:
GET    /resources/:id/children
POST   /resources/:id/children

Actions (non-CRUD):
POST   /matches/:id/join       # Join match
POST   /matches/:id/leave      # Leave match
PATCH  /matches/:id/score      # Update score
```

### Request/Response Format

#### Successful Response

```json
{
  "success": true,
  "data": {
    "match": { "id": "123", "sport": "football" }
  },
  "message": "Match created successfully",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Sport is required", "Date must be in the future"],
  "code": "VALIDATION_ERROR"
}
```

### Pagination

```typescript
// Query params
?page=1&limit=10

// Response includes
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}

// Default values
page: 1
limit: 10
max limit: 100
```

### Filtering & Sorting

```typescript
// Filtering
?status=upcoming&sport=football&fromDate=2025-10-15

// Sorting
?sort=createdAt          // Ascending
?sort=-createdAt         // Descending
?sort=sport,-createdAt   // Multiple fields

// Search
?search=championship     // Full-text search
```

### API Versioning

- Current: `/api/v1`
- Future: `/api/v2` (backwards compatible for 6 months)
- Deprecated endpoints return `Deprecated` header
- Breaking changes require new version

### Rate Limiting

```typescript
// Default limits
General: 100 requests / 15 minutes
Auth: 20 requests / 15 minutes
File Upload: 10 requests / 15 minutes

// Rate limit headers
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698765432
```

### Socket.IO Real-Time Events

#### Connection & Authentication

```typescript
// Client connects
socket.emit('authenticate', { token: 'jwt-token' });

// Server responds
socket.on('authenticated', (data) => {
  console.log('Authenticated as:', data.user);
});

// Auto-join user room
// → User can receive personal notifications at room: user:{userId}
```

#### Room-Based Messaging

```typescript
// Join room
socket.emit('join-room', 'match:123');
socket.on('joined-room', ({ roomId }) => {
  console.log('Joined:', roomId);
});

// Send message to room
socket.emit('send-message', {
  roomId: 'match:123',
  content: 'Hello team!',
  messageType: 'text',
});

// Receive messages
socket.on('new-message', (message) => {
  console.log('New message:', message);
});
```

#### Match Updates

```typescript
// Send match update
socket.emit('match-update', {
  matchId: '123',
  type: 'score',
  update: { homeScore: 2, awayScore: 1 },
});

// Receive match updates
socket.on('match-updated', (update) => {
  console.log('Match updated:', update);
});
```

#### Available Rooms

- `user:{userId}` - Personal notifications
- `match:{matchId}` - Match-specific updates
- `tournament:{tournamentId}` - Tournament updates
- `team:{teamId}` - Team chat and updates
- `match-updates` - Global match updates

---

## 🧪 Testing Strategy

### Testing Pyramid

```
              /\
             /E2E\      ← Few, critical user journeys
            /------\
           /  INT   \   ← Moderate, API endpoints
          /----------\
         /    UNIT    \ ← Many, business logic
        /--------------\
```

### Unit Tests (Domain Layer)

```typescript
// src/modules/matches/domain/services/__tests__/MatchService.test.ts
describe('MatchService', () => {
  let matchService: MatchService;
  let mockRepository: jest.Mocked<MatchRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findUpcoming: jest.fn(),
    } as any;

    matchService = new MatchService(mockRepository);
  });

  describe('create', () => {
    it('should create match with valid data', async () => {
      const dto = {
        sport: 'football',
        schedule: { date: futureDate(), time: '18:00' },
        maxParticipants: 10,
      };

      mockRepository.create.mockResolvedValue(mockMatch);

      const result = await matchService.create(dto, 'user-123');

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sport: 'football',
          createdBy: 'user-123',
          status: MatchStatus.UPCOMING,
        })
      );
    });

    it('should throw error for past date', async () => {
      const dto = {
        sport: 'football',
        schedule: { date: pastDate(), time: '18:00' },
      };

      await expect(matchService.create(dto, 'user-123')).rejects.toThrow(ValidationError);
    });
  });
});
```

### Integration Tests (API Layer)

```typescript
// src/modules/matches/api/controllers/__tests__/MatchController.test.ts
import request from 'supertest';
import app from '@/app';
import { setupTestDb, teardownTestDb } from '@/tests/helpers/testDb';

describe('Match API', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('POST /api/v1/matches', () => {
    it('should create match with authentication', async () => {
      const token = await getAuthToken(); // Helper function

      const response = await request(app)
        .post('/api/v1/matches')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sport: 'football',
          schedule: { date: '2025-12-15', time: '18:00' },
          venue: venueId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.match).toHaveProperty('id');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/api/v1/matches').send({});

      expect(response.status).toBe(401);
    });
  });
});
```

### E2E Tests (User Journeys)

```typescript
// src/tests/e2e/match-creation-flow.test.ts
describe('Match Creation Flow', () => {
  it('should complete full match creation journey', async () => {
    // 1. User registers
    const user = await registerUser({
      email: 'test@example.com',
      password: 'Password123',
    });

    // 2. User logs in
    const { token } = await loginUser(user.email, 'Password123');

    // 3. User creates venue
    const venue = await createVenue(token, {
      name: 'Test Stadium',
      location: { type: 'Point', coordinates: [0, 0] },
    });

    // 4. User creates match
    const match = await createMatch(token, {
      sport: 'football',
      venue: venue.id,
      schedule: { date: futureDate(), time: '18:00' },
    });

    // 5. Another user joins
    const user2Token = await getSecondUserToken();
    await joinMatch(user2Token, match.id);

    // 6. Verify match state
    const updatedMatch = await getMatch(token, match.id);
    expect(updatedMatch.participants).toHaveLength(2);
  });
});
```

### Test Utilities

```typescript
// src/tests/helpers/factories.ts
export const matchFactory = (overrides = {}) => ({
  sport: 'football',
  status: MatchStatus.UPCOMING,
  schedule: { date: futureDate(), time: '18:00' },
  participants: [],
  maxParticipants: 10,
  ...overrides,
});

// src/tests/helpers/testDb.ts
export const setupTestDb = async () => {
  await connect(process.env.MONGODB_TEST_URI);
  await clearDatabase();
};

export const teardownTestDb = async () => {
  await clearDatabase();
  await disconnect();
};

export const clearDatabase = async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
};
```

---

## 🔒 Security & Performance

### Security Best Practices

#### 1. Input Validation & Sanitization

```typescript
// Always validate and sanitize input
router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).trim(),
    body('username').trim().escape(),
  ],
  controller.register
);

// MongoDB injection protection (auto-applied)
// express-mongo-sanitize removes $ and . from user input
```

#### 2. Authentication & Tokens

```typescript
// JWT configuration
{
  accessToken: {
    expiresIn: '7d',        // Short-lived
    algorithm: 'HS256'
  },
  refreshToken: {
    expiresIn: '30d',       // Long-lived
    stored: 'database'      // Can be revoked
  }
}

// Token refresh flow
POST /api/v1/auth/refresh
Authorization: Bearer {refreshToken}
→ Returns new access token
```

#### 3. Rate Limiting

```typescript
// Applied at multiple levels
Global: 100 req/15min
Auth endpoints: 20 req/15min
File uploads: 10 req/15min

// Custom rate limits
const customLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 5,                    // 5 requests
  message: 'Too many requests'
});

router.post('/expensive-operation', customLimiter, handler);
```

#### 4. CORS Configuration

```typescript
// Environment-specific origins
Development: ['http://localhost:3000', 'http://localhost:5173'];
Production: ['https://sportification.com', 'https://app.sportification.com'];

// Credentials support for cookies
credentials: true;
```

#### 5. Security Headers (Helmet)

```typescript
// Auto-applied via helmet middleware
Content-Security-Policy
X-DNS-Prefetch-Control
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security
```

### Performance Optimization

#### 1. Database Indexing

```typescript
// Essential indexes
matchSchema.index({ status: 1, 'schedule.date': 1 });
matchSchema.index({ createdBy: 1 });
matchSchema.index({ participants: 1 });
matchSchema.index({ sport: 1, status: 1 });

// Geospatial index for venues
venueSchema.index({ location: '2dsphere' });

// Text search index
userSchema.index({ 'profile.firstName': 'text', 'profile.lastName': 'text' });
```

#### 2. Query Optimization

```typescript
// Use .lean() for read-only queries
const matches = await Match.find({ status: 'upcoming' })
  .lean() // Returns plain JS objects, faster
  .exec();

// Select only needed fields
const users = await User.find().select('email profile.firstName').lean();

// Populate only what's needed
const match = await Match.findById(id)
  .populate('createdBy', 'profile') // Only profile field
  .populate({
    path: 'participants',
    select: 'profile',
    options: { limit: 50 }, // Limit populated docs
  });
```

#### 3. Caching Strategy

```typescript
// Redis caching for expensive queries
import { CacheManager } from '@/shared/cache';

async function getUpcomingMatches() {
  const cacheKey = 'matches:upcoming';

  // Try cache first
  const cached = await CacheManager.get(cacheKey);
  if (cached) return cached;

  // Query database
  const matches = await Match.find({ status: 'upcoming' })
    .sort({ 'schedule.date': 1 })
    .limit(50)
    .lean();

  // Cache for 5 minutes
  await CacheManager.set(cacheKey, matches, 300);

  return matches;
}

// Invalidate cache on updates
await CacheManager.del('matches:upcoming');
```

#### 4. Pagination Best Practices

```typescript
// Use skip/limit for small datasets
const matches = await Match.find()
  .skip((page - 1) * limit)
  .limit(limit);

// Use cursor-based for large datasets
const matches = await Match.find({
  _id: { $gt: lastSeenId }, // Cursor
})
  .sort({ _id: 1 })
  .limit(limit);
```

#### 5. Async Operations

```typescript
// Use Promise.all for parallel operations
const [user, matches, tournaments] = await Promise.all([
  User.findById(userId),
  Match.find({ participants: userId }),
  Tournament.find({ participants: userId }),
]);

// Use Promise.allSettled for optional operations
const results = await Promise.allSettled([
  sendEmail(user.email),
  sendPushNotification(user.id),
  updateAnalytics(user.id),
]);

// Continue even if some fail
const successful = results.filter((r) => r.status === 'fulfilled');
```

---

## 🚀 Migration Roadmap

### Current State: Modular Monolith

We're here: A well-structured monolith preparing for microservices.

### 6-Month Migration Plan

**Phase 1 (Weeks 1-8): Infrastructure Setup**

- Set up Kubernetes cluster
- Implement API Gateway (Kong/NGINX)
- Set up message bus (RabbitMQ/Kafka)
- Establish observability (Prometheus, Grafana, Jaeger)

**Phase 2 (Weeks 9-16): Extract Core Services**

1. IAM Service (auth foundation)
2. Notification Service (async, cross-cutting)
3. User Service (core domain)

**Phase 3 (Weeks 17-24): Extract Domain Services** 4. Match Service 5. Tournament Service 6. Chat Service

**Phase 4 (Weeks 25+): Decommission Monolith**

- Route all traffic through microservices
- Parallel running for 4 weeks
- Gradual monolith shutdown

### Preparing for Microservices

**Current Best Practices:**

```typescript
// ✅ Already microservice-ready
- Event-driven communication
- No direct module dependencies
- Clear bounded contexts
- Separate databases per module

// ⚠️ To address before migration
- Move shared models to service-owned schemas
- Implement distributed tracing
- Add circuit breakers
- Set up service mesh
```

### When Building New Features

**Think Microservices First:**

1. Could this be a separate service?
2. What events does it publish/consume?
3. What's the data ownership?
4. How does it handle service failures?

---

## 🔍 Troubleshooting Guide

### Common Issues & Solutions

#### Issue: Module Not Found Errors

```bash
# Symptom
Cannot find module '@/shared/utils/logger'

# Solutions
1. Rebuild TypeScript: npm run build
2. Check path aliases in tsconfig.json
3. Restart TS server in VS Code: Cmd/Ctrl + Shift + P → "Restart TS Server"
```

#### Issue: MongoDB Connection Failed

```bash
# Symptom
MongoNetworkError: connect ECONNREFUSED

# Solutions
1. Check MongoDB is running: docker-compose ps
2. Verify MONGODB_URI in .env
3. Start MongoDB: docker-compose up mongodb -d
4. Check MongoDB logs: docker-compose logs mongodb
```

#### Issue: Redis Connection Warnings

```bash
# Note: Redis is optional
The app will work without Redis (no caching/sessions)

# To enable Redis
docker-compose up redis -d

# Verify connection
docker-compose exec redis redis-cli ping
# → Should return: PONG
```

#### Issue: Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### Issue: JWT Token Expired

```typescript
// Use refresh token flow
POST /api/v1/auth/refresh
Authorization: Bearer {refreshToken}

// Response includes new access token
{
  "success": true,
  "data": {
    "accessToken": "new-token",
    "expiresIn": "7d"
  }
}
```

#### Issue: EventBus Subscription Not Working

```typescript
// Check event handler registration
export class MatchesModule extends Module {
  registerEventHandlers(): void {
    MatchEventSubscriber.initialize(); // Must be called
  }
}

// Verify subscriber initialization
export class MatchEventSubscriber {
  static initialize(): void {
    eventBus.subscribe('users.friend.added', this.handleFriendAdded);
    // ⚠️ Use arrow functions or .bind(this)
  }

  private static handleFriendAdded = async (event: DomainEvent) => {
    // Handler implementation
  };
}
```

#### Issue: TypeScript Compilation Errors

```bash
# Clear build cache
rm -rf dist/

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for type errors
npx tsc --noEmit
```

### Performance Debugging

```typescript
// Add performance logging
import logger from '@/shared/utils/logger';

const start = Date.now();
const result = await expensiveOperation();
logger.info('Operation completed', {
  duration: Date.now() - start,
  operation: 'expensiveOperation',
});

// Monitor with APM
// → Check Prometheus metrics
// → View traces in Jaeger
```

### Getting Help

1. **Check Documentation**: `docs/` directory
2. **Search Issues**: GitHub Issues
3. **Ask Team**: Slack #backend-help
4. **Escalate**: Tag @backend-lead

---

## 💡 Code Style & Best Practices

### TypeScript Guidelines

```typescript
// ✅ Use strict mode (enabled in tsconfig.json)
"strict": true,
"noImplicitAny": true,
"strictNullChecks": true

// ✅ Prefer interfaces for object shapes
interface CreateMatchDTO {
  sport: string;
  schedule: MatchSchedule;
  venue: string;
}

// ✅ Type aliases for unions/primitives
type MatchStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
type UserId = string;

// ✅ Generics for reusable code
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// ✅ Use utility types
type PartialMatch = Partial<Match>;
type RequiredFields = Required<Pick<Match, 'sport' | 'schedule'>>;
type MatchWithoutId = Omit<Match, 'id'>;
```

### Async/Await Best Practices

```typescript
// ✅ Always use async/await (not callbacks)
async function createMatch(data: MatchDTO): Promise<Match> {
  const match = await Match.create(data);
  return match;
}

// ✅ Handle errors with try-catch or let asyncHandler do it
async function riskyOperation() {
  try {
    return await externalAPI.call();
  } catch (error) {
    logger.error('External API failed:', error);
    // Fallback or rethrow
    throw new ServiceUnavailableError('External service unavailable');
  }
}

// ✅ Use Promise.all for parallel operations
const [user, matches, stats] = await Promise.all([
  User.findById(userId),
  Match.find({ participants: userId }),
  getStats(userId),
]);

// ❌ Don't use .then() chains (except for fire-and-forget)
// Match.create(data).then(m => notify(m)); // Don't do this
await Match.create(data); // Do this
notify(match).catch((err) => logger.error(err)); // Fire-and-forget OK
```

### Naming Conventions

```typescript
// Classes: PascalCase
class MatchController { }
class MatchService { }
class Match { }

// Functions/methods: camelCase
function createMatch() { }
async getUserMatches() { }

// Constants: UPPER_SNAKE_CASE
const MAX_PARTICIPANTS = 100;
const DEFAULT_PAGE_SIZE = 10;

// Interfaces: PascalCase with I prefix (optional)
interface IMatchService { }
interface MatchFilters { }

// Enums: PascalCase
enum MatchStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed'
}

// Files: kebab-case or PascalCase
match-controller.ts (preferred)
MatchController.ts (acceptable)
```

### Import Organization

```typescript
// 1. Node built-ins
import { EventEmitter } from 'events';

// 2. External packages
import express from 'express';
import { body } from 'express-validator';

// 3. Internal absolute imports (using @/)
import { authenticate } from '@/shared/middleware/auth';
import logger from '@/shared/utils/logger';
import { Match } from '@/modules/matches/domain/models';

// 4. Internal relative imports (same module)
import { MatchService } from '../domain/services/MatchService';
import type { CreateMatchDTO } from '../types';

// Use barrel exports
import { usersModule, UserService } from '@/modules/users';
```

### Error Handling Philosophy

```typescript
// Business errors: Throw typed errors
if (!match) {
  throw new NotFoundError('Match'); // Client's fault (404)
}

if (match.participants.length >= match.maxParticipants) {
  throw new ConflictError('Match is full'); // Client's fault (409)
}

// System errors: Log and rethrow or convert
try {
  await externalAPI.call();
} catch (error) {
  logger.error('External API failed:', error);
  throw new ServiceUnavailableError(); // Our fault (503)
}

// Let asyncHandler catch everything
export const createMatch = asyncHandler(async (req, res) => {
  // Any error thrown here is automatically caught and formatted
  const match = await matchService.create(req.body);
  sendCreated(res, { match });
});
```

---

## 🎯 Feature Development Checklist

When building a new feature, follow this workflow:

### Phase 1: Planning & Design

- [ ] **Identify module**: Does this belong to an existing module or need a new one?
- [ ] **Define events**: What events will this publish? What events will it consume?
- [ ] **Data modeling**: What new models or fields are needed?
- [ ] **API design**: What endpoints? Request/response formats?
- [ ] **Dependencies**: What external services or modules does this need?

### Phase 2: Implementation

- [ ] **Create models**: Define Mongoose schemas with validation
- [ ] **Create DTOs**: TypeScript interfaces for request/response
- [ ] **Implement repository**: Database access methods
- [ ] **Implement service**: Business logic with validation
- [ ] **Implement controller**: HTTP handlers with asyncHandler
- [ ] **Create routes**: Express routes with validation middleware
- [ ] **Add event publishers**: Publish domain events
- [ ] **Add event subscribers**: Handle events from other modules
- [ ] **Update module registration**: Register in `src/app.ts` if new module

### Phase 3: Quality Assurance

- [ ] **Write unit tests**: Test services in isolation
- [ ] **Write integration tests**: Test API endpoints
- [ ] **Test event flow**: Verify events are published/consumed correctly
- [ ] **Add logging**: Appropriate log levels (info, warn, error)
- [ ] **Handle errors**: Throw typed errors with clear messages
- [ ] **Validate input**: express-validator rules on routes
- [ ] **Check auth**: Authenticate middleware where needed
- [ ] **Review security**: No SQL injection, XSS, or secrets in code

### Phase 4: Documentation

- [ ] **API documentation**: Add Swagger/JSDoc comments
- [ ] **Update README**: Module-specific documentation
- [ ] **Code comments**: Complex business logic explained
- [ ] **Update CHANGELOG**: Note breaking changes

### Phase 5: Deployment Preparation

- [ ] **Environment variables**: Add new config to `.env.example`
- [ ] **Database migrations**: Create migration scripts if needed
- [ ] **Performance check**: Add indexes, optimize queries
- [ ] **Monitoring**: Add metrics/alerts if needed
- [ ] **Rollback plan**: Document how to revert if issues arise

---

## 📚 Quick Reference

### Essential Files & Their Purpose

| File                                    | Purpose                  | When to Use                           |
| --------------------------------------- | ------------------------ | ------------------------------------- |
| `src/app.ts`                            | Application bootstrap    | Module registration, middleware setup |
| `src/shared/module/Module.ts`           | Base module class        | Creating new modules                  |
| `src/shared/events/EventBus.ts`         | Event bus implementation | Publishing/subscribing to events      |
| `src/shared/middleware/auth.ts`         | Authentication           | Protecting routes                     |
| `src/shared/middleware/errorHandler.ts` | Error utilities          | Throwing/catching errors              |
| `src/shared/middleware/validation.ts`   | Validation helpers       | Pagination, sorting                   |
| `src/shared/config/index.ts`            | Configuration            | Accessing env variables               |
| `src/shared/config/database.ts`         | Database connection      | Database operations                   |
| `src/shared/utils/logger.ts`            | Winston logger           | Logging                               |
| `src/shared/utils/jwt.ts`               | JWT utilities            | Token operations                      |
| `docs/PROJECT_STRUCTURE.md`             | Architecture docs        | Understanding structure               |
| `docs/future/microservices/`            | Migration plan           | Future architecture                   |

### Common Commands

```bash
# Development
npm run dev              # Start with hot reload
npm run build            # Compile TypeScript
npm start                # Production server

# Testing
npm test                 # Run all tests
npm run test:watch       # TDD mode
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # Check linting
npm run lint:fix         # Auto-fix
npm run format           # Format with Prettier

# Database
npm run migrate          # Run migrations
npm run seed             # Seed database

# Docker
docker-compose up        # Full stack
docker-compose up mongodb redis  # Services only
docker-compose logs -f api       # View logs
```

### Module Dependencies Map

```
Foundation (No Dependencies):
├── IAM (Authentication)
└── Venues (Locations)

Core Domain (Depend on Foundation):
├── Users (IAM)
├── Matches (Users, Venues)
├── Tournaments (Matches, Users)
└── Teams (Users)

Features (Depend on Core):
└── Chat (Users, Matches, Tournaments, Teams)

Cross-Cutting (Subscribe to All):
├── Notifications (All events)
├── Analytics (All events)
└── AI/ML (Users, Matches)
```

### Event Naming Convention

```
{module}.{entity}.{action}

Examples:
iam.user.registered
users.friend.added
matches.match.created
matches.match.joined
matches.score.updated
tournaments.tournament.started
teams.member.added
chat.message.sent
```

### HTTP Status Codes

```typescript
200 OK              - Success (GET, PATCH)
201 Created         - Resource created (POST)
204 No Content      - Success, no response body (DELETE)
400 Bad Request     - Validation error
401 Unauthorized    - Authentication required/failed
403 Forbidden       - Insufficient permissions
404 Not Found       - Resource doesn't exist
409 Conflict        - Business rule violation
422 Unprocessable   - Semantic errors
429 Too Many Req    - Rate limit exceeded
500 Internal Error  - Server error (unhandled)
503 Service Unavail - External service down
```

---

## 🚨 Common Pitfalls & Anti-Patterns

### ❌ Anti-Pattern 1: Direct Module Imports

```typescript
// ❌ WRONG - Tight coupling
import { UserService } from '../../users/domain/services/UserService';

const userService = new UserService();
const user = await userService.findById(userId);

// ✅ CORRECT - Event-driven
this.publishEvent('match.participantNeeded', { userId, matchId });
// User module subscribes and handles internally
```

### ❌ Anti-Pattern 2: Business Logic in Controllers

```typescript
// ❌ WRONG - Logic in controller
export class MatchController {
  createMatch = asyncHandler(async (req, res) => {
    const scheduledDate = new Date(req.body.schedule.date);
    if (scheduledDate <= new Date()) {
      throw new ValidationError('Date must be in the future');
    }

    const match = await Match.create({
      ...req.body,
      createdBy: req.userId,
    });

    // Complex logic here...
  });
}

// ✅ CORRECT - Thin controller, fat service
export class MatchController {
  createMatch = asyncHandler(async (req, res) => {
    const match = await this.matchService.create(req.body, req.userId);
    sendCreated(res, { match }, 'Match created successfully');
  });
}

// Service contains all logic
export class MatchService {
  async create(dto: CreateMatchDTO, createdBy: string): Promise<Match> {
    this.validateSchedule(dto.schedule);
    // ... all business logic
  }
}
```

### ❌ Anti-Pattern 3: Missing asyncHandler

```typescript
// ❌ WRONG - Unhandled promise rejection
router.post('/', async (req, res) => {
  const match = await Match.create(req.body);
  res.json({ match });
  // If error occurs, no proper error handling
});

// ✅ CORRECT - asyncHandler catches errors
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const match = await Match.create(req.body);
    sendSuccess(res, { match });
  })
);
```

### ❌ Anti-Pattern 4: Hardcoded Configuration

```typescript
// ❌ WRONG
const JWT_SECRET = 'my-secret-key';
const DB_URI = 'mongodb://localhost:27017/sportification';

// ✅ CORRECT
import config from '@/shared/config';

const jwtSecret = config.jwt.secret;
const dbUri = config.database.uri;
```

### ❌ Anti-Pattern 5: Missing Input Validation

```typescript
// ❌ WRONG - No validation
router.post('/', authenticate, matchController.createMatch);

// ✅ CORRECT - Validation middleware
router.post(
  '/',
  authenticate,
  [
    body('sport').notEmpty().trim(),
    body('schedule.date').isISO8601(),
    body('maxParticipants').optional().isInt({ min: 2, max: 100 }),
  ],
  matchController.createMatch
);
```

### ❌ Anti-Pattern 6: Not Populating References

```typescript
// ❌ WRONG - Returns ObjectIds
const matches = await Match.find();
// matches[0].createdBy = "507f1f77bcf86cd799439011" (ObjectId)

// ✅ CORRECT - Populates referenced documents
const matches = await Match.find()
  .populate('createdBy', 'profile')
  .populate('participants', 'profile')
  .populate('venue', 'name location');
// matches[0].createdBy = { _id: "...", profile: { ... } }
```

### ❌ Anti-Pattern 7: Synchronous Event Handlers

```typescript
// ❌ WRONG - Blocks event bus
eventBus.subscribe('match.created', (event) => {
  // Synchronous heavy operation
  const result = heavyComputation(event.payload);
  return result;
});

// ✅ CORRECT - Async handlers
eventBus.subscribe('match.created', async (event) => {
  try {
    await notificationService.notify(event.payload);
    await analyticsService.track(event.payload);
  } catch (error) {
    logger.error('Event handler failed:', error);
    // Don't rethrow - other subscribers should still run
  }
});
```

---

## 🎓 Learning Resources

### Internal Documentation

1. **Architecture Deep Dive**: `docs/PROJECT_STRUCTURE.md`
2. **API Reference**: http://localhost:3000/api/v1/docs (Swagger)
3. **Module Examples**: `src/modules/matches/` (reference implementation)
4. **Migration Plan**: `docs/future/microservices/MICROSERVICES_MIGRATION_PLAN.md`

### External Resources

1. **Clean Architecture**: Uncle Bob's Clean Architecture book
2. **Domain-Driven Design**: Eric Evans' DDD book
3. **Event-Driven Architecture**: Martin Fowler's event patterns
4. **Modular Monoliths**: Kamil Grzybek's blog on modular monoliths

### Code Examples from Codebase

- **Event Publishing**: `src/modules/matches/domain/services/MatchService.ts`
- **Event Subscription**: `src/modules/matches/events/subscribers/MatchEventSubscriber.ts`
- **Controller Pattern**: `src/modules/matches/api/controllers/MatchController.ts`
- **Service Pattern**: `src/modules/matches/domain/services/MatchService.ts`
- **Repository Pattern**: `src/modules/matches/data/repositories/MatchRepository.ts`
- **Module Definition**: `src/modules/matches/module.ts`

---

## 📞 Getting Support

### Self-Service

1. **Search this document** for patterns and solutions
2. **Check API docs** at http://localhost:3000/api/v1/docs
3. **Review module examples** in `src/modules/matches/`
4. **Read error messages** carefully (they're descriptive)
5. **Check logs** in `logs/` directory

### Team Support

1. **GitHub Issues**: For bugs and feature requests
2. **Slack #backend-help**: For quick questions
3. **Code Review**: Tag `@backend-team` in PRs
4. **Architecture Questions**: Tag `@backend-lead`

### Emergency Contacts

- **Production Issues**: @on-call-engineer
- **Security Issues**: @security-team (immediate)
- **Data Issues**: @database-admin

---

**Last Updated**: October 27, 2025  
**Version**: 3.0  
**Maintained By**: Backend Team  
**License**: Internal Use Only

**Changelog**:
- **v3.0** (Oct 27, 2025): Added comprehensive Codebase Overview section with all modules, services, utilities, and integration points
- **v2.0** (Oct 10, 2025): Initial comprehensive guide with architecture, patterns, and workflows

---

_This guide is a living document. Contributions and improvements are welcome via pull requests._
