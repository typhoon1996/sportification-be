# 🎯 Quick Reference: New File Locations

**Last Updated**: October 11, 2025

This guide helps you quickly find files in the new structure.

---

## 🔍 Where Did My File Go?

### Configuration Files

| Old Location           | New Location                           | Purpose                      |
| ---------------------- | -------------------------------------- | ---------------------------- |
| `Dockerfile`           | `config/docker/Dockerfile`             | Docker build configuration   |
| `docker-compose.yml`   | `config/docker/docker-compose.yml`     | Docker compose base          |
| `docker-compose.*.yml` | `config/docker/docker-compose.*.yml`   | Environment-specific compose |
| `.env.example`         | `config/environments/.env.example`     | Environment template         |
| `.env.development`     | `config/environments/.env.development` | Dev environment              |
| `.env.test`            | `config/environments/.env.test`        | Test environment             |
| `.env.production`      | `config/environments/.env.production`  | Prod environment             |
| `jest.config.js`       | `config/jest.config.js`                | Test configuration           |
| `tsconfig.json`        | `config/tsconfig.json`                 | TypeScript configuration     |

| `nginx/` | `config/nginx/` | Nginx configuration |
| `redis/` | `config/redis/` | Redis configuration |
| `monitoring/` | `config/monitoring/` | Monitoring configuration |

### Documentation Files

| Old Location                | New Location                              | Purpose              |
| --------------------------- | ----------------------------------------- | -------------------- |
| `QUICK_REFERENCE.md`        | `project-docs/QUICK_REFERENCE.md`         | Command reference    |
| `CHANGELOG.md`              | `project-docs/CHANGELOG.md`               | Version history      |
| `CONTRIBUTING.md`           | `project-docs/CONTRIBUTING.md`            | Contribution guide   |
| `SETUP_COMPLETE.md`         | `project-docs/SETUP_COMPLETE.md`          | Setup guide          |
| `FEATURE_ANALYSIS.md`       | `project-docs/FEATURE_ANALYSIS.md`        | Feature docs         |
| `BOOKING_*.md`              | `project-docs/BOOKING_*.md`               | Booking feature docs |
| `specs.md`                  | `project-docs/specs.md`                   | Technical specs      |
| `DEPLOYMENT_CHECKLIST.md`   | `docs/deployment/DEPLOYMENT_CHECKLIST.md` | Deployment guide     |
| `docs/PROJECT_STRUCTURE.md` | `docs/architecture/PROJECT_STRUCTURE.md`  | Architecture docs    |

### Script Files

| Old Location                 | New Location                             | Purpose           |
| ---------------------------- | ---------------------------------------- | ----------------- |
| `scripts/setup.sh`           | `scripts/development/setup.sh`           | Initial setup     |
| `scripts/setup-local-env.sh` | `scripts/development/setup-local-env.sh` | Environment setup |
| `scripts/health-check.sh`    | `scripts/development/health-check.sh`    | Health check      |
| `scripts/deploy.sh`          | `scripts/deployment/deploy.sh`           | Deployment script |
| `scripts/aws-setup.sh`       | `scripts/deployment/aws-setup.sh`        | AWS setup         |
| `scripts/mongo-init.js`      | `scripts/database/mongo-init.js`         | MongoDB init      |

---

## 📂 Directory Purpose Guide

### `config/`

**All configuration files**

- Docker configurations
- Environment variables
- Build configurations
- Service configurations

### `docs/`

**Technical documentation**

- Architecture documentation
- API documentation
- Feature documentation
- Development guides
- Deployment guides
- Operations guides

### `project-docs/`

**Project-level documentation**

- Changelog
- Contributing guidelines
- Quick references
- Feature analysis
- Specifications

### `scripts/`

**Automation scripts**

- Development scripts
- Deployment scripts
- Database scripts

### `infrastructure/`

**Infrastructure as Code**

- Terraform configurations
- Kubernetes manifests

### `src/`

**Source code** (unchanged)

- Application code
- Modules
- Shared utilities
- Tests

---

## 🚀 Updated Commands

### NPM Scripts (All Work!)

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build with config/tsconfig.json

# Testing
npm test                       # Test with config/jest.config.js
npm run test:coverage          # Coverage report

# Docker
npm run docker:build           # Uses config/docker/Dockerfile
npm run docker:compose:up      # Uses config/docker/docker-compose.dev.yml

# Scripts
npm run setup:env              # Uses scripts/development/setup-local-env.sh
npm run deploy:dev             # Uses scripts/deployment/deploy.sh
```

### Make Commands (All Work!)

```bash
# Development
make dev                       # Start development
make docker-build              # Build with new path

# Docker
make docker-up ENVIRONMENT=dev # Uses config/docker/
make docker-logs               # View logs

# Deployment
make deploy-dev                # Uses scripts/deployment/
make terraform-plan            # Uses infrastructure/terraform/
```

### Direct Commands

```bash
# Setup environment
cp config/environments/.env.example .env

# Start Docker
docker-compose -f config/docker/docker-compose.dev.yml up

# Build image
docker build -f config/docker/Dockerfile -t api:latest .

# Run scripts
./scripts/development/setup.sh
./scripts/deployment/deploy.sh dev
```

---

## 🎯 Common Tasks

### Starting Development

```bash
# Option 1: NPM
npm run dev

# Option 2: Docker
npm run docker:compose:up

# Option 3: Make
make dev-docker
```

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Building for Production

```bash
# TypeScript build
npm run build

# Docker build
npm run docker:build:prod

# Or with Make
make docker-build-prod
```

### Deploying

```bash
# Via NPM
npm run deploy:dev

# Via Make
make deploy-dev

# Via Script
./scripts/deployment/deploy.sh dev
```

---

## 📝 Need Help?

### Finding Documentation

```bash
# Architecture and design
ls docs/architecture/

# API documentation
ls docs/api/

# Deployment guides
ls docs/deployment/

# Project documentation
ls project-docs/
```

### Configuration

```bash
# All configs
ls config/

# Docker configs
ls config/docker/

# Environment files
ls config/environments/
```

### Scripts

```bash
# Development scripts
ls scripts/development/

# Deployment scripts
ls scripts/deployment/

# Database scripts
ls scripts/database/
```

---

## ✅ Checklist for New Developers

- [ ] Clone repository
- [ ] Run `./scripts/development/setup.sh`
- [ ] Copy `config/environments/.env.example` to `.env`
- [ ] Edit `.env` with your settings
- [ ] Run `npm install`
- [ ] Run `npm run dev` or `make dev-docker`
- [ ] Read `docs/guides/ONBOARDING.md`
- [ ] Read `project-docs/CONTRIBUTING.md`

---

**Everything works as before, just in better-organized locations!** 🎉

---

**Quick Links**

- [Main README](../README.md)
- [Configuration Guide](../config/README.md)
- [Project Docs Index](../project-docs/README.md)
- [Architecture Docs](../docs/architecture/README.md)
- [Restructure Complete](../RESTRUCTURE_COMPLETE.md)
