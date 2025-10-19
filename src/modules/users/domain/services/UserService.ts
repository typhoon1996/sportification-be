import {User} from "../../../users/domain/models/User";
import {ProfileService} from "./ProfileService";
import {FriendService} from "./FriendService";
import {UserEventPublisher} from "../../events/publishers/UserEventPublisher";
import {
  IUserService,
  IProfileService,
  IFriendService,
  IUserEventPublisher,
  IUserData,
  IProfileUpdate,
  ISearchResult,
} from "../interfaces";
import {AuthenticationError} from "../../../../shared/middleware/errorHandler";

/**
 * User Service - Business Logic for User Management (Refactored)
 *
 * Refactored to follow SOLID principles with dependency injection.
 * Delegates specialized tasks to ProfileService and FriendService.
 *
 * Key Improvements:
 * - Single Responsibility: Delegates profile and friend operations
 * - Dependency Inversion: Depends on interfaces, not concrete classes
 * - Open/Closed: Extensible through interface implementations
 *
 * @class UserService
 * @implements {IUserService}
 */
export class UserService implements IUserService {
  private readonly profileService: IProfileService;
  private readonly friendService: IFriendService;
  private readonly eventPublisher: IUserEventPublisher;

  /**
   * Constructor with Dependency Injection
   *
   * @param profileService - Profile management service
   * @param friendService - Friend relationship service
   * @param eventPublisher - Event publisher for domain events
   */
  constructor(
    profileService?: IProfileService,
    friendService?: IFriendService,
    eventPublisher?: IUserEventPublisher
  ) {
    this.profileService = profileService || new ProfileService();
    this.friendService = friendService || new FriendService();
    this.eventPublisher = eventPublisher || new UserEventPublisher();
  }

  /**
   * Get user by ID with populated profile and achievements
   *
   * Delegates to ProfileService for profile retrieval.
   *
   * @async
   * @param {string} userId - ID of the user to retrieve
   * @returns {Promise<IUserData>} User object with populated profile
   * @throws {AuthenticationError} If user not found
   */
  async getUserById(userId: string): Promise<IUserData> {
    return this.profileService.getProfile(userId);
  }

  /**
   * Update user profile information
   *
   * Delegates to ProfileService for profile updates.
   *
   * @async
   * @param {string} userId - ID of the user to update
   * @param {IProfileUpdate} updates - Object containing fields to update
   * @returns {Promise<IUserData>} Updated user with populated profile
   * @throws {AuthenticationError} If user not found
   */
  async updateProfile(
    userId: string,
    updates: IProfileUpdate
  ): Promise<IUserData> {
    return this.profileService.updateProfile(userId, updates);
  }

  /**
   * Add a friend
   *
   * Delegates to FriendService for friend management.
   *
   * @param {string} userId - User ID
   * @param {string} friendId - Friend ID to add
   * @returns {Promise<{success: boolean}>} Success indicator
   */
  async addFriend(
    userId: string,
    friendId: string
  ): Promise<{success: boolean}> {
    return this.friendService.addFriend(userId, friendId);
  }

  /**
   * Remove a friend
   *
   * Delegates to FriendService for friend management.
   *
   * @param {string} userId - User ID
   * @param {string} friendId - Friend ID to remove
   * @returns {Promise<{success: boolean}>} Success indicator
   */
  async removeFriend(
    userId: string,
    friendId: string
  ): Promise<{success: boolean}> {
    return this.friendService.removeFriend(userId, friendId);
  }

  /**
   * Get user's friends
   *
   * Delegates to FriendService for friend retrieval.
   *
   * @param {string} userId - User ID
   * @returns {Promise<any[]>} List of friends
   */
  async getFriends(userId: string): Promise<any[]> {
    return this.friendService.getFriends(userId);
  }

  /**
   * Bulk add friends
   *
   * Delegates to FriendService for bulk operations.
   *
   * @param {string} userId - User ID
   * @param {string[]} friendIds - Array of friend IDs
   * @returns {Promise<{success: boolean; added: number}>} Result
   */
  async bulkAddFriends(
    userId: string,
    friendIds: string[]
  ): Promise<{success: boolean; added: number}> {
    return this.friendService.bulkAddFriends(userId, friendIds);
  }

  /**
   * Search users
   *
   * @param {string} query - Search query
   * @param {number} limit - Max results (default: 20)
   * @param {number} offset - Pagination offset (default: 0)
   * @returns {Promise<ISearchResult>} Search results
   */
  async searchUsers(
    query: string,
    limit = 20,
    offset = 0
  ): Promise<ISearchResult> {
    const users = await User.find({
      $or: [{email: {$regex: query, $options: "i"}}],
      isActive: true,
    })
      .skip(offset)
      .limit(limit)
      .populate("profile", "firstName lastName username avatar")
      .select("email profile stats");

    const total = await User.countDocuments({
      $or: [{email: {$regex: query, $options: "i"}}],
      isActive: true,
    });

    return {
      users,
      total,
      hasMore: offset + users.length < total,
    };
  }

  /**
   * Get user statistics
   *
   * @param {string} userId - User ID
   * @returns {Promise<any>} User stats
   * @throws {AuthenticationError} If user not found
   */
  async getUserStats(userId: string): Promise<any> {
    const user = await User.findById(userId).select("stats achievements");

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    return {
      stats: user.stats,
      achievementsCount: user.achievements?.length || 0,
    };
  }

  /**
   * Update user statistics
   *
   * @param {string} userId - User ID
   * @param {any} statsUpdate - Stats to update
   * @returns {Promise<any>} Updated stats
   * @throws {AuthenticationError} If user not found
   */
  async updateUserStats(userId: string, statsUpdate: any): Promise<any> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    user.stats = {
      ...user.stats,
      ...statsUpdate,
    };

    await user.save();

    this.eventPublisher.publishStatsUpdated({
      userId,
      stats: user.stats,
      timestamp: new Date(),
    });

    return user.stats;
  }

  /**
   * Deactivate user account
   *
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean}>} Success indicator
   * @throws {AuthenticationError} If user not found
   */
  async deactivateUser(userId: string): Promise<{success: boolean}> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    user.isActive = false;
    await user.save();

    return {success: true};
  }

  /**
   * Reactivate user account
   *
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean}>} Success indicator
   * @throws {AuthenticationError} If user not found
   */
  async reactivateUser(userId: string): Promise<{success: boolean}> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    user.isActive = true;
    await user.save();

    return {success: true};
  }
}
