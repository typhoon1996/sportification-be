# Feature Documentation

Detailed documentation for all feature modules in the Sportification Backend.

## 🎯 Feature Modules

### Core Features

#### 🔐 Authentication & Security

- **[Authentication & Authorization](auth.md)** - JWT auth, OAuth 2.0, MFA
- **[Security](security.md)** - Security implementation, rate limiting, CORS
- **[Admin Features](admin.md)** - Admin dashboard, user management, analytics

#### 👥 User & Social Features

- **[User Management](users.md)** - User profiles, friends, achievements
- **[Team Management](teams.md)** - Team creation, roles, coordination
- **[Match System](matches.md)** - Match creation, joining, management
- **[Tournament System](tournaments.md)** - Tournament organization, brackets

#### 📍 Location Features

- **[Venue Management](venues.md)** - Location-based venue system

### Real-time Features

#### 💬 Communication

- **[Chat System](chat.md)** - Real-time messaging (DM, group, team)
- **[WebSocket API](websockets.md)** - WebSocket implementation details
- **[Notifications](notifications.md)** - Push notification system

### Advanced Features

#### 🤖 AI & ML

- **[AI Features](ai.md)** - AI recommendations and machine learning

---

## 📋 Feature Overview

| Feature | Status | Module | Description |
|---------|--------|--------|-------------|
| **Authentication** | ✅ Production | `iam` | JWT, OAuth, MFA |
| **Users** | ✅ Production | `users` | Profiles, friends, achievements |
| **Teams** | ✅ Production | `teams` | Team management |
| **Matches** | ✅ Production | `matches` | Match system |
| **Tournaments** | ✅ Production | `tournaments` | Tournament organization |
| **Venues** | ✅ Production | `venues` | Venue management |
| **Chat** | ✅ Production | `chat` | Real-time messaging |
| **Notifications** | ✅ Production | `notifications` | Push notifications |
| **WebSockets** | ✅ Production | `chat` | Real-time communication |
| **Admin** | ✅ Production | `iam` | Admin dashboard |
| **AI** | ✅ Production | `ai` | AI recommendations |
| **Analytics** | ✅ Production | `analytics` | Usage analytics |

---

## 🏗️ Architecture

Each feature module follows Clean Architecture principles:

```
src/modules/<feature>/
├── domain/              # Business logic
│   ├── entities/        # Domain entities
│   ├── repositories/    # Repository interfaces
│   └── services/        # Domain services
├── application/         # Application logic
│   ├── use-cases/       # Use case implementations
│   ├── dtos/            # Data transfer objects
│   └── events/          # Domain events
├── infrastructure/      # External concerns
│   ├── repositories/    # Repository implementations
│   ├── services/        # External services
│   └── http/            # HTTP controllers
└── index.ts             # Module exports
```

---

## 🔗 Quick Links

### By Development Task

| Task | Documentation |
|------|--------------|
| Add authentication | [Authentication Guide](auth.md) |
| Build user features | [User Management](users.md) |
| Implement real-time | [WebSocket API](websockets.md), [Chat](chat.md) |
| Add security | [Security Guide](security.md) |
| Create admin features | [Admin Features](admin.md) |

### By Integration Need

| Integration | Documentation |
|-------------|--------------|
| User login/signup | [Authentication](auth.md) |
| Social features | [Users](users.md), [Teams](teams.md) |
| Messaging | [Chat](chat.md), [WebSockets](websockets.md) |
| Push notifications | [Notifications](notifications.md) |
| Location features | [Venues](venues.md) |

---

## 📚 Related Documentation

- **[API Documentation](../api/API_DOCUMENTATION.md)** - Full API reference
- **[Project Structure](../guides/PROJECT_STRUCTURE.md)** - Architecture details
- **[Integration Examples](../examples/)** - Complete workflows
- **[Onboarding Guide](../guides/ONBOARDING.md)** - Getting started

---

**[⬆ Back to Documentation](../README.md)**
