# Infrastructure

Low-level infrastructure utilities and connections.

## Subdirectories

- **cache/** - Caching implementations (Redis, Memory)
- **database/** - Database connections and query builders
- **logging/** - Logging configuration and transports
- **storage/** - File storage and data export

## Usage

```typescript
import { CacheManager } from '@/shared/infrastructure/cache';
import logger from '@/shared/infrastructure/logging';
```

## Guidelines

- Infrastructure should be technology-focused
- Provides abstractions over external systems
- Should be reusable across services
