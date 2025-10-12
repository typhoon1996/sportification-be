/**
 * Notifications Module Types
 * DTOs, interfaces, and enums for notifications module
 */

// ============================================
// Request DTOs
// ============================================

export interface CreateNotificationsDTO {
  // TODO: Define fields
}

export interface UpdateNotificationsDTO {
  // TODO: Define fields
}

// ============================================
// Response DTOs
// ============================================

export interface NotificationsResponseDTO {
  id: string;
  // TODO: Define fields
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Enums
// ============================================

export enum NotificationsStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ============================================
// Filters & Query Options
// ============================================

export interface NotificationsFilters {
  status?: NotificationsStatus;
  // TODO: Add filter fields
}
