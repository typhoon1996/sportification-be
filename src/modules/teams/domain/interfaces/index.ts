/**
 * Team Module - Service Interfaces
 *
 * Defines contracts for team management services following SOLID principles.
 * These interfaces enable dependency injection, testability, and extensibility.
 *
 * Architecture:
 * - ITeamService: Main orchestration service
 * - ITeamMemberService: Member management operations
 * - ITeamValidationService: Business rule validation
 * - ITeamEventPublisher: Domain event publishing
 */

import {ITeam} from "../../../../shared/types";

/**
 * Team member data for adding to a team
 */
export interface ITeamMemberData {
  user: string;
  role: string;
  joinedAt: Date;
}

/**
 * Team creation data
 */
export interface ITeamCreationData {
  name: string;
  sport: string;
  description?: string;
  maxMembers?: number;
}

/**
 * Team update data
 */
export interface ITeamUpdateData {
  name?: string;
  description?: string;
  maxMembers?: number;
}

/**
 * Team event publisher interface
 *
 * Abstracts event publishing for team-related domain events.
 * Enables decoupling from specific event bus implementations.
 */
export interface ITeamEventPublisher {
  publishTeamCreated(data: {
    teamId: string;
    name: string;
    captainId: string;
    sport: string;
  }): void;

  publishMemberJoined(data: {
    teamId: string;
    userId: string;
    memberCount: number;
  }): void;

  publishMemberLeft(data: {teamId: string; userId: string}): void;
}

/**
 * Team member management service interface (SRP)
 *
 * Handles all member-related operations: joining, leaving, role management.
 * Separated from main TeamService to follow Single Responsibility Principle.
 *
 * Responsibilities:
 * - Add/remove members
 * - Check membership
 * - Role management
 * - Member capacity tracking
 */
export interface ITeamMemberService {
  /**
   * Add a user to a team
   */
  addMember(
    team: ITeam,
    userId: string,
    eventPublisher: ITeamEventPublisher
  ): Promise<ITeam>;

  /**
   * Remove a user from a team
   */
  removeMember(
    team: ITeam,
    userId: string,
    eventPublisher: ITeamEventPublisher
  ): Promise<{success: boolean}>;

  /**
   * Check if user is a member
   */
  isMember(team: ITeam, userId: string): boolean;

  /**
   * Check if team has capacity for new members
   */
  hasCapacity(team: ITeam): boolean;

  /**
   * Get member count
   */
  getMemberCount(team: ITeam): number;
}

/**
 * Team validation service interface (SRP)
 *
 * Handles all business rule validation for team operations.
 * Separated from main TeamService to follow Single Responsibility Principle.
 *
 * Responsibilities:
 * - Validate join permissions
 * - Validate leave permissions
 * - Validate captain permissions
 * - Enforce business rules
 */
export interface ITeamValidationService {
  /**
   * Validate user can join team
   */
  validateCanJoin(team: ITeam, userId: string): void;

  /**
   * Validate user can leave team
   */
  validateCanLeave(team: ITeam, userId: string): void;

  /**
   * Validate user is team captain
   */
  validateIsCaptain(team: ITeam, userId: string): void;

  /**
   * Validate team update data
   */
  validateTeamUpdate(updates: ITeamUpdateData): void;
}

/**
 * Main team service interface (DIP)
 *
 * Orchestrates team operations by delegating to specialized services.
 * Depends on abstractions (interfaces) not concrete implementations.
 *
 * Responsibilities:
 * - Team lifecycle management
 * - Orchestrate specialized services
 * - Coordinate database operations
 * - Manage transactions
 */
export interface ITeamService {
  /**
   * Create a new team with creator as captain
   */
  createTeam(creatorId: string, teamData: ITeamCreationData): Promise<ITeam>;

  /**
   * Add a user to an existing team
   */
  joinTeam(userId: string, teamId: string): Promise<ITeam>;

  /**
   * Remove a user from a team
   */
  leaveTeam(userId: string, teamId: string): Promise<{success: boolean}>;

  /**
   * Update team details (captain only)
   */
  updateTeam(
    teamId: string,
    userId: string,
    updates: ITeamUpdateData
  ): Promise<ITeam>;

  /**
   * Delete a team (captain only)
   */
  deleteTeam(teamId: string, userId: string): Promise<{success: boolean}>;
}
