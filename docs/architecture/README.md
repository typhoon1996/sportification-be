# 🏗️ Architecture Documentation

This directory contains documentation about the system architecture, design patterns, and structural decisions.

## 📚 Documentation Index

- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Complete project structure and organization
- **[MODULAR_MONOLITH.md](./MODULAR_MONOLITH.md)** - Modular monolith architecture (Coming Soon)
- **[DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md)** - Common design patterns used (Coming Soon)

## 🏛️ Architecture Overview

Sportification Backend follows a **Modular Monolith** architecture based on:

- **Clean Architecture** principles
- **Domain-Driven Design (DDD)**
- **Event-Driven Communication**

### Key Principles

1. **Module Independence**: Each module is self-contained and deployable
2. **Event-Driven**: Inter-module communication via EventBus only
3. **Clean Layers**: API → Domain → Data → Events separation
4. **Shared Infrastructure**: Common utilities in `src/shared/`

## 🔗 Related Documentation

- [Project Structure](./PROJECT_STRUCTURE.md) - Detailed file organization
- [Module Development](../guides/ONBOARDING.md) - How to create modules
- [API Documentation](../api/API_DOCUMENTATION.md) - API design patterns
- [Microservices Migration](../future/microservices/README.md) - Future architecture

---

**Last Updated:** October 11, 2025
