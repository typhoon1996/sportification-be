import {ITeam} from "../../../../shared/types";
import {Team} from "../../domain/models/Team";
import {TeamEventPublisher} from "../../events/publishers/TeamEventPublisher";
import {NotFoundError} from "../../../../shared/middleware/errorHandler";
import {
  ITeamService,
  ITeamMemberService,
  ITeamValidationService,
  ITeamEventPublisher,
  ITeamCreationData,
  ITeamUpdateData,
} from "../interfaces";
import {TeamMemberService} from "./TeamMemberService";
import {TeamValidationService} from "./TeamValidationService";

/**
 * TeamService - Main orchestration service for team management (Refactored with SOLID)
 *
 * Orchestrates team operations by delegating to specialized services.
 * Follows SOLID principles with dependency injection and single responsibility.
 *
 * Architecture:
 * - Delegates member management to TeamMemberService (SRP)
 * - Delegates validation to TeamValidationService (SRP)
 * - Depends on interfaces, not concrete implementations (DIP)
 * - Extensible through service swapping (OCP)
 *
 * SOLID Principles Applied:
 * - SRP: Orchestration only, delegates to specialized services
 * - DIP: Depends on ITeamMemberService, ITeamValidationService, ITeamEventPublisher interfaces
 * - OCP: Can extend with new services without modifying this class
 * - LSP: Any implementation of interfaces can be substituted
 * - ISP: Interfaces are focused and single-purpose
 *
 * Features:
 * - Team creation with captain assignment
 * - Member join/leave operations
 * - Captain-only team updates
 * - Maximum member capacity enforcement
 * - Event publication for integration
 *
 * @example
 * // With dependency injection (testable)
 * const service = new TeamService(mockMemberService, mockValidationService, mockEventPublisher);
 *
 * // With default implementations (production)
 * const service = new TeamService();
 */
export class TeamService implements ITeamService {
  private memberService: ITeamMemberService;
  private validationService: ITeamValidationService;
  private eventPublisher: ITeamEventPublisher;

  /**
   * Constructor with dependency injection (DIP)
   *
   * Accepts service implementations via constructor, enabling:
   * - Easy mocking for unit tests
   * - Service swapping for different implementations
   * - Loose coupling between services
   *
   * @param memberService - Member management service (default: ITeamMemberService)
   * @param validationService - Validation service (default: ITeamValidationService)
   * @param eventPublisher - Event publisher (default: ITeamEventPublisher)
   */
  constructor(
    memberService?: ITeamMemberService,
    validationService?: ITeamValidationService,
    eventPublisher?: ITeamEventPublisher
  ) {
    this.memberService = memberService || new TeamMemberService();
    this.validationService = validationService || new TeamValidationService();
    this.eventPublisher = eventPublisher || new TeamEventPublisher();
  }

  /**
   * Create a new team with the creator as captain
   *
   * Automatically assigns the creator as the team captain and first member.
   * Sets default maximum members to 20 if not specified. Publishes team.created
   * event for other modules to react to.
   *
   * @param creatorId - User ID of the team creator (becomes captain)
   * @param teamData - Team creation data
   * @return Created team document with captain assigned
   *
   * @example
   * const team = await teamService.createTeam('user123', {
   *   name: 'Thunder Squad',
   *   sport: 'basketball',
   *   description: 'Competitive basketball team',
   *   maxMembers: 15
   * });
   */
  async createTeam(
    creatorId: string,
    teamData: ITeamCreationData
  ): Promise<ITeam> {
    const team = new Team({
      name: teamData.name,
      sport: teamData.sport,
      description: teamData.description,
      captain: creatorId,
      members: [
        {
          user: creatorId,
          role: "captain",
          joinedAt: new Date(),
        },
      ],
      maxMembers: teamData.maxMembers || 20,
    });

    await team.save();

    // Publish event
    this.eventPublisher.publishTeamCreated({
      teamId: team.id,
      name: team.name,
      captainId: creatorId,
      sport: team.sport || "Unknown",
    });

    return team;
  }

  /**
   * Add a user to an existing team
   *
   * Validates that the user can join (not already member, team has capacity)
   * and delegates member addition to TeamMemberService.
   *
   * @param userId - User ID of the member joining
   * @param teamId - Team ID to join
   * @return Updated team document with new member
   *
   * @throws {NotFoundError} If team does not exist
   * @throws {ConflictError} If user is already a member or team is full
   *
   * @example
   * const updatedTeam = await teamService.joinTeam('user456', 'team123');
   */
  async joinTeam(userId: string, teamId: string): Promise<ITeam> {
    const team = await Team.findById(teamId);

    if (!team) {
      throw new NotFoundError("Team");
    }

    // Delegate validation (SRP, DIP)
    this.validationService.validateCanJoin(team, userId);

    // Delegate member management (SRP, DIP)
    return this.memberService.addMember(team, userId, this.eventPublisher);
  }

  /**
   * Remove a user from a team
   *
   * Validates that the user can leave (is member, not captain) and delegates
   * member removal to TeamMemberService.
   *
   * Business Rule: ITeam captain must transfer captaincy before leaving or delete the team.
   *
   * @param userId - User ID of the member leaving
   * @param teamId - Team ID to leave
   * @return Success confirmation
   *
   * @throws {NotFoundError} If team does not exist
   * @throws {ConflictError} If user is not a member or is the captain
   *
   * @example
   * const result = await teamService.leaveTeam('user456', 'team123');
   */
  async leaveTeam(userId: string, teamId: string): Promise<{success: boolean}> {
    const team = await Team.findById(teamId);

    if (!team) {
      throw new NotFoundError("Team");
    }

    // Delegate validation (SRP, DIP)
    this.validationService.validateCanLeave(team, userId);

    // Delegate member management (SRP, DIP)
    return this.memberService.removeMember(team, userId, this.eventPublisher);
  }

  /**
   * Update team details (captain only)
   *
   * Validates captain permissions and update data, then applies changes.
   * Only the captain has permission to update team details.
   *
   * @param teamId - Team ID to update
   * @param userId - User ID attempting the update
   * @param updates - Team update data
   * @return Updated team document
   *
   * @throws {NotFoundError} If team does not exist
   * @throws {ValidationError} If user is not the team captain or data is invalid
   *
   * @example
   * const updatedTeam = await teamService.updateTeam('team123', 'captain123', {
   *   name: 'New Team Name',
   *   description: 'Updated description',
   *   maxMembers: 25
   * });
   */
  async updateTeam(
    teamId: string,
    userId: string,
    updates: ITeamUpdateData
  ): Promise<ITeam> {
    const team = await Team.findById(teamId);

    if (!team) {
      throw new NotFoundError("Team");
    }

    // Delegate validation (SRP, DIP)
    this.validationService.validateIsCaptain(team, userId);
    this.validationService.validateTeamUpdate(updates);

    Object.assign(team, updates);
    await team.save();

    return team;
  }

  /**
   * Delete a team (captain only)
   *
   * Only the captain can delete the team.
   *
   * @param teamId - Team ID to delete
   * @param userId - User ID attempting the deletion
   * @return Success confirmation
   *
   * @throws {NotFoundError} If team does not exist
   * @throws {ValidationError} If user is not the team captain
   */
  async deleteTeam(
    teamId: string,
    userId: string
  ): Promise<{success: boolean}> {
    const team = await Team.findById(teamId);

    if (!team) {
      throw new NotFoundError("Team");
    }

    // Delegate validation (SRP, DIP)
    this.validationService.validateIsCaptain(team, userId);

    await team.deleteOne();

    return {success: true};
  }
}
