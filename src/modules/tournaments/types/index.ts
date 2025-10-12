/**
 * Tournaments Module Types
 * DTOs, interfaces, and enums for tournaments module
 */

// ============================================
// Request DTOs
// ============================================

export interface CreateTournamentsDTO {
  // TODO: Define fields
}

export interface UpdateTournamentsDTO {
  // TODO: Define fields
}

// ============================================
// Response DTOs
// ============================================

export interface TournamentsResponseDTO {
  id: string;
  // TODO: Define fields
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Enums
// ============================================

export enum TournamentsStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ============================================
// Filters & Query Options
// ============================================

export interface TournamentsFilters {
  status?: TournamentsStatus;
  // TODO: Add filter fields
}
