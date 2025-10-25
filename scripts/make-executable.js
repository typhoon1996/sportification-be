#!/usr/bin/env node
/**
 * Make Shell Scripts Executable (Cross-Platform)
 * 
 * This script makes shell scripts executable on Unix-like systems
 * while being safe to run on Windows (where it's a no-op)
 */

const fs = require('fs');
const path = require('path');

function findShellScripts(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      findShellScripts(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.sh')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function makeExecutable() {
  try {
    const scriptsDir = path.join(process.cwd(), 'scripts');
    
    if (!fs.existsSync(scriptsDir)) {
      console.log('ℹ️  No scripts directory found');
      return;
    }

    // Find all .sh files in scripts directory
    const scriptFiles = findShellScripts(scriptsDir);

    if (scriptFiles.length === 0) {
      console.log('ℹ️  No shell scripts found');
      return;
    }

    // On Windows, this is a no-op since execute permissions don't apply
    if (process.platform === 'win32') {
      console.log('ℹ️  Running on Windows - execute permissions not needed');
      console.log(`   Found ${scriptFiles.length} shell script(s)`);
      return;
    }

    // Make files executable on Unix-like systems
    let count = 0;
    for (const file of scriptFiles) {
      try {
        // Get current permissions
        const stats = fs.statSync(file);
        // Add execute permission (0o111 = --x--x--x)
        const newMode = stats.mode | 0o111;
        fs.chmodSync(file, newMode);
        count++;
        console.log(`✅ Made executable: ${path.relative(process.cwd(), file)}`);
      } catch (err) {
        console.warn(`⚠️  Failed to chmod ${file}:`, err.message);
      }
    }

    console.log(`\n✅ Made ${count} script(s) executable`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

makeExecutable();
