# Integrations

External service integrations and adapters.

## Subdirectories

- **notifications/** - Notification providers (email, push, SMS)
- **batch/** - Batch processing operations

## Usage

```typescript
import { NotificationQueue } from '@/shared/integrations/notifications';
import { BatchProcessor } from '@/shared/integrations/batch';
```

## Guidelines

- Wrap external services for easy swapping
- Provide consistent interfaces
- Handle external failures gracefully
