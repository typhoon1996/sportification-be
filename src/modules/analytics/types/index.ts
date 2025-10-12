/**
 * Analytics Module Types
 * DTOs, interfaces, and enums for analytics module
 */

// ============================================
// Request DTOs
// ============================================

export interface CreateAnalyticsDTO {
  // TODO: Define fields
}

export interface UpdateAnalyticsDTO {
  // TODO: Define fields
}

// ============================================
// Response DTOs
// ============================================

export interface AnalyticsResponseDTO {
  id: string;
  // TODO: Define fields
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Enums
// ============================================

export enum AnalyticsStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ============================================
// Filters & Query Options
// ============================================

export interface AnalyticsFilters {
  status?: AnalyticsStatus;
  // TODO: Add filter fields
}
