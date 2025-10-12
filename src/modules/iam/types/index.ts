/**
 * Iam Module Types
 * DTOs, interfaces, and enums for iam module
 */

// ============================================
// Request DTOs
// ============================================

export interface CreateIamDTO {
  // TODO: Define fields
}

export interface UpdateIamDTO {
  // TODO: Define fields
}

// ============================================
// Response DTOs
// ============================================

export interface IamResponseDTO {
  id: string;
  // TODO: Define fields
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Enums
// ============================================

export enum IamStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ============================================
// Filters & Query Options
// ============================================

export interface IamFilters {
  status?: IamStatus;
  // TODO: Add filter fields
}
