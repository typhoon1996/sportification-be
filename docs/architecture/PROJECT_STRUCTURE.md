# 📁 Project Structure Guide

A comprehensive overview of the Sportification Backend codebase, organized using **clean architecture** and **domain-driven design**.

---

## 🚀 Quick Navigation

- [Directory Structure](#directory-structure)
- [Module Structure](#module-structure)
- [Shared Infrastructure](#shared-infrastructure)
- [Key Concepts](#key-architecture-concepts)
- [Testing Structure](#testing-structure)
- [Build & Deployment](#build--deployment)
- [Documentation](#documentation)
- [File Counts](#file-counts)
- [Navigation Tips](#navigation-tips)
- [Next Steps](#next-steps)

---

## Directory Structure

```text
sportification-be/
├── src/                       # Source code
│   ├── modules/               # Feature modules (10 modules)
│   ├── shared/                # Shared infrastructure
│   ├── app.ts                 # Express app setup
│   └── index.ts               # Entry point
├── docs/                      # Documentation
├── scripts/                   # Utility scripts
├── logs/                      # Application logs
├── docker-compose.yml         # Docker setup
├── Dockerfile                 # Production container
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

---

## Source Code Structure (`src/`)

### Modules (`src/modules/`)

Feature modules are organized by domain, following **clean architecture**:

```text
src/modules/
├── {module-name}/
│   ├── api/
│   │   ├── controllers/        # HTTP handlers
│   │   ├── routes/             # Express routes
│   │   └── validators/         # Input validation
│   ├── domain/
│   │   ├── models/             # Database models (Mongoose)
│   │   ├── services/           # Business logic
│   │   └── interfaces/         # TypeScript interfaces
│   ├── data/
│   │   └── repositories/       # Database queries
│   ├── events/
│   │   ├── publishers/         # Event publishers
│   │   └── subscribers/        # Event subscribers
│   ├── module.ts               # Module base class
│   └── index.ts                # Public API
```

### Shared Infrastructure (`src/shared/`)

Centralized cross-cutting concerns:

```text
src/shared/
├── cache/                     # Caching utilities
├── config/                    # Configuration (DB, Redis, Passport)
├── database/                  # Database setup
├── events/                    # Event bus (module communication)
├── logging/                   # Logging infrastructure
├── middleware/                # Auth, security, validation middleware
├── module/                    # Module base class
├── types/                     # Shared TypeScript types
├── utils/                     # Utilities (logger, cache, JWT, email)
├── validators/                # Shared validators
└── index.ts                   # Main config
```

### Documentation (`docs/`)

```text
docs/
├── archive/                   # Historical migration docs
├── architecture/              # Architecture docs
├── support_docs/              # Additional guides (API, frontend, security)
├── README.md                  # Documentation index
├── ONBOARDING.md              # Developer onboarding
├── PROJECT_STRUCTURE.md       # This file
├── API_DOCUMENTATION.md       # Complete API reference
├── Feature Documentation      # Individual feature guides
│   ├── admin.md
│   ├── ai.md
│   ├── auth.md
│   ├── chat.md
│   ├── matches.md
│   ├── notifications.md
│   ├── security.md
│   ├── teams.md
│   ├── tournaments.md
│   ├── users.md
│   ├── venues.md
│   └── websockets.md
└── future/
  └── microservices/         # Microservices migration guide
```

---

## Module Structure Pattern

Each module follows this consistent structure:

- **API Layer**: HTTP requests, routes, controllers
- **Domain Layer**: Business logic, models, services
- **Data Layer**: Database access, repositories
- **Events Layer**: Event publishers/subscribers

---

## Key Architecture Concepts

### 1. Clean Architecture

Modules are organized in layers:

```text
src/modules/{module-name}/
├── api/
│   ├── controllers/
│   ├── routes/
│   └── validators/
├── domain/
│   ├── models/
│   ├── services/
│   └── interfaces/
├── data/
│   └── repositories/
├── events/
│   ├── publishers/
│   └── subscribers/
├── module.ts
└── index.ts
```

### 2. Domain-Driven Design

- Each module represents a bounded context
- Modules communicate via events (EventBus)
- Clear module boundaries

### 3. Event-Driven Communication

Modules communicate asynchronously via the EventBus:

```typescript
// Publisher (in one module)
eventBus.publish('user.registered', { userId, email });

// Subscriber (in another module)
eventBus.subscribe('user.registered', async (data) => {
  // Handle event
});
```

### 4. Shared Infrastructure

Common code is centralized in `shared/`:

- Configuration
- Middleware
- Utilities
- Event bus
- Database setup

---

## Module Communication

### Direct Import (Discouraged)

```typescript
// ❌ Don't do this - creates tight coupling
import { UserService } from '../users/domain/services/UserService';
```

### Event-Based (Recommended)

```typescript
// ✅ Do this - loose coupling via events
eventBus.publish('user.profileUpdated', { userId, changes });
```

---

## Adding a New Module

1. Create module structure:

```bash
mkdir -p src/modules/new-module/{api/controllers,api/routes,domain/models,domain/services}
```

2. Create models in `domain/models/`
3. Create services in `domain/services/`
4. Create controllers in `api/controllers/`
5. Create routes in `api/routes/`
6. Register module in `src/app.ts`

---

## Module Descriptions

### 1. **IAM Module** (`src/modules/iam/`)

**Purpose:** Identity & Access Management  
**Features:** Registration, authentication, JWT, password reset  
**Events Published:** `iam.user.registered`, `iam.user.profile.updated`  
**Dependencies:** None

### 2. **Users Module** (`src/modules/users/`)

**Purpose:** User profiles and social features  
**Features:** Profile management, friend system, statistics  
**Events Published:** `users.friend.request.sent`, `users.friend.request.accepted`  
**Events Subscribed:** `iam.user.registered`  
**Dependencies:** IAM module

### 3. **Matches Module** (`src/modules/matches/`)

**Purpose:** Match management and scoring  
**Features:** Create/join matches, score tracking  
**Events Published:** `matches.match.created`, `matches.match.joined`, `matches.match.completed`  
**Events Subscribed:** `matches.match.completed`  
**Dependencies:** Users module

### 4. **Tournaments Module** (`src/modules/tournaments/`)

**Purpose:** Tournament organization  
**Features:** Create tournaments, brackets, registration  
**Events Published:** `tournaments.tournament.created`, `tournaments.tournament.joined`, `tournaments.tournament.started`  
**Dependencies:** Matches, Users modules

### 5. **Teams Module** (`src/modules/teams/`)

**Purpose:** Team formation and management  
**Features:** Create teams, member management, profiles  
**Events Published:** `teams.team.created`, `teams.member.joined`, `teams.member.left`  
**Dependencies:** Users module

### 6. **Chat Module** (`src/modules/chat/`)

**Purpose:** Real-time messaging  
**Features:** Chat creation, message sending, history  
**Events Published:** `chat.chat.created`, `chat.message.sent`  
**Dependencies:** Users module

### 7. **Notifications Module** (`src/modules/notifications/`)

**Purpose:** Cross-cutting notifications  
**Features:** Notification creation, delivery, tracking  
**Events Subscribed:** All events from all modules  
**Dependencies:** All modules (subscriber only)

### 8. **Venues Module** (`src/modules/venues/`)

**Purpose:** Venue management  
**Features:** Create/search venues, filter, details  
**Events Published:** `venues.venue.created`, `venues.venue.updated`  
**Dependencies:** None

### 9. **Analytics Module** (`src/modules/analytics/`)

**Purpose:** System-wide analytics  
**Features:** Event tracking, metrics, analysis  
**Events Subscribed:** All events from all modules  
**Dependencies:** All modules (subscriber only)

### 10. **AI Module** (`src/modules/ai/`)

**Purpose:** AI recommendations and predictions  
**Features:** Match recommendations, predictions, insights  
**Dependencies:** Users, Matches modules

---

## Admin Features

### Retained Admin Controllers & Routes

These remain in the legacy structure for admin-specific functionality:

- **API Keys** (`src/routes/apiKeys.ts`): Manage API keys, permissions, rate limiting
- **Security** (`src/routes/security.ts`): Security dashboard, audit logs, alerts
- **Admin** (`src/routes/admin.ts`): Analytics, user management, system overview

**Future:** Will migrate to a dedicated `admin` module.

---

## Shared Infrastructure

### EventBus (`src/shared/events/EventBus.ts`)

Centralized pub/sub system for module communication.

```typescript
// Publishing events
eventBus.publish({
  eventType: 'matches.match.created',
  aggregateId: matchId,
  aggregateType: 'Match',
  timestamp: new Date(),
  payload: { ... }
});

// Subscribing to events
eventBus.subscribe('matches.match.created', async (event) => {
  // Handle event
});
```

### Module Base Class (`src/shared/module/Module.ts`)

Abstract base class all modules extend.

```typescript
abstract class Module {
  abstract initialize(): Promise<void>;
  abstract getRouter(): Router;
  abstract registerEventHandlers(): void;

  getName(): string;
  getBasePath(): string;
  publishEvent(event: DomainEvent): void;
  subscribeToEvent(eventType: string, handler: Function): void;
}
```

---

## Testing Structure

```text
src/
├── modules/
│   └── {module}/
│       └── tests/
│           ├── unit/           # Unit tests
│           └── integration/    # Integration tests
└── tests/
  ├── e2e/                    # End-to-end tests
  └── helpers/                # Test utilities
```

---

## Build & Deployment

### Development

```bash
npm run dev                     # Start dev server with hot reload
```

### Production

```bash
npm run build                   # Compile TypeScript
npm start                       # Start production server
```

### Docker

```bash
docker-compose up               # Start with Docker
```

---

## Documentation

### Root Documentation (8 essential files)

1. **README.md** - Main project documentation
2. **START_HERE.md** - Quick start guide for new developers
3. **MODULAR_MONOLITH_DEV_GUIDE.md** - Comprehensive development guide
4. **MODULAR_MONOLITH_QUICK_START.md** - Quick start tutorial
5. **MIGRATION_COMPLETE_REPORT.md** - Complete migration analysis
6. **CLEANUP_COMPLETE.md** - Cleanup documentation
7. **CHANGELOG.md** - Version history
8. **CONTRIBUTING.md** - Contribution guidelines

### Organized Documentation

- `docs/archive/` - Historical migration documents
- `docs/architecture/` - Architecture diagrams and comparisons
- `docs/support_docs/` - Additional guides (API, frontend, security)

---

## File Counts

| Category            | Count | Location                                 |
|---------------------|-------|------------------------------------------|
| Modules             | 10    | `src/modules/`                           |
| Module Controllers  | 10    | `src/modules/*/api/controllers/`         |
| Module Services     | 10    | `src/modules/*/domain/services/`         |
| Admin Controllers   | 4     | `src/controllers/`                       |
| Admin Routes        | 3     | `src/routes/`                            |
| Mongoose Models     | 13    | `src/models/`                            |
| Middleware          | 7     | `src/middleware/`                        |
| Root Documentation  | 8     | Root directory                           |
| Archived Files      | 21    | `legacy_backup/`                         |

---

## Key Principles

### 1. **Module Independence**

- Each module is self-contained
- Clear public API (`index.ts`)
- No direct imports between modules
- Communication via events

### 2. **Event-Driven Architecture**

- Asynchronous communication
- Loose coupling
- Easy to add subscribers
- Scalable pattern

### 3. **Consistent Structure**

- Same pattern across all modules
- Easy to navigate
- Predictable organization
- Clear ownership

### 4. **Separation of Concerns**

- Controllers handle HTTP
- Services handle business logic
- Events handle cross-module communication
- Models handle data

---

## Navigation Tips

### Finding Code

- **API endpoint:** `src/modules/{module}/api/routes/index.ts`
- **Business logic:** `src/modules/{module}/domain/services/`
- **Event handlers:** `src/modules/{module}/events/subscribers/`
- **Models:** `src/models/`
- **Middleware:** `src/middleware/`

### Finding Documentation

- **Getting started:** `START_HERE.md` or `README.md`
- **Understanding architecture:** `docs/architecture/` or `MODULAR_MONOLITH_DEV_GUIDE.md`
- **API reference:** <http://localhost:3000/api/v1/docs> (Swagger)
- **Module specific:** `docs/{module}.md`

---

## Next Steps

1. **Explore modules** in `src/modules/`
2. **Read development guide** - `MODULAR_MONOLITH_DEV_GUIDE.md`
3. **Check API docs** - Start server and visit `/api/v1/docs`
4. **Review architecture** - `docs/architecture/`

---

**Structure Status:** ✅ CLEAN AND ORGANIZED  
**Migration Status:** ✅ COMPLETE  
**Architecture:** ✅ MODULAR MONOLITH  

🎉 **Ready for development!**

```*Last Updated: October 10, 2025*```
