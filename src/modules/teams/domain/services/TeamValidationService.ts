import {
  ValidationError,
  ConflictError,
} from "../../../../shared/middleware/errorHandler";
import {ITeam} from "../../../../shared/types";
import {ITeamValidationService, ITeamUpdateData} from "../interfaces";

/**
 * TeamValidationService - Handles team business rule validation (SRP)
 *
 * Single Responsibility: Validates team operations against business rules.
 * Separated from TeamService to follow Single Responsibility Principle.
 *
 * Features:
 * - Join permission validation
 * - Leave permission validation
 * - Captain permission validation
 * - Team update validation
 *
 * SOLID Principles Applied:
 * - SRP: Only handles validation, no data modification or event publishing
 * - OCP: Can be extended with new validation rules
 * - DIP: Works with Team interface/model
 *
 * @example
 * const validationService = new TeamValidationService();
 * validationService.validateCanJoin(team, userId); // Throws if invalid
 */
export class TeamValidationService implements ITeamValidationService {
  /**
   * Validate user can join team
   *
   * Checks:
   * - User is not already a member
   * - Team has not reached maximum capacity
   *
   * @param team - Team to validate joining
   * @param userId - User ID attempting to join
   * @throws {ConflictError} If user is already a member
   * @throws {ConflictError} If team is at maximum capacity
   */
  validateCanJoin(team: ITeam, userId: string): void {
    // Check if already a member
    if (team.members.some((m: any) => m.toString() === userId)) {
      throw new ConflictError("Already a member of this team");
    }

    // Check capacity
    if (team.maxMembers && team.members.length >= team.maxMembers) {
      throw new ConflictError("Team is full");
    }
  }

  /**
   * Validate user can leave team
   *
   * Checks:
   * - User is a member of the team
   * - User is not the team captain (captains must transfer or delete team)
   *
   * @param team - Team to validate leaving
   * @param userId - User ID attempting to leave
   * @throws {ConflictError} If user is not a member
   * @throws {ConflictError} If user is the captain
   */
  validateCanLeave(team: ITeam, userId: string): void {
    // Check if member
    if (!team.members.some((m: any) => m.toString() === userId)) {
      throw new ConflictError("Not a member of this team");
    }

    // Check if captain (captains cannot leave)
    if (team.captain.toString() === userId) {
      throw new ConflictError("Team captain cannot leave the team");
    }
  }

  /**
   * Validate user is team captain
   *
   * Verifies that the user has captain permissions for the operation.
   *
   * @param team - Team to check captain status
   * @param userId - User ID to verify as captain
   * @throws {ValidationError} If user is not the team captain
   */
  validateIsCaptain(team: ITeam, userId: string): void {
    if (team.captain.toString() !== userId) {
      throw new ValidationError("Only team captain can perform this action");
    }
  }

  /**
   * Validate team update data
   *
   * Ensures update data is valid and within acceptable ranges.
   *
   * @param updates - Team update data to validate
   * @throws {ValidationError} If update data is invalid
   */
  validateTeamUpdate(updates: ITeamUpdateData): void {
    if (updates.maxMembers !== undefined) {
      if (updates.maxMembers < 2) {
        throw new ValidationError("Team must allow at least 2 members");
      }
      if (updates.maxMembers > 100) {
        throw new ValidationError("Team cannot have more than 100 members");
      }
    }

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new ValidationError("Team name cannot be empty");
      }
      if (updates.name.length > 100) {
        throw new ValidationError("Team name cannot exceed 100 characters");
      }
    }
  }
}
