# =============================================================================
# Setup Script for Windows PowerShell
# =============================================================================
# Quick setup script for Windows developers
# Run with: .\scripts\development\setup.ps1
# =============================================================================

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "`n========================================" "Cyan"
Write-ColorOutput "  Sportification Backend Setup" "Cyan"
Write-ColorOutput "========================================`n" "Cyan"

# Check Node.js
Write-ColorOutput "Checking prerequisites..." "Cyan"

try {
    $nodeVersion = node -v
    Write-ColorOutput "✓ Node.js $nodeVersion detected" "Green"
} catch {
    Write-ColorOutput "✗ Node.js is not installed." "Red"
    Write-ColorOutput "  Please install Node.js 18+ from: https://nodejs.org/" "Yellow"
    exit 1
}

# Check npm
try {
    $npmVersion = npm -v
    Write-ColorOutput "✓ npm $npmVersion detected" "Green"
} catch {
    Write-ColorOutput "✗ npm is not installed." "Red"
    exit 1
}

# Extract Node.js major version
$nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($nodeMajor -lt 18) {
    Write-ColorOutput "✗ Node.js version must be >= 18.0.0 (current: $nodeVersion)" "Red"
    exit 1
}

Write-ColorOutput ""

# Install dependencies
Write-ColorOutput "Installing dependencies..." "Cyan"
try {
    npm install
    Write-ColorOutput "✓ Dependencies installed" "Green"
} catch {
    Write-ColorOutput "✗ Failed to install dependencies" "Red"
    exit 1
}

Write-ColorOutput ""

# Create .env file if it doesn't exist
$envPath = Join-Path $PSScriptRoot "../../.env"
$envDevPath = Join-Path $PSScriptRoot "../../.env.development"

if (-not (Test-Path $envPath)) {
    Write-ColorOutput "Setting up environment variables..." "Cyan"
    
    if (Test-Path $envDevPath) {
        Copy-Item $envDevPath $envPath
        Write-ColorOutput "✓ Created .env from .env.development" "Green"
    } else {
        Write-ColorOutput "⚠ .env.development not found. Creating basic .env file..." "Yellow"
        
        $basicEnv = @"
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sportification
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
REDIS_URL=redis://localhost:6379
SESSION_COOKIE_NAME=sportification.sid
SESSION_TTL=3600
SESSION_REDIS_PREFIX=session:
"@
        Set-Content -Path $envPath -Value $basicEnv
        Write-ColorOutput "✓ Created basic .env file" "Green"
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "⚠ IMPORTANT: Update .env with your actual configuration!" "Yellow"
    Write-ColorOutput "  - MongoDB URI" "Yellow"
    Write-ColorOutput "  - JWT secrets (generate secure random strings)" "Yellow"
    Write-ColorOutput "  - Redis URL (optional)" "Yellow"
} else {
    Write-ColorOutput "✓ .env file already exists" "Green"
}

Write-ColorOutput ""

# Build the project
Write-ColorOutput "Building the project..." "Cyan"
try {
    npm run build
    Write-ColorOutput "✓ Build completed" "Green"
} catch {
    Write-ColorOutput "✗ Build failed" "Red"
    exit 1
}

Write-ColorOutput ""

# Run linter
Write-ColorOutput "Running code quality checks..." "Cyan"
try {
    npm run lint
    Write-ColorOutput "✓ Linting passed" "Green"
} catch {
    Write-ColorOutput "⚠ Linting issues found (non-critical)" "Yellow"
}

Write-ColorOutput ""

# Success message
Write-ColorOutput "========================================" "Green"
Write-ColorOutput "  ✓ Setup completed successfully!" "Green"
Write-ColorOutput "========================================`n" "Green"

Write-ColorOutput "Next steps:" "Cyan"
Write-ColorOutput "  1. Ensure MongoDB is running (default: localhost:27017)"
Write-ColorOutput "  2. [Optional] Start Redis for caching (default: localhost:6379)"
Write-ColorOutput "  3. Update .env file with your configuration"
Write-ColorOutput "  4. Start development server: npm run dev"
Write-ColorOutput ""
Write-ColorOutput "Documentation:" "Cyan"
Write-ColorOutput "  - README.md - Project overview and setup"
Write-ColorOutput "  - docs/MULTI_OS_COMPATIBILITY.md - Multi-OS guide"
Write-ColorOutput "  - docs/ONBOARDING.md - Developer onboarding"
Write-ColorOutput ""
Write-ColorOutput "🎉 Happy coding!" "Green"
