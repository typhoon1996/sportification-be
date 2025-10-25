# 📜 Automation Scripts

This directory contains automation scripts for development, deployment, and database operations.

## 📁 Directory Structure

```
scripts/
├── development/               # Development and setup scripts
│   ├── setup-local-env.sh    # Local environment setup (Unix)
│   ├── setup-local-env.js    # Local environment setup (Cross-platform)
│   ├── setup.sh              # Initial project setup (Unix)
│   ├── setup.bat             # Initial project setup (Windows Batch)
│   ├── setup.ps1             # Initial project setup (Windows PowerShell)
│   └── health-check.sh       # Health check script (Unix)
│
├── deployment/                # Deployment automation
│   ├── deploy.sh             # Deployment script (Unix)
│   ├── deploy.bat            # Deployment wrapper (Windows)
│   └── aws-setup.sh          # AWS infrastructure setup (Unix)
│
├── database/                  # Database scripts
│   └── mongo-init.js         # MongoDB initialization
│
├── make-executable.js         # Cross-platform script permissions
├── health-check.js           # Cross-platform health checker
├── view-logs.js              # Cross-platform log viewer
└── setup.js                  # Cross-platform project setup
```

## 🚀 Development Scripts

### `development/setup-local-env.sh`

Sets up local development environment including:

- Creating `.env` file from template
- Installing dependencies
- Setting up Git hooks
- Verifying prerequisites

**Usage:**

```bash
./scripts/development/setup-local-env.sh
```

### `development/setup.sh`

Initial project setup script for new developers.

**Usage:**

```bash
./scripts/development/setup.sh
```

### `development/health-check.sh`

Checks the health of running services.

**Usage:**

```bash
./scripts/development/health-check.sh
```

## 🚢 Deployment Scripts

### `deployment/deploy.sh`

Automated deployment script supporting multiple environments.

**Usage:**

```bash
# Deploy to development
./scripts/deployment/deploy.sh dev

# Deploy to production
./scripts/deployment/deploy.sh prod
```

**Environments:**

- `dev` - Development environment
- `test` - Testing environment
- `prod` - Production environment

### `deployment/aws-setup.sh`

Sets up AWS infrastructure using Terraform.

**Usage:**

```bash
./scripts/deployment/aws-setup.sh
```

## 💾 Database Scripts

### `database/mongo-init.js`

MongoDB initialization script that:

- Creates databases
- Sets up users and permissions
- Creates initial collections
- Adds indexes

**Usage:**

```bash
# Run directly with MongoDB
mongo < scripts/database/mongo-init.js

# Or via Docker
docker-compose exec mongodb mongo /scripts/mongo-init.js
```

## 🔧 Script Permissions

### Unix/Linux/macOS

Scripts need execute permissions on Unix-like systems:

```bash
# Using npm script (recommended - works on all platforms)
npm run setup

# Or manually with Node.js
node scripts/make-executable.js

# Or traditional Unix command
chmod +x scripts/**/*.sh
```

### Windows

Execute permissions don't apply on Windows. Use one of these methods:

```powershell
# PowerShell script
.\scripts\development\setup.ps1

# Batch file
.\scripts\development\setup.bat

# Or npm scripts (works everywhere)
npm run setup:env
```

**Note:** For cross-platform compatibility, prefer using npm scripts which work identically on all operating systems.

## 📝 Script Conventions

### Naming

- Use kebab-case: `setup-local-env.sh`
- Descriptive names: `deploy.sh` not `d.sh`
- Extension: `.sh` for shell scripts, `.js` for Node scripts

### Structure

All scripts should include:

- Shebang line (`#!/bin/bash` or `#!/usr/bin/env node`)
- Description comment
- Error handling (`set -e`)
- Usage function
- Logging with colors

### Example Template

```bash
#!/bin/bash
set -e

# Script: deploy.sh
# Description: Deploy application to specified environment
# Usage: ./deploy.sh [dev|test|prod]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
usage() {
  echo "Usage: $0 [dev|test|prod]"
  exit 1
}

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Main script logic
# ...
```

## 🔐 Security Notes

- **Never commit secrets**: No API keys, passwords, or tokens in scripts
- **Use environment variables**: Access secrets via `.env` files
- **Validate inputs**: Always validate and sanitize user inputs
- **Audit logs**: Log all deployment actions

## 🧪 Testing Scripts

Test scripts before committing:

```bash
# Test shell scripts syntax
shellcheck scripts/**/*.sh

# Test with dry-run (if supported)
./scripts/deployment/deploy.sh dev --dry-run
```

## 📚 Related Documentation

- [Deployment Guide](../docs/deployment/DEPLOYMENT_CHECKLIST.md)
- [Development Workflow](../docs/guides/DEVELOPMENT.md)
- [Environment Configuration](../docs/ENVIRONMENT_CONFIGURATION.md)

## 🆘 Troubleshooting

### Permission Denied (Unix/Linux/macOS)

```bash
# Use npm script (recommended)
npm run setup

# Or use Node.js script
node scripts/make-executable.js

# Or manually
chmod +x scripts/path/to/script.sh
```

### Scripts Won't Run on Windows

Windows doesn't support `.sh` scripts natively. Use alternatives:

```powershell
# Option 1: Use npm scripts (recommended - works everywhere)
npm run setup:env
npm run health

# Option 2: Use PowerShell scripts
.\scripts\development\setup.ps1

# Option 3: Use Batch files
.\scripts\development\setup.bat

# Option 4: Use Git Bash (if installed)
bash scripts/development/setup.sh
```

### Script Not Found

Ensure you're running from project root:

```bash
cd /path/to/sportification-be
./scripts/development/setup.sh
```

### Environment Variables Missing

Copy and configure environment file:

```bash
cp config/environments/.env.example .env
```

---

**Last Updated:** October 11, 2025
