# Developer Guides

Essential guides for understanding and developing the Sportification Backend.

## 📚 Available Guides

### 🚀 Getting Started

- **[Onboarding Guide](ONBOARDING.md)** - Complete onboarding for new developers
  - Environment setup
  - Local development
  - Running tests
  - Common workflows
  - Best practices

### 🏗️ Architecture

- **[Project Structure](PROJECT_STRUCTURE.md)** - Complete architecture documentation
  - Module organization
  - Clean architecture patterns
  - Domain-driven design
  - Event-driven communication
  - Shared infrastructure

---

## 🎯 Quick Navigation

### For New Developers

**First Steps:**

1. 📖 Read [Main README](../../README.md) for project overview
2. 🚀 Follow [Onboarding Guide](ONBOARDING.md) for setup
3. 🏗️ Study [Project Structure](PROJECT_STRUCTURE.md) for architecture
4. 💻 Review [API Documentation](../api/API_DOCUMENTATION.md)
5. 🧪 Check [Examples](../examples/) for integration patterns

### For Experienced Developers

**Quick References:**

- [Project Structure](PROJECT_STRUCTURE.md) - Architecture deep dive
- [Feature Documentation](../features/) - All feature modules
- [API Documentation](../api/API_DOCUMENTATION.md) - Complete API reference

---

## 📖 Guide Contents

### Onboarding Guide

**Topics Covered:**

- ✅ Prerequisites (Node.js, MongoDB, Redis)
- ✅ Environment setup
- ✅ Running the application
- ✅ Database setup
- ✅ Testing
- ✅ Development workflow
- ✅ Common tasks
- ✅ Troubleshooting

**Who Should Read:**

- New team members
- Contributors
- Anyone setting up the project locally

### Project Structure Guide

**Topics Covered:**

- ✅ Directory structure
- ✅ Module organization
- ✅ Clean architecture layers
- ✅ Domain-driven design
- ✅ Event-driven patterns
- ✅ Shared infrastructure
- ✅ Code organization best practices

**Who Should Read:**

- Developers working on features
- Architects reviewing the codebase
- Anyone needing to understand the architecture

---

## 🛠️ Development Workflow

### Daily Development

1. Pull latest changes: `git pull origin main`
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Make changes in your feature branch
5. Run tests: `npm test`
6. Commit and push: `git commit -m "feat: ..." && git push`

### Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # Run linter
npm run lint:fix         # Fix linting issues
npm run format           # Format code

# Database
npm run db:seed          # Seed database
npm run db:reset         # Reset database
```

---

## 🏗️ Architecture Principles

### Clean Architecture

- **Domain Layer**: Business logic and entities
- **Application Layer**: Use cases and DTOs
- **Infrastructure Layer**: External concerns (DB, HTTP)
- **Shared Layer**: Cross-cutting concerns

### Domain-Driven Design

- Feature modules represent bounded contexts
- Rich domain models with business logic
- Repository pattern for data access
- Domain events for inter-module communication

### Event-Driven Communication

- Loose coupling between modules
- Event bus for async communication
- Domain events for business processes
- Event handlers for side effects

---

## 📚 Related Documentation

### Core Documentation

- **[API Documentation](../api/API_DOCUMENTATION.md)** - Full API reference
- **[Feature Documentation](../features/)** - All feature modules
- **[Examples](../examples/)** - Integration examples

### External Resources

- **[Contributing Guide](../../CONTRIBUTING.md)** - Contribution guidelines
- **[Changelog](../../CHANGELOG.md)** - Version history
- **[Main README](../../README.md)** - Project overview

---

## 🤝 Contributing to Guides

Found something unclear or missing?

1. **Suggest Improvements**: Open an issue or PR
2. **Add Examples**: Share your learnings
3. **Update Content**: Keep guides current
4. **Fix Errors**: Typos and corrections welcome

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

---

## 📞 Getting Help

### Resources

1. Check relevant guide above
2. Review [API Documentation](../api/API_DOCUMENTATION.md)
3. Search existing issues
4. Ask in discussions

### Common Issues

- **Setup problems**: See [Onboarding Guide](ONBOARDING.md) → Troubleshooting
- **Architecture questions**: See [Project Structure](PROJECT_STRUCTURE.md)
- **API questions**: See [API Documentation](../api/API_DOCUMENTATION.md)

---

**[⬆ Back to Documentation](../README.md)**
