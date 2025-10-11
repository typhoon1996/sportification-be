# ⚙️ Configuration Directory

This directory contains all configuration files for the Sportification Backend application.

## 📁 Directory Structure

```
config/
├── docker/                    # Docker and Docker Compose configurations
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── docker-compose.test.yml
│   └── docker-compose.prod.yml
│
├── environments/              # Environment-specific configurations
│   ├── .env.example
│   ├── .env.development
│   ├── .env.test
│   └── .env.production
│
├── nginx/                     # Nginx web server configuration
│   ├── nginx.conf
│   └── ssl/
│
├── redis/                     # Redis cache configuration
│   └── redis.conf
│
├── monitoring/                # Monitoring and observability
│   └── prometheus.yml
│
├── jest.config.js             # Jest testing configuration
├── tsconfig.json              # TypeScript compiler configuration
└── openapi.yaml               # OpenAPI/Swagger specification
```

## 🔧 Configuration Files

### Docker Configuration (`docker/`)

- **Dockerfile**: Multi-stage Docker build configuration
- **docker-compose.yml**: Base compose configuration
- **docker-compose.dev.yml**: Development environment
- **docker-compose.test.yml**: Testing environment
- **docker-compose.prod.yml**: Production environment

**Usage:**

```bash
# Development
docker-compose -f config/docker/docker-compose.dev.yml up

# Production
docker-compose -f config/docker/docker-compose.prod.yml up -d
```

### Environment Configuration (`environments/`)

Environment variables for different deployment environments.

- **`.env.example`**: Template with all available variables
- **`.env.development`**: Development environment settings
- **`.env.test`**: Testing environment settings
- **`.env.production`**: Production environment settings

**Note:** The active `.env` file should be in the project root and is gitignored.

### Service Configuration

- **`nginx/`**: Reverse proxy and load balancing configuration
- **`redis/`**: Cache server configuration
- **`monitoring/`**: Prometheus metrics collection

### Build Configuration

- **`jest.config.js`**: Jest test runner configuration
- **`tsconfig.json`**: TypeScript compiler options
- **`openapi.yaml`**: API specification (Swagger/OpenAPI 3.0)

## 🚀 Quick Start

1. **Copy environment template:**

   ```bash
   cp config/environments/.env.example .env
   ```

2. **Edit environment variables:**

   ```bash
   nano .env
   ```

3. **Start with Docker:**

   ```bash
   docker-compose -f config/docker/docker-compose.dev.yml up
   ```

## 📚 Related Documentation

- [Environment Configuration Guide](../docs/ENVIRONMENT_CONFIGURATION.md)
- [Docker Guide](../docs/deployment/DOCKER.md)
- [Deployment Checklist](../docs/deployment/DEPLOYMENT_CHECKLIST.md)

---

**Last Updated:** October 11, 2025
