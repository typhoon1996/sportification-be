/**
 * Backwards Compatibility Layer
 * 
 * Re-exports from new locations to maintain existing imports.
 * TODO: Update all imports to use new locations directly, then remove this file.
 */

// Services
export * from '../services/email';
export * from '../services/ml';
export * from '../services/analytics';
export * from '../services/audit';

// Infrastructure
export * from '../infrastructure/cache';
export * from '../infrastructure/logging';
export * from '../infrastructure/storage';
export * from '../infrastructure/database';

// Lib
export * from '../lib/auth';
export * from '../lib/validation/validator';
export * from '../lib/security';
export * from '../lib/pagination';
export * from '../lib/webhooks';

// Integrations
export * from '../integrations/notifications';
export * from '../integrations/batch';
