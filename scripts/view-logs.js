#!/usr/bin/env node
/**
 * Log Viewer - Cross-Platform
 * 
 * Tails log files with cross-platform support
 * Usage: node scripts/view-logs.js [app|error]
 */

const fs = require('fs');
const path = require('path');

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

function tailFile(filePath, lines = 50) {
  if (!fs.existsSync(filePath)) {
    log(`❌ Log file not found: ${filePath}`, colors.red);
    log(`ℹ️  The file will be created when the application starts`, colors.blue);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const allLines = content.split('\n');
  const lastLines = allLines.slice(-lines);

  lastLines.forEach(line => {
    if (line.includes('error') || line.includes('ERROR')) {
      log(line, colors.red);
    } else if (line.includes('warn') || line.includes('WARN')) {
      log(line, colors.yellow);
    } else if (line.includes('info') || line.includes('INFO')) {
      log(line, colors.green);
    } else {
      log(line);
    }
  });

  // Watch for changes
  log(`\n📖 Watching ${path.basename(filePath)} for changes... (Ctrl+C to stop)\n`, colors.blue);

  let lastSize = fs.statSync(filePath).size;

  const watcher = fs.watch(filePath, (eventType) => {
    if (eventType === 'change') {
      const currentSize = fs.statSync(filePath).size;
      if (currentSize > lastSize) {
        const stream = fs.createReadStream(filePath, {
          start: lastSize,
          encoding: 'utf8'
        });

        stream.on('data', (chunk) => {
          const newLines = chunk.split('\n');
          newLines.forEach(line => {
            if (line.trim()) {
              if (line.includes('error') || line.includes('ERROR')) {
                log(line, colors.red);
              } else if (line.includes('warn') || line.includes('WARN')) {
                log(line, colors.yellow);
              } else if (line.includes('info') || line.includes('INFO')) {
                log(line, colors.green);
              } else {
                log(line);
              }
            }
          });
        });

        lastSize = currentSize;
      }
    }
  });

  // Handle cleanup
  process.on('SIGINT', () => {
    watcher.close();
    log('\n\n👋 Stopped watching logs', colors.blue);
    process.exit(0);
  });
}

function main() {
  const logType = process.argv[2] || 'app';
  const logsDir = path.join(process.cwd(), 'logs');

  // Ensure logs directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    log('📁 Created logs directory', colors.blue);
  }

  const logFiles = {
    app: path.join(logsDir, 'app.log'),
    error: path.join(logsDir, 'error.log'),
  };

  if (!logFiles[logType]) {
    log(`❌ Unknown log type: ${logType}`, colors.red);
    log('Available types: app, error', colors.yellow);
    process.exit(1);
  }

  log(`📖 Viewing ${logType} logs...\n`, colors.blue);
  tailFile(logFiles[logType]);
}

main();
