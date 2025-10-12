# Services

High-level application services with complex business logic.

## Subdirectories

- **email/** - Email service with templates
- **ml/** - Machine learning and prediction services  
- **analytics/** - Analytics tracking and reporting
- **audit/** - Audit logging service

## Usage

```typescript
import { emailService } from '@/shared/services/email';
import { MLService } from '@/shared/services/ml';
```

## Guidelines

- Services should orchestrate multiple operations
- Services can depend on infrastructure and lib utilities
- Keep services focused on business logic, not technical concerns
