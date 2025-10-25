#!/usr/bin/env node
/**
 * Health Check Script - Cross-Platform
 * 
 * Checks the health of the API endpoints
 * Works on Windows, macOS, and Linux
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEndpoint(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const req = protocol.get(url, (res) => {
      resolve({
        status: res.statusCode,
        success: res.statusCode === 200,
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const healthEndpoint = `${baseUrl}/health`;
  const apiEndpoint = `${baseUrl}/api/v1`;

  log('🏥 Running Health Check', colors.blue);
  log('=======================', colors.blue);
  log(`Base URL: ${baseUrl}\n`);

  let failures = 0;

  // Check health endpoint
  try {
    const result = await checkEndpoint(healthEndpoint);
    if (result.success) {
      log(`✅ Health Check: OK (Status: ${result.status})`, colors.green);
    } else {
      log(`❌ Health Check: FAILED (Status: ${result.status})`, colors.red);
      failures++;
    }
  } catch (error) {
    log(`❌ Health Check: FAILED (${error.message})`, colors.red);
    failures++;
  }

  // Check API endpoint
  try {
    const result = await checkEndpoint(apiEndpoint);
    if (result.success) {
      log(`✅ API Endpoint: OK (Status: ${result.status})`, colors.green);
    } else {
      log(`❌ API Endpoint: FAILED (Status: ${result.status})`, colors.red);
      failures++;
    }
  } catch (error) {
    log(`❌ API Endpoint: FAILED (${error.message})`, colors.red);
    failures++;
  }

  log('');

  if (failures === 0) {
    log('✅ All checks passed', colors.green);
    process.exit(0);
  } else {
    log('❌ Some checks failed', colors.red);
    process.exit(1);
  }
}

main().catch((error) => {
  log(`❌ Error: ${error.message}`, colors.red);
  process.exit(1);
});
