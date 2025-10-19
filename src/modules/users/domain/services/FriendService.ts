/**
 * FriendService - Friend Relationship Management
 *
 * Handles all friend-related operations following Single Responsibility Principle.
 * Only manages bidirectional friend relationships.
 *
 * @class FriendService
 * @implements {IFriendService}
 */

import {User} from "../models/User";
import {IFriendService, IUserEventPublisher} from "../interfaces";
import {
  AuthenticationError,
  ConflictError,
} from "../../../../shared/middleware/errorHandler";
import {UserEventPublisher} from "../../events/publishers/UserEventPublisher";

export class FriendService implements IFriendService {
  private readonly eventPublisher: IUserEventPublisher;

  constructor(eventPublisher?: IUserEventPublisher) {
    this.eventPublisher = eventPublisher || new UserEventPublisher();
  }

  /**
   * Add a friend (bidirectional)
   *
   * Creates a bidirectional friend relationship between two users.
   * Validates that users exist and are not already friends.
   *
   * @param {string} userId - User ID
   * @param {string} friendId - Friend's user ID
   * @returns {Promise<{success: boolean}>} Success indicator
   * @throws {Error} If trying to add self as friend
   * @throws {AuthenticationError} If user or friend not found
   * @throws {ConflictError} If already friends
   */
  async addFriend(
    userId: string,
    friendId: string
  ): Promise<{success: boolean}> {
    if (userId === friendId) {
      throw new Error("Cannot add yourself as a friend");
    }

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      throw new AuthenticationError("User not found");
    }

    if (user.friends?.includes(friendId as any)) {
      throw new ConflictError("Already friends");
    }

    // Add friend to both users (bidirectional)
    user.friends = user.friends || [];
    user.friends.push(friendId as any);
    await user.save();

    friend.friends = friend.friends || [];
    friend.friends.push(userId as any);
    await friend.save();

    this.eventPublisher.publishFriendAdded({
      userId,
      friendId,
      timestamp: new Date(),
    });

    return {success: true};
  }

  /**
   * Remove a friend (bidirectional)
   *
   * Removes the bidirectional friend relationship between two users.
   *
   * @param {string} userId - User ID
   * @param {string} friendId - Friend's user ID
   * @returns {Promise<{success: boolean}>} Success indicator
   * @throws {AuthenticationError} If user or friend not found
   */
  async removeFriend(
    userId: string,
    friendId: string
  ): Promise<{success: boolean}> {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      throw new AuthenticationError("User not found");
    }

    // Remove from both users (bidirectional)
    user.friends = user.friends?.filter(id => id.toString() !== friendId) || [];
    await user.save();

    friend.friends =
      friend.friends?.filter(id => id.toString() !== userId) || [];
    await friend.save();

    this.eventPublisher.publishFriendRemoved({
      userId,
      friendId,
      timestamp: new Date(),
    });

    return {success: true};
  }

  /**
   * Get user's friends
   *
   * Retrieves all friends for a user with populated data.
   *
   * @param {string} userId - User ID
   * @returns {Promise<any[]>} List of friends
   * @throws {AuthenticationError} If user not found
   */
  async getFriends(userId: string): Promise<any[]> {
    const user = await User.findById(userId).populate(
      "friends",
      "email profile"
    );

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    return user.friends || [];
  }

  /**
   * Bulk add friends
   *
   * Adds multiple friends at once. Validates all friends exist
   * and filters out invalid or duplicate friend IDs.
   *
   * @param {string} userId - User ID
   * @param {string[]} friendIds - Array of friend IDs to add
   * @returns {Promise<{success: boolean; added: number}>} Success and count
   * @throws {AuthenticationError} If user not found or some friends don't exist
   */
  async bulkAddFriends(
    userId: string,
    friendIds: string[]
  ): Promise<{success: boolean; added: number}> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Filter valid friend IDs
    const validFriendIds = this.filterValidFriendIds(userId, user, friendIds);

    if (validFriendIds.length === 0) {
      return {success: true, added: 0};
    }

    // Verify all friends exist
    await this.verifyFriendsExist(validFriendIds);

    // Add to user's friends list
    user.friends = user.friends || [];
    user.friends.push(...(validFriendIds as any));
    await user.save();

    // Add user to each friend's list
    await User.updateMany(
      {_id: {$in: validFriendIds}},
      {$addToSet: {friends: userId}}
    );

    return {success: true, added: validFriendIds.length};
  }

  /**
   * Filter out invalid friend IDs
   *
   * @private
   * @param {string} userId - User ID
   * @param {any} user - User document
   * @param {string[]} friendIds - Friend IDs to filter
   * @returns {string[]} Valid friend IDs
   */
  private filterValidFriendIds(
    userId: string,
    user: any,
    friendIds: string[]
  ): string[] {
    const validFriendIds: string[] = [];

    for (const friendId of friendIds) {
      if (friendId !== userId && !user.friends?.includes(friendId as any)) {
        validFriendIds.push(friendId);
      }
    }

    return validFriendIds;
  }

  /**
   * Verify that all friend IDs exist as active users
   *
   * @private
   * @param {string[]} friendIds - Friend IDs to verify
   * @throws {AuthenticationError} If some users don't exist
   */
  private async verifyFriendsExist(friendIds: string[]): Promise<void> {
    const friends = await User.find({
      _id: {$in: friendIds},
      isActive: true,
    });

    if (friends.length !== friendIds.length) {
      throw new AuthenticationError("Some users not found");
    }
  }
}
