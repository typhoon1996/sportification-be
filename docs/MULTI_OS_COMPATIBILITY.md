# Multi-OS Compatibility Guide

This project is designed to work seamlessly on **Windows**, **macOS**, and **Linux**.

## Quick Start by Operating System

### 🪟 Windows

1. **Prerequisites:**
   - Node.js 18+ ([Download](https://nodejs.org/))
   - npm (comes with Node.js)
   - Git for Windows ([Download](https://git-scm-windows.github.io/))
   - Docker Desktop (optional) ([Download](https://www.docker.com/products/docker-desktop))

2. **Setup:**
   ```powershell
   # Clone the repository
   git clone https://github.com/SlenderShield/sportification-be.git
   cd sportification-be

   # Install dependencies
   npm install

   # Setup environment (interactive)
   npm run setup:env

   # Build the project
   npm run build

   # Start development server
   npm run dev
   ```

3. **Windows-Specific Notes:**
   - Use PowerShell or Command Prompt (CMD)
   - Git Bash is also supported for Unix-like commands
   - MongoDB and Redis can be run via Docker Desktop or WSL2
   - Shell scripts (.sh) won't run natively - use npm scripts instead

### 🍎 macOS

1. **Prerequisites:**
   - Node.js 18+ ([Download](https://nodejs.org/) or use `brew install node`)
   - npm (comes with Node.js)
   - Git (pre-installed or `brew install git`)
   - Docker Desktop (optional) ([Download](https://www.docker.com/products/docker-desktop))

2. **Setup:**
   ```bash
   # Clone the repository
   git clone https://github.com/SlenderShield/sportification-be.git
   cd sportification-be

   # Install dependencies
   npm install

   # Setup environment (interactive)
   npm run setup:env

   # Build the project
   npm run build

   # Start development server
   npm run dev
   ```

3. **macOS-Specific Notes:**
   - Both bash and zsh shells are supported
   - Shell scripts have execute permissions set automatically
   - Use Homebrew for installing MongoDB/Redis: `brew install mongodb-community redis`
   - Alternatively, use Docker Desktop

### 🐧 Linux

1. **Prerequisites:**
   - Node.js 18+ ([Instructions](https://nodejs.org/))
   - npm (comes with Node.js)
   - Git (`sudo apt install git` or equivalent)
   - Docker (optional) ([Instructions](https://docs.docker.com/engine/install/))

2. **Setup:**
   ```bash
   # Clone the repository
   git clone https://github.com/SlenderShield/sportification-be.git
   cd sportification-be

   # Install dependencies
   npm install

   # Setup environment (interactive)
   npm run setup:env

   # Build the project
   npm run build

   # Start development server
   npm run dev
   ```

3. **Linux-Specific Notes:**
   - Shell scripts work natively
   - Use your distribution's package manager for MongoDB/Redis
   - Docker and docker-compose should be installed separately

## Cross-Platform npm Scripts

All development tasks can be performed using npm scripts, which work identically on all platforms:

### Development
```bash
npm run dev              # Start development server with hot-reload
npm run dev:debug        # Start with debugger attached
npm run build            # Build TypeScript to JavaScript
npm run clean            # Remove build artifacts
```

### Testing
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
```

### Code Quality
```bash
npm run lint             # Check code with ESLint
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changes
npm run typecheck        # TypeScript type checking
npm run validate         # Run all checks (lint + format + typecheck)
```

### Database
```bash
npm run migrate          # Run database migrations
npm run migrate:dev      # Run migrations (development)
npm run seed             # Seed database with test data
npm run seed:dev         # Seed database (development)
npm run db:setup         # Migrate and seed (development)
```

### Docker
```bash
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
npm run docker:run:dev   # Run with volume mounts for development
npm run docker:compose:up        # Start all services
npm run docker:compose:down      # Stop all services
```

### Utilities
```bash
npm run logs             # View application logs (live)
npm run logs:error       # View error logs (live)
npm run health           # Check API health
npm run docs             # Open API documentation in browser
npm run setup:env        # Interactive environment setup
```

## Path Handling

The codebase uses Node.js `path` module for cross-platform path handling:

```javascript
// ✅ Good - Cross-platform
const path = require('path');
const filePath = path.join(__dirname, 'logs', 'app.log');
const configPath = path.resolve(process.cwd(), 'config', 'database.ts');

// ❌ Bad - Unix-only
const filePath = __dirname + '/logs/app.log';
const configPath = process.cwd() + '/config/database.ts';
```

All file operations in the codebase follow this pattern, ensuring compatibility across operating systems.

## Environment Variables

Environment variables are set using `cross-env`, which works on all platforms:

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development nodemon"
  }
}
```

This replaces the Unix-specific `NODE_ENV=development` syntax that doesn't work on Windows.

## File Permissions

On Unix-like systems (Linux, macOS), shell scripts need execute permissions. The project includes a script that automatically handles this:

```bash
npm run setup  # Includes making scripts executable
```

On Windows, execute permissions are not applicable, so this is a no-op.

## Line Endings

The project uses Git's automatic line ending handling:

- **Windows:** Files are converted to CRLF (`\r\n`) on checkout
- **Unix/Mac:** Files use LF (`\n`)

This is configured in `.gitattributes`:

```gitattributes
* text=auto
*.sh text eol=lf
*.bat text eol=crlf
```

## Shell Scripts

### For Unix Users (Linux/macOS)

Shell scripts in `scripts/` directory can be run directly:

```bash
./scripts/development/setup.sh
./scripts/deployment/deploy.sh dev
```

Or via npm scripts:

```bash
npm run setup:env
npm run deploy:dev
```

### For Windows Users

Use npm scripts exclusively, which internally use Node.js equivalents:

```powershell
npm run setup:env
npm run deploy:dev
```

The Node.js scripts provide identical functionality to the shell scripts.

## Docker on Different Platforms

### Linux

Docker runs natively with excellent performance:

```bash
docker --version
docker-compose --version
npm run docker:compose:up
```

### macOS

Docker Desktop provides a native macOS experience:

1. Install Docker Desktop
2. Start Docker Desktop from Applications
3. Run: `npm run docker:compose:up`

### Windows

Docker Desktop with WSL2 backend (recommended):

1. Install WSL2: `wsl --install`
2. Install Docker Desktop with WSL2 backend
3. Run in PowerShell or CMD: `npm run docker:compose:up`

**Note:** On Windows, Docker volume mounts (`-v`) may have path format differences. The npm scripts handle this automatically.

## MongoDB and Redis Setup

### Using Docker (Recommended - All Platforms)

```bash
npm run docker:compose:up
```

This starts MongoDB and Redis in containers.

### Native Installation

#### Windows
- MongoDB: [Download MSI installer](https://www.mongodb.com/try/download/community)
- Redis: [Use Memurai](https://www.memurai.com/) or [WSL2](https://docs.microsoft.com/en-us/windows/wsl/)

#### macOS
```bash
brew install mongodb-community redis
brew services start mongodb-community
brew services start redis
```

#### Linux (Ubuntu/Debian)
```bash
# MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod

# Redis
sudo apt install redis-server
sudo systemctl start redis-server
```

## CI/CD Considerations

The GitHub Actions workflows are configured to run on Ubuntu runners. For comprehensive testing:

- Unit tests run on multiple Node.js versions (18, 20)
- Integration tests use MongoDB and Redis service containers
- Docker builds are tested on Linux

Future enhancements could include:
- Windows Server runners for Windows-specific testing
- macOS runners for platform-specific validation

## Troubleshooting

### Windows: "scripts cannot be loaded because running scripts is disabled"

If you get a PowerShell execution policy error:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### macOS: "command not found" for shell scripts

Make scripts executable:

```bash
npm run setup
```

Or manually:

```bash
chmod +x scripts/**/*.sh
```

### All Platforms: "Cannot find module"

Reinstall dependencies:

```bash
rm -rf node_modules package-lock.json  # or: rimraf node_modules package-lock.json
npm install
```

### Docker: Volume mount issues on Windows

Use named volumes instead of bind mounts, or ensure paths are formatted correctly:

```powershell
# Use ${PWD} (works in PowerShell)
docker run -v ${PWD}/src:/app/src myimage

# Or use full path
docker run -v C:/Users/username/project/src:/app/src myimage
```

## Best Practices for Contributors

When contributing code:

1. ✅ **Use `path.join()` and `path.resolve()`** for all file paths
2. ✅ **Use `cross-env`** for setting environment variables in scripts
3. ✅ **Test on your platform** before submitting PRs
4. ✅ **Use npm scripts** instead of direct shell commands in documentation
5. ✅ **Avoid platform-specific commands** in code (e.g., `cmd.exe`, `bash` specific features)

## Getting Help

- 📖 **Documentation:** Check `docs/` directory
- 💬 **Issues:** [GitHub Issues](https://github.com/SlenderShield/sportification-be/issues)
- 📧 **Email:** team@sportification.com

## Summary

✅ **All core functionality works on Windows, macOS, and Linux**
✅ **Use npm scripts for all tasks - they're cross-platform**
✅ **Docker provides consistent experience across platforms**
✅ **Path handling is OS-agnostic using Node.js `path` module**
✅ **Environment variables work everywhere with `cross-env`**

Happy coding on your favorite platform! 🚀
