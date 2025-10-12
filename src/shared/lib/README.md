# Lib (Core Utilities)

Reusable, pure utility functions and helpers.

## Subdirectories

- **auth/** - Authentication utilities (JWT, tokens)
- **validation/** - Validation functions and schemas
- **security/** - Security utilities (encryption, sanitization)
- **pagination/** - Pagination helpers
- **webhooks/** - Webhook management

## Usage

```typescript
import { generateToken } from '@/shared/lib/auth';
import { paginate } from '@/shared/lib/pagination';
```

## Guidelines

- Functions should be pure when possible
- No side effects (logging, DB calls) in core utilities
- Keep utilities small and focused
