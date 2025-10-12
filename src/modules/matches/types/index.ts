/**
 * Matches Module Types
 * DTOs, interfaces, and enums for matches module
 */

// ============================================
// Request DTOs
// ============================================

export interface CreateMatchesDTO {
  // TODO: Define fields
}

export interface UpdateMatchesDTO {
  // TODO: Define fields
}

// ============================================
// Response DTOs
// ============================================

export interface MatchesResponseDTO {
  id: string;
  // TODO: Define fields
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Enums
// ============================================

export enum MatchesStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ============================================
// Filters & Query Options
// ============================================

export interface MatchesFilters {
  status?: MatchesStatus;
  // TODO: Add filter fields
}
