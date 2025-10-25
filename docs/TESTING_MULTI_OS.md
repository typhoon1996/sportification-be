# Multi-OS Testing Guide

This guide explains how to test the Sportification Backend on different operating systems to verify cross-platform compatibility.

## Quick Verification Checklist

Run these commands on **each OS** (Windows, macOS, Linux) to verify compatibility:

```bash
# 1. Clone and setup
git clone https://github.com/SlenderShield/sportification-be.git
cd sportification-be
npm install

# 2. Test build
npm run clean
npm run build

# 3. Test scripts
npm run lint
npm run format:check
npm run typecheck

# 4. Test utilities
node scripts/make-executable.js
node scripts/health-check.js http://example.com

# 5. Test environment setup (interactive)
npm run setup:env
```

## Platform-Specific Testing

### Testing on Windows

**Environment:**
- Windows 10/11
- PowerShell or Command Prompt
- Git Bash (optional, for Unix-like experience)

**Test Commands:**

```powershell
# PowerShell
cd sportification-be
npm install
npm run build
npm test

# Verify cross-env works
npm run dev  # Should set NODE_ENV=development

# Verify rimraf works
npm run clean  # Should remove dist/ coverage/ directories

# Test Windows batch files
.\scripts\development\setup.bat
.\scripts\deployment\deploy.bat dev

# Test Node.js scripts
node scripts\make-executable.js
node scripts\health-check.js
node scripts\view-logs.js app
```

**Expected Behaviors:**
- ✅ All npm scripts work without modification
- ✅ `cross-env` sets environment variables correctly
- ✅ `rimraf` removes directories without errors
- ✅ Batch files (.bat) run successfully
- ✅ Node.js scripts execute without path issues
- ✅ No "command not found" errors for Unix commands
- ⚠️  Shell scripts (.sh) won't run directly - use npm scripts or Git Bash

**Common Issues:**
- **Error: "running scripts is disabled"** - Run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
- **Error: "NODE_ENV is not recognized"** - Ensure `cross-env` is in devDependencies
- **Path separators** - All should use forward slashes or `path.join()`

### Testing on macOS

**Environment:**
- macOS Monterey or later
- Terminal with zsh or bash
- Homebrew (optional, for MongoDB/Redis)

**Test Commands:**

```bash
cd sportification-be
npm install
npm run build
npm test

# Test shell scripts directly
chmod +x scripts/**/*.sh
./scripts/development/setup.sh
./scripts/development/setup-local-env.sh

# Test make-executable script
node scripts/make-executable.js

# Test with Docker
docker-compose -f config/docker/docker-compose.dev.yml up -d
npm run health

# Test logs viewer
npm run logs &
npm run dev
# Let it run for a few seconds
pkill -f "node scripts/view-logs.js"
```

**Expected Behaviors:**
- ✅ All shell scripts execute with proper permissions
- ✅ npm scripts work identically to Linux
- ✅ Docker Desktop integration works seamlessly
- ✅ File paths use forward slashes
- ✅ MongoDB and Redis can be installed via Homebrew or Docker

**Common Issues:**
- **Error: "permission denied"** - Run `npm run setup` to make scripts executable
- **Docker issues** - Ensure Docker Desktop is running
- **MongoDB not found** - Install via `brew install mongodb-community` or use Docker

### Testing on Linux

**Environment:**
- Ubuntu 20.04+ / Debian / Fedora / CentOS
- bash shell
- Docker (optional)

**Test Commands:**

```bash
cd sportification-be
npm install
npm run build
npm test

# Test shell scripts
./scripts/development/setup.sh
./scripts/development/setup-local-env.sh
./scripts/deployment/deploy.sh dev  # (will fail without AWS credentials)

# Test all npm scripts
npm run clean
npm run lint
npm run format
npm run typecheck
npm run validate

# Test with Docker
docker-compose -f config/docker/docker-compose.dev.yml up -d
docker-compose -f config/docker/docker-compose.dev.yml ps

# Test services
npm run health
npm run logs

# Clean up
docker-compose -f config/docker/docker-compose.dev.yml down
```

**Expected Behaviors:**
- ✅ Native environment for shell scripts
- ✅ All scripts work without modification
- ✅ Docker and docker-compose work natively
- ✅ Best overall compatibility (Node.js originated on Unix)

**Common Issues:**
- **Error: "command not found"** - Install missing tools: `sudo apt install <tool>`
- **Permission denied for Docker** - Add user to docker group: `sudo usermod -aG docker $USER`
- **MongoDB/Redis not running** - Start with `sudo systemctl start mongod redis`

## Cross-Platform Integration Tests

### Path Handling Test

Create a test file to verify path operations:

```javascript
// test-paths.js
const path = require('path');
const fs = require('fs');

console.log('Platform:', process.platform);
console.log('Path separator:', path.sep);

// Test path joining
const logPath = path.join('logs', 'app.log');
console.log('Log path:', logPath);

// Test path resolution
const configPath = path.resolve(process.cwd(), 'config', 'database.ts');
console.log('Config path:', configPath);

// Test file operations
const testDir = path.join(process.cwd(), 'test-dir');
fs.mkdirSync(testDir, { recursive: true });
fs.writeFileSync(path.join(testDir, 'test.txt'), 'Hello from ' + process.platform);
const content = fs.readFileSync(path.join(testDir, 'test.txt'), 'utf8');
console.log('File content:', content);
fs.rmSync(testDir, { recursive: true });

console.log('✅ All path operations successful!');
```

Run on each platform:
```bash
node test-paths.js
```

Expected output should show platform-specific path separators but all operations should succeed.

### Environment Variable Test

```bash
# Test cross-env on all platforms
npm run dev:test

# Verify NODE_ENV is set correctly
node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
```

### Script Execution Test

Test that all npm scripts work:

```bash
#!/bin/bash
# test-all-scripts.sh

echo "Testing npm scripts..."

scripts=(
  "clean"
  "build"
  "lint"
  "format:check"
  "typecheck"
)

for script in "${scripts[@]}"; do
  echo "Testing: npm run $script"
  npm run "$script" || echo "Failed: $script"
done

echo "All script tests completed!"
```

## Docker Multi-Platform Testing

Test Docker builds on different architectures:

```bash
# Build for current platform
npm run docker:build

# Build multi-platform (requires buildx)
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 -t sportification-be:multi .

# Test the image
docker run --rm sportification-be:multi node --version
docker run --rm sportification-be:multi npm --version
```

## CI/CD Verification

The GitHub Actions workflow tests on all platforms automatically:

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [18, 20]
```

**Check CI Results:**
1. Push changes to a branch
2. Open pull request
3. Wait for CI to complete
4. Verify all matrix jobs pass:
   - ubuntu-latest + Node 18 ✅
   - ubuntu-latest + Node 20 ✅
   - windows-latest + Node 18 ✅
   - windows-latest + Node 20 ✅
   - macos-latest + Node 18 ✅
   - macos-latest + Node 20 ✅

## Automated Testing Script

Create an automated test runner:

```javascript
// test-multi-os.js
const { execSync } = require('child_process');
const os = require('os');

console.log(`Testing on ${os.platform()} (${os.type()})`);
console.log(`Node.js: ${process.version}`);
console.log(`npm: ${execSync('npm -v', { encoding: 'utf8' }).trim()}`);

const tests = [
  { name: 'Install', cmd: 'npm ci' },
  { name: 'Clean', cmd: 'npm run clean' },
  { name: 'Build', cmd: 'npm run build' },
  { name: 'Lint', cmd: 'npm run lint' },
  { name: 'Format Check', cmd: 'npm run format:check' },
  { name: 'Type Check', cmd: 'npm run typecheck' },
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    console.log(`\n▶️  Running: ${test.name}`);
    execSync(test.cmd, { stdio: 'inherit' });
    console.log(`✅ ${test.name} passed`);
    passed++;
  } catch (error) {
    console.log(`❌ ${test.name} failed`);
    failed++;
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
```

Run with:
```bash
node test-multi-os.js
```

## Manual Verification Checklist

Before releasing, manually verify on each OS:

### Windows
- [ ] `npm install` completes without errors
- [ ] `npm run build` creates `dist/` directory
- [ ] `npm run clean` removes build artifacts
- [ ] `npm run dev` starts server (Ctrl+C to stop)
- [ ] Environment variables work with `cross-env`
- [ ] Batch files execute correctly
- [ ] Docker commands work (if Docker Desktop installed)

### macOS
- [ ] Shell scripts have execute permissions
- [ ] `npm install` completes without errors
- [ ] `npm run build` works
- [ ] Development server starts with `npm run dev`
- [ ] Docker Compose works (if Docker Desktop installed)
- [ ] MongoDB/Redis can connect (local or Docker)

### Linux
- [ ] All shell scripts work natively
- [ ] `npm install` and `npm run build` succeed
- [ ] Docker and docker-compose work without sudo (if configured)
- [ ] All npm scripts execute correctly
- [ ] MongoDB and Redis connect properly

## Reporting Issues

If you find OS-specific issues:

1. **Document the environment:**
   - OS and version
   - Node.js version (`node -v`)
   - npm version (`npm -v`)
   - Shell/terminal used

2. **Provide reproduction steps:**
   ```bash
   git clone ...
   cd sportification-be
   npm install
   npm run <failing-command>
   ```

3. **Include error output:**
   - Full error message
   - Stack trace if available

4. **Open an issue:**
   - Use the bug report template
   - Tag with `platform:windows`, `platform:macos`, or `platform:linux`

## Continuous Monitoring

Set up platform-specific testing in CI:

- **Ubuntu**: Primary development and production platform
- **Windows**: Ensure developer experience for Windows users
- **macOS**: Verify compatibility for macOS developers

All platforms should have **identical functionality** - only implementation details differ (e.g., path separators, shell availability).

## Success Criteria

✅ All npm scripts work on all platforms without modification
✅ No hardcoded path separators (/ or \)
✅ No OS-specific commands in code
✅ Environment variables set correctly on all platforms
✅ Documentation covers platform-specific setup
✅ CI tests pass on Ubuntu, Windows, and macOS
✅ Docker works consistently across platforms

When all criteria are met, the application is truly multi-OS compatible! 🎉
