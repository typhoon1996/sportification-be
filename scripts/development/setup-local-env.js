#!/usr/bin/env node
/**
 * Local Environment Setup Script - Cross-Platform
 * 
 * This script helps set up your local development environment
 * by creating personalized .env files with secure secrets.
 * Works on Windows, macOS, and Linux
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const readline = require('readline');

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

function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

function checkCommand(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function main() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('  🏃 Sportification Backend - Local Environment Setup', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);

  // Check prerequisites
  log('ℹ️  Checking prerequisites...', colors.blue);

  if (!checkCommand('node')) {
    log('❌ Node.js is not installed. Please install Node.js 18+ first.', colors.red);
    process.exit(1);
  }

  if (!checkCommand('npm')) {
    log('❌ npm is not installed. Please install npm first.', colors.red);
    process.exit(1);
  }

  log('✅ Prerequisites check passed\n', colors.green);

  // Determine environment
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('  📋 Environment Selection', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);
  log('Which environment do you want to set up?');
  log('  1) Development (recommended for local work)');
  log('  2) Test (for running tests locally)\n');

  const envChoice = await askQuestion('Enter choice [1-2] (default: 1): ');

  let envName, envFile, baseFile;
  if (envChoice === '2') {
    envName = 'test';
    envFile = '.env.test.local';
    baseFile = '.env.test';
  } else {
    envName = 'development';
    envFile = '.env.development.local';
    baseFile = '.env.development';
  }

  log(`✅ Selected environment: ${envName}\n`, colors.green);

  // Check if local env file already exists
  const envFilePath = path.join(process.cwd(), envFile);
  const baseFilePath = path.join(process.cwd(), baseFile);

  if (fs.existsSync(envFilePath)) {
    log(`⚠️  Local environment file ${envFile} already exists`, colors.yellow);
    const overwrite = await askQuestion('Do you want to overwrite it? (y/N): ');
    if (!overwrite.toLowerCase().startsWith('y')) {
      log(`ℹ️  Setup cancelled. Your existing ${envFile} was not modified.`, colors.blue);
      process.exit(0);
    }
  }

  // Check if base env file exists
  if (!fs.existsSync(baseFilePath)) {
    log(`❌ Base environment file ${baseFile} not found`, colors.red);
    log('ℹ️  Please ensure you\'re running this script from the project root', colors.blue);
    process.exit(1);
  }

  // Generate secrets
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('  🔐 Generating Secure Secrets', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);

  const jwtSecret = generateSecret();
  const jwtRefreshSecret = generateSecret();
  const sessionSecret = generateSecret();

  log('✅ Generated JWT_SECRET', colors.green);
  log('✅ Generated JWT_REFRESH_SECRET', colors.green);
  log('✅ Generated SESSION_SECRET', colors.green);

  // Copy base file and update secrets
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('  📝 Creating Local Configuration', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);

  let content = fs.readFileSync(baseFilePath, 'utf8');
  content = content.replace(/JWT_SECRET=.*/g, `JWT_SECRET=${jwtSecret}`);
  content = content.replace(/JWT_REFRESH_SECRET=.*/g, `JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
  content = content.replace(/SESSION_SECRET=.*/g, `SESSION_SECRET=${sessionSecret}`);

  fs.writeFileSync(envFilePath, content);
  log(`✅ Created ${envFile} with secure secrets\n`, colors.green);

  // Check for Docker
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('  🐳 Docker Setup', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);

  if (checkCommand('docker') && checkCommand('docker-compose')) {
    log('✅ Docker and Docker Compose are installed\n', colors.green);

    const startDocker = await askQuestion('Start MongoDB and Redis with Docker? (Y/n): ');
    if (!startDocker.toLowerCase().startsWith('n')) {
      log('ℹ️  Starting MongoDB and Redis...', colors.blue);
      try {
        const dockerComposePath = path.join('config', 'docker', 'docker-compose.dev.yml');
        if (fs.existsSync(dockerComposePath)) {
          execSync(`docker-compose -f ${dockerComposePath} up -d mongodb redis`, { stdio: 'inherit' });
          log('✅ Services started', colors.green);
        } else if (fs.existsSync('docker-compose.dev.yml')) {
          execSync('docker-compose -f docker-compose.dev.yml up -d mongodb redis', { stdio: 'inherit' });
          log('✅ Services started', colors.green);
        } else {
          log('⚠️  docker-compose.dev.yml not found', colors.yellow);
        }
      } catch (error) {
        log('⚠️  Failed to start Docker services', colors.yellow);
      }
    }
  } else {
    log('⚠️  Docker is not installed', colors.yellow);
    log('ℹ️  You\'ll need to install and run MongoDB and Redis manually', colors.blue);
    log('ℹ️  Or install Docker: https://docs.docker.com/get-docker/', colors.blue);
  }

  // Install dependencies
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('  📦 Installing Dependencies', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);

  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log('ℹ️  Installing npm packages...', colors.blue);
    execSync('npm install', { stdio: 'inherit' });
    log('✅ Dependencies installed', colors.green);
  } else {
    log('✅ Dependencies already installed', colors.green);
  }

  // Summary
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('  ✅ Setup Complete!', colors.green);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.blue);

  log('Your local environment has been configured:\n');
  log(`  📄 Environment file: ${envFile}`);
  log('  🔐 Secure secrets: Generated');
  log('  🗄️  MongoDB: Ready to start');
  log('  💾 Redis: Ready to start\n');
  log('Next steps:\n');
  log(`  1. Review your configuration:`);
  log(`     ${colors.green}cat ${envFile}${colors.reset}\n`);
  log(`  2. Start the development server:`);
  log(`     ${colors.green}npm run dev${colors.reset}\n`);
  log(`  3. Visit the API:`);
  log(`     ${colors.blue}http://localhost:3000/health${colors.reset}`);
  log(`     ${colors.blue}http://localhost:3000/api/v1/docs${colors.reset} (API documentation)\n`);
  log(`  4. View logs:`);
  log(`     ${colors.green}npm run logs${colors.reset}\n`);

  if (envName === 'development') {
    log(`  5. Optional: Use Docker for full stack:`);
    log(`     ${colors.green}docker-compose -f config/docker/docker-compose.dev.yml up${colors.reset}\n`);
  }

  log(`ℹ️  For more information, see docs/ENVIRONMENT_CONFIGURATION.md`, colors.blue);
  log('✅ Happy coding! 🚀', colors.green);
}

main().catch((error) => {
  log(`\n❌ Setup failed: ${error.message}`, colors.red);
  process.exit(1);
});
