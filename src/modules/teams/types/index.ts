/**
 * Teams Module Types
 * DTOs, interfaces, and enums for teams module
 */

// ============================================
// Request DTOs
// ============================================

export interface CreateTeamsDTO {
  // TODO: Define fields
}

export interface UpdateTeamsDTO {
  // TODO: Define fields
}

// ============================================
// Response DTOs
// ============================================

export interface TeamsResponseDTO {
  id: string;
  // TODO: Define fields
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Enums
// ============================================

export enum TeamsStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ============================================
// Filters & Query Options
// ============================================

export interface TeamsFilters {
  status?: TeamsStatus;
  // TODO: Add filter fields
}
