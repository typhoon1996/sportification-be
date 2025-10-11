# 🎯 Quick Reference - DevOps Commands

## Essential Commands Cheat Sheet

### 🚀 Quick Start (New Developer)

```bash
# Clone and setup
git clone https://github.com/typhoon1996/sportification-be.git
cd sportification-be
make install
make dev-docker

# Access:
# API: http://localhost:3000
# MongoDB GUI: http://localhost:8081
# Redis GUI: http://localhost:8082
# API Docs: http://localhost:3000/api/v1/docs
```

### 📦 Local Development

```bash
# Without Docker
make install          # Install dependencies
make dev              # Start dev server
make test             # Run tests
make lint             # Check code quality

# With Docker
make docker-up ENVIRONMENT=dev      # Start all services
make docker-logs ENVIRONMENT=dev    # View logs
make docker-down ENVIRONMENT=dev    # Stop services
```

### 🔨 Building & Testing

```bash
# Build
make build                # Compile TypeScript
make docker-build         # Build Docker image

# Testing
make test                 # Run all tests
make test-coverage        # With coverage report
make ci                   # Run all CI checks locally
```

### ☁️ AWS Setup (One-Time)

```bash
# 1. Configure AWS credentials
aws configure

# 2. Initialize AWS resources
make aws-setup

# 3. Login to ECR
make aws-login
```

### 🏗️ Infrastructure (Terraform)

```bash
# Initialize
make terraform-init

# Development
make terraform-plan ENVIRONMENT=dev
make terraform-apply ENVIRONMENT=dev

# Production
make terraform-plan ENVIRONMENT=prod
make terraform-apply ENVIRONMENT=prod

# Destroy (careful!)
make terraform-destroy ENVIRONMENT=dev
```

### 🚢 Deployment

```bash
# Development
make deploy-dev

# Staging
make deploy-test

# Production
make deploy-prod IMAGE_TAG=v1.0.0

# Rollback
make rollback ENVIRONMENT=prod
```

### 📊 Monitoring

```bash
# View logs
make logs-dev
make logs-test
make logs-prod

# AWS Console
aws ecs describe-services --cluster sportification-cluster-prod --services sportification-api-prod
```

### 🔧 Common Workflows

#### Deploy New Feature to Dev

```bash
git checkout develop
git pull
git checkout -b feature/my-feature
# ... make changes ...
git commit -m "feat: add my feature"
git push origin feature/my-feature
# Create PR → Merge to develop → Auto-deploys to dev
```

#### Production Release

```bash
git checkout main
git merge develop
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
# Requires approval → Deploys to production
```

#### Hotfix

```bash
git checkout main
git checkout -b hotfix/critical-fix
# ... fix issue ...
git commit -m "fix: critical bug"
git push origin hotfix/critical-fix
# Create PR → Merge → Deploy
```

---

## 📖 Documentation Links

- **[DEVOPS_SETUP.md](DEVOPS_SETUP.md)** - Complete setup guide (1000+ lines)
- **[INFRASTRUCTURE_SUMMARY.md](INFRASTRUCTURE_SUMMARY.md)** - What was created
- **[README.md](README.md)** - Project overview
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Architecture guide

---

## 🆘 Quick Troubleshooting

### App won't start locally

```bash
# Check if ports are in use
lsof -i :3000
lsof -i :27017

# Restart Docker
make docker-down ENVIRONMENT=dev
make docker-up ENVIRONMENT=dev
```

### Deployment failed

```bash
# Check ECS events
aws ecs describe-services --cluster sportification-cluster-prod --services sportification-api-prod

# View logs
make logs-prod

# Rollback
make rollback ENVIRONMENT=prod
```

### Can't connect to database

```bash
# Check if MongoDB is running
docker-compose -f docker-compose.dev.yml ps

# Check connection string in .env
cat .env.development | grep MONGODB_URI
```

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/typhoon1996/sportification-be/issues)
- **Email**: <devops@sportification.com>
- **Slack**: #devops-support

---

**Last Updated**: October 11, 2025
