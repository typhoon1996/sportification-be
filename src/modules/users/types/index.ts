/**
 * Users Module Types
 * DTOs, interfaces, and enums for users module
 */

// ============================================
// Request DTOs
// ============================================

export interface CreateUsersDTO {
  // TODO: Define fields
}

export interface UpdateUsersDTO {
  // TODO: Define fields
}

// ============================================
// Response DTOs
// ============================================

export interface UsersResponseDTO {
  id: string;
  // TODO: Define fields
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Enums
// ============================================

export enum UsersStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ============================================
// Filters & Query Options
// ============================================

export interface UsersFilters {
  status?: UsersStatus;
  // TODO: Add filter fields
}
