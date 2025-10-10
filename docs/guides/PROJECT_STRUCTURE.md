# 📁 Project Structure# 📁 Project Structure Guide



Complete guide to the Sportification Backend codebase structure.Comprehensive overview of the Sportification Backend project structure using **clean architecture** with **domain-driven design**.



------



## Directory Overview## 🎯 Quick Navigation



```- [Directory Structure](#directory-structure)

sportification-be/- [Module Structure](#module-structure)

├── src/                       # Source code- [Shared Infrastructure](#shared-infrastructure)

│   ├── modules/               # Feature modules (10 modules)- [Key Concepts](#key-concepts)

│   ├── shared/                # Shared infrastructure

│   ├── app.ts                 # Express app setup---

│   └── index.ts               # Entry point

│## Directory Structure

├── docs/                      # Documentation

├── scripts/                   # Utility scripts```

├── logs/                      # Application logssportification-be/

├── docker-compose.yml         # Docker setup│

├── Dockerfile                 # Production container├── 📱 src/                          # Source code

├── package.json               # Dependencies│   ├── 🎯 modules/                  # Feature modules (Domain-Driven Design)

└── tsconfig.json              # TypeScript config│   │   ├── analytics/               # Analytics & Metrics

```│   │   │   ├── api/                 # HTTP layer (controllers, routes)

│   │   │   └── domain/              # Business logic (models, services)

---│   │   │       └── models/          # Analytics, Performance, Business Metrics

│   │   │

## Source Code Structure (`src/`)│   │   ├── ai/                      # AI & ML Features

│   │   │   └── domain/

### Modules (`src/modules/`)│   │   │       └── models/

│   │   │

Feature modules organized by domain using **clean architecture**:│   │   ├── chat/                    # Real-time Messaging

│   │   │   ├── api/

```│   │   │   └── domain/

modules/│   │   │       └── models/          # Chat, Message

├── analytics/              # Analytics & Metrics│   │   │

│   ├── api/                # Controllers, routes, validators│   │   ├── iam/                     # Identity & Access Management

│   └── domain/             # Business logic, models, services│   │   │   ├── api/                 # Auth, ApiKey, Security controllers

│       └── models/         # Analytics, PerformanceMetrics, BusinessMetrics│   │   │   └── domain/

││   │   │       └── models/          # ApiKey, AuditLog

├── ai/                     # AI & ML features│   │   │

├── chat/                   # Real-time messaging (Chat, Message models)│   │   ├── matches/                 # Match Management

├── iam/                    # Identity & Access (ApiKey, AuditLog models)│   │   │   └── domain/

├── matches/                # Match management (Match model)│   │   │       └── models/          # Match

├── notifications/          # Notifications (Notification model)│   │   │

├── teams/                  # Team management (Team model)│   │   ├── notifications/           # Notification System

├── tournaments/            # Tournaments (Tournament model)│   │   │   └── domain/

├── users/                  # User management (User, Profile models)│   │   │       └── models/          # Notification

└── venues/                 # Venue management (Venue model)│   │   │

```│   │   ├── teams/                   # Team Management

│   │   │   └── domain/

#### Module Structure Pattern│   │   │       └── models/          # Team

│   │   │

Each module follows this structure:│   │   ├── tournaments/             # Tournament Management

│   │   │   └── domain/

```│   │   │       └── models/          # Tournament

module-name/│   │   │

├── api/                    # HTTP/API Layer│   │   ├── users/                   # User Management

│   ├── controllers/        # Request handlers│   │   │   └── domain/

│   ├── routes/             # Route definitions│   │   │       └── models/          # User, Profile

│   └── validators/         # Input validation│   │   │

││   │   └── venues/                  # Venue Management

├── domain/                 # Business Logic Layer│   │       └── domain/

│   ├── models/             # Database models (Mongoose)│   │           └── models/          # Venue

│   ├── services/           # Business logic│   │

│   └── interfaces/         # TypeScript interfaces│   ├── ⚡ shared/                   # Shared Infrastructure

││   │   ├── cache/                   # Caching utilities

├── data/                   # Data Access Layer│   │   ├── config/                  # Configuration (DB, Redis, Passport)

│   └── repositories/       # Database queries│   │   ├── database/                # Database setup

││   │   ├── events/                  # Event bus (module communication)

└── events/                 # Event-Driven Communication│   │   ├── logging/                 # Logging infrastructure

    ├── handlers/           # Event handlers│   │   ├── middleware/              # Auth, security, validation middleware

    └── publishers/         # Event publishers│   │   ├── module/                  # Module base class

```│   │   ├── types/                   # Shared TypeScript types

│   │   ├── utils/                   # Utilities (logger, cache, JWT, email)

### Shared Infrastructure (`src/shared/`)│   │   └── validators/              # Shared validators

│   │

Centralized cross-cutting concerns:│   ├── 💾 models/                   # Mongoose Models

│   │   ├── User.ts

```│   │   ├── Match.ts

shared/│   │   ├── Tournament.ts

├── cache/                  # Caching utilities│   │   └── ...

├── config/                 # Configuration│   │

│   ├── database.ts         # MongoDB setup│   ├── 🔑 controllers/              # Admin Controllers (4 files)

│   ├── redis.ts            # Redis setup│   │   ├── ApiKeyController.ts

│   ├── passport.ts         # Auth strategies│   │   ├── SecurityController.ts

│   └── index.ts            # Main config│   │   ├── AnalyticsController.ts

││   │   └── InsightsController.ts

├── database/               # Database utilities│   │

├── events/                 # Event bus (module communication)│   ├── 🛣️ routes/                   # Admin Routes (3 files)

├── logging/                # Logging infrastructure│   │   ├── admin.ts

├── middleware/             # Express middleware│   │   ├── apiKeys.ts

│   ├── auth.ts             # Authentication│   │   └── security.ts

│   ├── security.ts         # Security headers│   │

│   ├── validation.ts       # Request validation│   ├── 🛠️ utils/                    # Utilities

│   ├── errorHandler.ts     # Error handling│   │   ├── logger.ts

│   └── ...│   │   ├── jwt.ts

││   │   └── ...

├── module/                 # Module base class│   │

├── types/                  # Shared TypeScript types│   ├── ✅ validators/               # Validation Schemas

├── utils/                  # Utilities│   ├── 📝 types/                    # TypeScript Types

│   ├── logger.ts           # Winston logger│   ├── 🧪 tests/                    # Test Files

│   ├── cache.ts            # Cache utilities│   ├── 📚 docs/                     # Swagger Config

│   ├── jwt.ts              # JWT utilities│   ├── app.ts                       # App Bootstrap

│   ├── email.ts            # Email utilities│   └── index.ts                     # Entry Point

│   └── security.ts         # Security utilities│

│├── 📚 docs/                         # Documentation

└── validators/             # Shared validators│   ├── archive/                     # Historical migration docs

```│   ├── architecture/                # Architecture docs

│   ├── README.md                    # API module docs

---│   └── *.md                         # Various guides

│

## Documentation (`docs/`)├── 📖 support_docs/                 # Support Documentation

│   ├── API_DOCUMENTATION.md

```│   ├── FRONTEND_GUIDE.md

docs/│   ├── SECURITY.md

├── README.md                      # Documentation index│   └── ...

├── ONBOARDING.md                  # Developer onboarding│

├── PROJECT_STRUCTURE.md           # This file├── 🗄️ legacy_backup/                # Archived Legacy Code

├── API_DOCUMENTATION.md           # Complete API reference│   ├── controllers/                 # 10 old controllers

││   └── routes/                      # 11 old routes

├── Feature Documentation│

│   ├── admin.md                   # Admin features├── 🐳 Docker & Config

│   ├── ai.md                      # AI features│   ├── docker-compose.yml

│   ├── auth.md                    # Authentication│   ├── Dockerfile

│   ├── chat.md                    # Chat system│   ├── nginx/

│   ├── matches.md                 # Match management│   └── scripts/

│   ├── notifications.md           # Notifications│

│   ├── security.md                # Security features└── 📄 Root Documentation (8 files)

│   ├── teams.md                   # Team management    ├── README.md                    # Main docs

│   ├── tournaments.md             # Tournaments    ├── START_HERE.md                # Quick start

│   ├── users.md                   # User management    ├── MODULAR_MONOLITH_DEV_GUIDE.md

│   ├── venues.md                  # Venues    ├── MODULAR_MONOLITH_QUICK_START.md

│   └── websockets.md              # WebSocket implementation    ├── MIGRATION_COMPLETE_REPORT.md

│    ├── CLEANUP_COMPLETE.md

├── team_integration_example.md   # Integration examples    ├── CHANGELOG.md

│    └── CONTRIBUTING.md

└── future/                        # Future planning```

    └── microservices/             # Microservices migration guide

```---



---## Modules Overview



## Key Architecture Concepts### Module Structure Pattern



### 1. Clean ArchitectureEach module follows this consistent structure:



Each module is organized in layers:```

src/modules/{module-name}/

- **API Layer**: HTTP requests, routes, controllers├── api/

- **Domain Layer**: Business logic, models, services│   ├── controllers/              # HTTP handlers

- **Data Layer**: Database access, repositories│   │   └── {Module}Controller.ts

│   └── routes/                   # Express routes

### 2. Domain-Driven Design│       └── index.ts

├── domain/

Modules are organized by business domain:│   └── services/                 # Business logic

│       └── {Module}Service.ts

- Each module represents a bounded context├── events/

- Modules communicate via events (EventBus)│   ├── publishers/               # Event publishers

- Clear module boundaries│   │   └── {Module}EventPublisher.ts

│   └── subscribers/              # Event subscribers

### 3. Event-Driven Communication│       └── {Module}EventSubscriber.ts

├── module.ts                     # Module class

Modules communicate asynchronously:└── index.ts                      # Public API

```

```typescript

// Publisher (in one module)### Module Descriptions

eventBus.publish('user.registered', { userId, email });

#### 1. **IAM Module** (`src/modules/iam/`)

// Subscriber (in another module)

eventBus.subscribe('user.registered', async (data) => {**Purpose:** Identity & Access Management  

  // Handle event**Features:**

});

```- User registration & authentication

- Login/logout

### 4. Shared Infrastructure- Token management (JWT)

- Password reset

Common code is centralized in `shared/`:

**Events Published:**

- Configuration

- Middleware- `iam.user.registered`

- Utilities- `iam.user.profile.updated`

- Event bus

- Database setup**Dependencies:** None (base module)



------



## Module Communication#### 2. **Users Module** (`src/modules/users/`)



### Direct Import (Discouraged)**Purpose:** User profiles and social features  

```typescript**Features:**

// ❌ Don't do this - creates tight coupling

import { UserService } from '../users/domain/services/UserService';- Profile management

```- Friend system

- User statistics

### Event-Based (Recommended)- Profile search

```typescript

// ✅ Do this - loose coupling via events**Events Published:**

eventBus.publish('user.profileUpdated', { userId, changes });

```- `users.friend.request.sent`

- `users.friend.request.accepted`

---

**Events Subscribed:**

## Adding a New Module

- `iam.user.registered` (create profile)

1. Create module structure:

```bash**Dependencies:** IAM module

mkdir -p src/modules/new-module/{api/controllers,api/routes,domain/models,domain/services}

```---



2. Create models in `domain/models/`#### 3. **Matches Module** (`src/modules/matches/`)

3. Create services in `domain/services/`

4. Create controllers in `api/controllers/`**Purpose:** Match management and scoring  

5. Create routes in `api/routes/`**Features:**

6. Register module in `src/app.ts`

- Create matches

---- Join matches

- Score tracking

## Import Patterns- Match completion



### Importing from Shared**Events Published:**

```typescript

import { logger } from '@/shared/utils/logger';- `matches.match.created`

import config from '@/shared/config';- `matches.match.joined`

import { authenticate } from '@/shared/middleware/auth';- `matches.match.completed`

```

**Events Subscribed:**

### Importing within Module

```typescript- `matches.match.completed` (update user stats)

import { UserService } from '../domain/services/UserService';

import { User } from '../domain/models/User';**Dependencies:** Users module

```

---

### Importing Models from Other Modules

```typescript#### 4. **Tournaments Module** (`src/modules/tournaments/`)

// Via barrel export

import { User } from '@/modules/users/domain/models';**Purpose:** Tournament organization  

```**Features:**



---- Create tournaments

- Bracket generation

## Testing Structure- Player registration

- Tournament lifecycle

```

src/**Events Published:**

├── modules/

│   └── users/- `tournaments.tournament.created`

│       ├── __tests__/          # Module-specific tests- `tournaments.tournament.joined`

│       │   ├── unit/           # Unit tests- `tournaments.tournament.started`

│       │   └── integration/    # Integration tests

│       └── ...**Dependencies:** Matches, Users modules

│

└── tests/                      # Global tests---

    ├── e2e/                    # End-to-end tests

    └── helpers/                # Test utilities#### 5. **Teams Module** (`src/modules/teams/`)

```

**Purpose:** Team formation and management  

---**Features:**



## Build & Deployment- Create teams

- Member management

### Development- Team captain system

```bash- Team profiles

npm run dev                     # Start dev server with hot reload

```**Events Published:**



### Production- `teams.team.created`

```bash- `teams.member.joined`

npm run build                   # Compile TypeScript- `teams.member.left`

npm start                       # Start production server

```**Dependencies:** Users module



### Docker---

```bash

docker-compose up              # Start with Docker#### 6. **Chat Module** (`src/modules/chat/`)

```

**Purpose:** Real-time messaging  

---**Features:**



## Related Documentation- Chat creation

- Message sending

- [README.md](../README.md) - Project overview- Chat history

- [ONBOARDING.md](./ONBOARDING.md) - Developer onboarding- Real-time updates

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference

- [Feature Docs](./README.md#feature-documentation) - Individual feature guides**Events Published:**



---- `chat.chat.created`

- `chat.message.sent`

*Last Updated: October 10, 2025*

**Dependencies:** Users module

---

#### 7. **Notifications Module** (`src/modules/notifications/`)

**Purpose:** Cross-cutting notifications  
**Features:**

- Notification creation
- Notification delivery
- Read/unread tracking
- Notification preferences

**Events Subscribed:**

- ALL events from all modules

**Special:** Cross-cutting concern, subscribes to all domain events

**Dependencies:** All modules (subscriber only)

---

#### 8. **Venues Module** (`src/modules/venues/`)

**Purpose:** Venue management  
**Features:**

- Create venues
- Search venues
- Filter by location/sport
- Venue details

**Events Published:**

- `venues.venue.created`
- `venues.venue.updated`

**Dependencies:** None

---

#### 9. **Analytics Module** (`src/modules/analytics/`)

**Purpose:** System-wide analytics  
**Features:**

- Event tracking
- User analytics
- System metrics
- Historical analysis

**Events Subscribed:**

- ALL events from all modules

**Special:** Cross-cutting concern, tracks all system events

**Dependencies:** All modules (subscriber only)

---

#### 10. **AI Module** (`src/modules/ai/`)

**Purpose:** AI recommendations and predictions  
**Features:**

- Match recommendations
- Match outcome predictions
- User insights
- Activity analysis

**Dependencies:** Users, Matches modules

---

## Admin Features

### Retained Admin Controllers & Routes

These are NOT part of the modular architecture yet and remain in the legacy structure for admin-specific functionality:

#### API Keys (`src/routes/apiKeys.ts`)

- Create/manage API keys
- Permission management
- Rate limiting per key
- IP whitelist

#### Security (`src/routes/security.ts`)

- Security dashboard
- Audit logs
- Security metrics
- Alert management

#### Admin (`src/routes/admin.ts`)

- Analytics dashboard
- User management
- System overview
- Business intelligence
- Performance monitoring

**Future:** These will be migrated to a dedicated `admin` module.

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

- **`docs/archive/`** - Historical migration documents
- **`docs/architecture/`** - Architecture diagrams and comparisons
- **`support_docs/`** - Additional guides (API, frontend, security)

---

## File Counts

| Category | Count | Location |
|----------|-------|----------|
| Modules | 10 | `src/modules/` |
| Module Controllers | 10 | `src/modules/*/api/controllers/` |
| Module Services | 10 | `src/modules/*/domain/services/` |
| Admin Controllers | 4 | `src/controllers/` |
| Admin Routes | 3 | `src/routes/` |
| Mongoose Models | 13 | `src/models/` |
| Middleware | 7 | `src/middleware/` |
| Root Documentation | 8 | Root directory |
| Archived Files | 21 | `legacy_backup/` |

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

**Looking for API endpoint?**  
→ `src/modules/{module}/api/routes/index.ts`

**Looking for business logic?**  
→ `src/modules/{module}/domain/services/`

**Looking for event handlers?**  
→ `src/modules/{module}/events/subscribers/`

**Looking for models?**  
→ `src/models/`

**Looking for middleware?**  
→ `src/middleware/`

### Finding Documentation

**Getting started?**  
→ `START_HERE.md` or `README.md`

**Understanding architecture?**  
→ `docs/architecture/` or `MODULAR_MONOLITH_DEV_GUIDE.md`

**API reference?**  
→ <http://localhost:3000/api/v1/docs> (Swagger)

**Module specific?**  
→ `docs/{module}.md`

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
