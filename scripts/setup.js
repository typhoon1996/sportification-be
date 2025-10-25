#!/usr/bin/env node
/**
 * Setup Script - Cross-Platform
 * 
 * Quick setup script for new developers
 * Works on Windows, macOS, and Linux
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkCommand(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getNodeVersion() {
  const version = process.version.slice(1); // Remove 'v' prefix
  return parseInt(version.split('.')[0]);
}

async function main() {
  log('\n🚀 Sports Companion Backend - Quick Setup', colors.blue);
  log('==========================================\n', colors.blue);

  // Check Node.js version
  log('📋 Checking prerequisites...', colors.blue);
  
  const nodeVersion = getNodeVersion();
  if (nodeVersion < 18) {
    log(`❌ Node.js version must be >= 18.0.0 (current: ${process.version})`, colors.red);
    process.exit(1);
  }
  log(`✅ Node.js ${process.version} detected`, colors.green);

  // Check npm
  if (!checkCommand('npm')) {
    log('❌ npm is not installed', colors.red);
    process.exit(1);
  }
  const npmVersion = execSync('npm -v', { encoding: 'utf8' }).trim();
  log(`✅ npm ${npmVersion} detected`, colors.green);

  // Install dependencies
  log('\n📦 Installing dependencies...', colors.blue);
  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (error) {
    log('❌ Failed to install dependencies', colors.red);
    process.exit(1);
  }

  // Create .env file if it doesn't exist
  const envPath = path.join(process.cwd(), '.env');
  const envDevPath = path.join(process.cwd(), '.env.development');
  
  if (!fs.existsSync(envPath)) {
    log('\n⚙️  Setting up environment variables...', colors.blue);
    
    if (fs.existsSync(envDevPath)) {
      fs.copyFileSync(envDevPath, envPath);
      log('✅ Created .env from .env.development', colors.green);
    } else {
      log('⚠️  .env.development not found. Creating basic .env file...', colors.yellow);
      
      const basicEnv = `NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sportification
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
REDIS_URL=redis://localhost:6379
SESSION_COOKIE_NAME=sportification.sid
SESSION_TTL=3600
SESSION_REDIS_PREFIX=session:
`;
      fs.writeFileSync(envPath, basicEnv);
      log('✅ Created basic .env file', colors.green);
    }
    
    log('\n⚠️  IMPORTANT: Update .env with your actual configuration!', colors.yellow);
    log('   - MongoDB URI', colors.yellow);
    log('   - JWT secrets (generate secure random strings)', colors.yellow);
    log('   - Redis URL (optional)', colors.yellow);
  } else {
    log('✅ .env file already exists', colors.green);
  }

  // Build the project
  log('\n🔨 Building the project...', colors.blue);
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    log('❌ Build failed', colors.red);
    process.exit(1);
  }

  // Run linter
  log('\n🔍 Running code quality checks...', colors.blue);
  try {
    execSync('npm run lint', { stdio: 'inherit' });
  } catch (error) {
    log('⚠️  Linting issues found (non-critical)', colors.yellow);
  }

  // Success message
  log('\n✅ Setup completed successfully!', colors.green);
  log('\n📚 Next steps:', colors.blue);
  log('   1. Ensure MongoDB is running (default: localhost:27017)');
  log('   2. [Optional] Start Redis for caching (default: localhost:6379)');
  log('   3. Update .env file with your configuration');
  log('   4. Start development server: npm run dev');
  log('\n📖 Documentation:', colors.blue);
  log('   - README.md - Project overview and setup');
  log('   - ONBOARDING.md - Developer onboarding guide');
  log('   - CONTRIBUTING.md - Contribution guidelines');
  log('\n🎉 Happy coding!', colors.green);
}

main().catch((error) => {
  log(`\n❌ Setup failed: ${error.message}`, colors.red);
  process.exit(1);
});
