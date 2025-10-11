#!/bin/bash

# ========================================
# Local Environment Setup Script
# ========================================
# This script helps you set up your local development environment
# by creating personalized .env files with secure secrets.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Generate secure random string
generate_secret() {
    openssl rand -base64 32
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main script
main() {
    print_header "🏃 Sportification Backend - Local Environment Setup"

    # Check prerequisites
    print_info "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command_exists openssl; then
        print_warning "openssl not found. Will use Node.js to generate secrets."
        USE_NODE=true
    fi
    
    print_success "Prerequisites check passed"

    # Determine environment
    print_header "📋 Environment Selection"
    echo "Which environment do you want to set up?"
    echo "  1) Development (recommended for local work)"
    echo "  2) Test (for running tests locally)"
    echo ""
    read -p "Enter choice [1-2] (default: 1): " ENV_CHOICE
    
    case $ENV_CHOICE in
        2)
            ENV_NAME="test"
            ENV_FILE=".env.test.local"
            BASE_FILE=".env.test"
            ;;
        *)
            ENV_NAME="development"
            ENV_FILE=".env.development.local"
            BASE_FILE=".env.development"
            ;;
    esac
    
    print_success "Selected environment: $ENV_NAME"

    # Check if local env file already exists
    if [ -f "$ENV_FILE" ]; then
        print_warning "Local environment file $ENV_FILE already exists"
        read -p "Do you want to overwrite it? (y/N): " OVERWRITE
        if [[ ! $OVERWRITE =~ ^[Yy]$ ]]; then
            print_info "Setup cancelled. Your existing $ENV_FILE was not modified."
            exit 0
        fi
    fi

    # Check if base env file exists
    if [ ! -f "$BASE_FILE" ]; then
        print_error "Base environment file $BASE_FILE not found"
        print_info "Please ensure you're running this script from the project root"
        exit 1
    fi

    # Generate secrets
    print_header "🔐 Generating Secure Secrets"
    
    if [ "$USE_NODE" = true ]; then
        JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
        JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
        SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    else
        JWT_SECRET=$(generate_secret)
        JWT_REFRESH_SECRET=$(generate_secret)
        SESSION_SECRET=$(generate_secret)
    fi
    
    print_success "Generated JWT_SECRET"
    print_success "Generated JWT_REFRESH_SECRET"
    print_success "Generated SESSION_SECRET"

    # Copy base file and update secrets
    print_header "📝 Creating Local Configuration"
    
    cp "$BASE_FILE" "$ENV_FILE"
    
    # Update secrets in the local file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"
        sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" "$ENV_FILE"
        sed -i '' "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"
        sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" "$ENV_FILE"
        sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" "$ENV_FILE"
    fi
    
    print_success "Created $ENV_FILE with secure secrets"

    # Prompt for optional services
    print_header "🔧 Optional Services Configuration"
    
    print_info "Do you want to configure optional services?"
    echo "  - Email (for sending notifications)"
    echo "  - OAuth (Google, GitHub, Facebook login)"
    echo "  - AWS (for production features)"
    echo ""
    read -p "Configure optional services? (y/N): " CONFIG_OPTIONAL
    
    if [[ $CONFIG_OPTIONAL =~ ^[Yy]$ ]]; then
        # Email configuration
        echo ""
        read -p "Configure email service? (y/N): " CONFIG_EMAIL
        if [[ $CONFIG_EMAIL =~ ^[Yy]$ ]]; then
            read -p "Email service (gmail/outlook/other): " EMAIL_SERVICE
            read -p "Email address: " EMAIL_USER
            read -sp "Email password/app password: " EMAIL_PASS
            echo ""
            
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|EMAIL_SERVICE=.*|EMAIL_SERVICE=$EMAIL_SERVICE|" "$ENV_FILE"
                sed -i '' "s|EMAIL_USER=.*|EMAIL_USER=$EMAIL_USER|" "$ENV_FILE"
                sed -i '' "s|EMAIL_PASS=.*|EMAIL_PASS=$EMAIL_PASS|" "$ENV_FILE"
            else
                sed -i "s|EMAIL_SERVICE=.*|EMAIL_SERVICE=$EMAIL_SERVICE|" "$ENV_FILE"
                sed -i "s|EMAIL_USER=.*|EMAIL_USER=$EMAIL_USER|" "$ENV_FILE"
                sed -i "s|EMAIL_PASS=.*|EMAIL_PASS=$EMAIL_PASS|" "$ENV_FILE"
            fi
            
            print_success "Email configuration saved"
        fi
        
        # OAuth configuration
        echo ""
        read -p "Configure OAuth providers? (y/N): " CONFIG_OAUTH
        if [[ $CONFIG_OAUTH =~ ^[Yy]$ ]]; then
            print_info "You'll need to create OAuth apps in the provider consoles:"
            print_info "  Google: https://console.cloud.google.com/apis/credentials"
            print_info "  GitHub: https://github.com/settings/developers"
            print_info "  Facebook: https://developers.facebook.com/apps/"
            echo ""
            read -p "Press Enter to continue..."
            
            # Add OAuth configuration instructions
            print_info "Skipping OAuth for now. Update $ENV_FILE manually with your credentials."
        fi
    fi

    # Docker setup
    print_header "🐳 Docker Setup"
    
    if command_exists docker && command_exists docker-compose; then
        print_success "Docker and Docker Compose are installed"
        
        read -p "Start MongoDB and Redis with Docker? (Y/n): " START_DOCKER
        if [[ ! $START_DOCKER =~ ^[Nn]$ ]]; then
            print_info "Starting MongoDB and Redis..."
            docker-compose -f docker-compose.dev.yml up -d mongodb redis
            
            # Wait for services to be ready
            sleep 3
            
            if docker-compose -f docker-compose.dev.yml ps | grep -q "mongodb.*Up"; then
                print_success "MongoDB is running"
            else
                print_warning "MongoDB may not be running. Check 'docker-compose logs mongodb'"
            fi
            
            if docker-compose -f docker-compose.dev.yml ps | grep -q "redis.*Up"; then
                print_success "Redis is running"
            else
                print_warning "Redis may not be running. Check 'docker-compose logs redis'"
            fi
        fi
    else
        print_warning "Docker is not installed"
        print_info "You'll need to install and run MongoDB and Redis manually"
        print_info "Or install Docker: https://docs.docker.com/get-docker/"
    fi

    # Install dependencies
    print_header "📦 Installing Dependencies"
    
    if [ ! -d "node_modules" ]; then
        print_info "Installing npm packages..."
        npm install
        print_success "Dependencies installed"
    else
        print_success "Dependencies already installed"
    fi

    # Summary
    print_header "✅ Setup Complete!"
    
    echo "Your local environment has been configured:"
    echo ""
    echo "  📄 Environment file: $ENV_FILE"
    echo "  🔐 Secure secrets: Generated"
    echo "  🗄️  MongoDB: ${MONGODB_STATUS:-Ready to start}"
    echo "  💾 Redis: ${REDIS_STATUS:-Ready to start}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. Review your configuration:"
    echo "     ${GREEN}cat $ENV_FILE${NC}"
    echo ""
    echo "  2. Start the development server:"
    echo "     ${GREEN}npm run dev${NC}"
    echo ""
    echo "  3. Visit the API:"
    echo "     ${BLUE}http://localhost:3000/health${NC}"
    echo "     ${BLUE}http://localhost:3000/api/v1/docs${NC} (API documentation)"
    echo ""
    echo "  4. View logs:"
    echo "     ${GREEN}tail -f logs/app.log${NC}"
    echo ""
    
    if [ "$ENV_NAME" = "development" ]; then
        echo "  5. Optional: Use Docker for full stack:"
        echo "     ${GREEN}docker-compose -f docker-compose.dev.yml up${NC}"
        echo ""
    fi
    
    print_info "For more information, see docs/ENVIRONMENT_CONFIGURATION.md"
    print_success "Happy coding! 🚀"
}

# Run main function
main
