/**
 * Chat Module Types
 * DTOs, interfaces, and enums for chat module
 */

// ============================================
// Request DTOs
// ============================================

export interface CreateChatDTO {
  // TODO: Define fields
}

export interface UpdateChatDTO {
  // TODO: Define fields
}

// ============================================
// Response DTOs
// ============================================

export interface ChatResponseDTO {
  id: string;
  // TODO: Define fields
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Enums
// ============================================

export enum ChatStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ============================================
// Filters & Query Options
// ============================================

export interface ChatFilters {
  status?: ChatStatus;
  // TODO: Add filter fields
}
