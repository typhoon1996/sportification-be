import { User } from '../../../users/domain/models/User';
import { Profile } from '../../../users/domain/models/Profile';
import { UserEventPublisher } from '../../events/publishers/UserEventPublisher';
import { AuthenticationError, ConflictError } from '../../../../shared/middleware/errorHandler';

/**
 * User Service - Business Logic for User Management
 * 
 * Handles all business logic related to user profile management, social features,
 * and user data operations. Manages user-profile relationships and publishes
 * domain events for other modules.
 * 
 * Key Responsibilities:
 * - User profile retrieval and updates
 * - Friend relationship management (bidirectional)
 * - User search and discovery
 * - Achievement tracking
 * - User statistics management
 * - Privacy settings
 * - Email verification status
 * 
 * Data Model:
 * - User: Authentication and core account data
 * - Profile: Public user information and social data
 * - Bidirectional linking between User and Profile
 * 
 * Business Rules:
 * - Profile updates separated from user updates
 * - Friend relationships are bidirectional
 * - Email uniqueness enforced at registration
 * - Achievement points tracked automatically
 * - Privacy settings respected in search results
 * 
 * Event Publication:
 * - user.profile_updated - When profile changes
 * - user.friend_added - When friend relationship created
 * - user.friend_removed - When friend relationship deleted
 * - user.achievement_earned - When new achievement unlocked
 * 
 * @class UserService
 */
export class UserService {
  private eventPublisher: UserEventPublisher;

  constructor() {
    this.eventPublisher = new UserEventPublisher();
  }

  /**
   * Get user by ID with populated profile and achievements
   * 
   * Retrieves complete user information including profile data and achievements.
   * Returns sanitized user data without sensitive fields like password hash.
   * 
   * @async
   * @param {string} userId - ID of the user to retrieve
   * @returns {Promise<Object>} User object with populated profile and achievements
   * 
   * @throws {AuthenticationError} If user not found
   * 
   * @example
   * const user = await userService.getUserById(userId);
   * // Returns: { id, email, profile, achievements, stats, preferences, ... }
   */
  async getUserById(userId: string) {
    const user = await User.findById(userId)
      .populate('profile')
      .populate('achievements', 'name description icon points');

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      profile: user.profile,
      achievements: user.achievements,
      stats: user.stats,
      preferences: user.preferences,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
    };
  }

  /**
   * Update user profile information
   * 
   * Updates user and profile data with proper separation of concerns.
   * User document updates (preferences, stats) handled separately from
   * Profile document updates (public information). Publishes event for
   * other modules to react to profile changes.
   * 
   * Process:
   * 1. Separates user updates from profile updates
   * 2. Updates User document if user fields present
   * 3. Updates Profile document if profile fields present
   * 4. Publishes user.profile_updated event
   * 5. Returns updated user with populated profile
   * 
   * @async
   * @param {string} userId - ID of the user to update
   * @param {Object} updates - Object containing fields to update
   * @param {string} updates.firstName - User's first name
   * @param {string} updates.lastName - User's last name
   * @param {string} updates.bio - User bio/description
   * @param {string} updates.avatar - Avatar image URL
   * @param {string} updates.location - User location
   * @param {string} updates.phoneNumber - Contact phone number
   * @param {any} updates.preferences - User preferences
   * @param {any} updates.stats - User statistics
   * @returns {Promise<Object>} Updated user with populated profile
   * 
   * @throws {AuthenticationError} If user not found
   * 
   * @example
   * const user = await userService.updateProfile(userId, {
   *   firstName: "John",
   *   lastName: "Doe",
   *   bio: "Sports enthusiast",
   *   location: "New York"
   * });
   */
  async updateProfile(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      avatar?: string;
      location?: string;
      phoneNumber?: string;
      preferences?: any;
      stats?: any;
    }
  ) {
    // Separate user updates from profile updates
    const userUpdates: any = {};
    const profileUpdates: any = {};

    // Fields that belong to user model
    const userFields = ['preferences', 'stats'];
    // Fields that belong to profile model
    const profileFields = ['firstName', 'lastName', 'bio', 'avatar', 'location', 'phoneNumber'];

    Object.keys(updates).forEach((key) => {
      if (userFields.includes(key)) {
        userUpdates[key] = updates[key as keyof typeof updates];
      } else if (profileFields.includes(key)) {
        profileUpdates[key] = updates[key as keyof typeof updates];
      }
    });

    const updatePromises = [];

    // Update user if there are user updates
    if (Object.keys(userUpdates).length > 0) {
      updatePromises.push(
        User.findByIdAndUpdate(userId, userUpdates, {
          new: true,
          runValidators: true,
        })
      );
    }

    // Update profile if there are profile updates
    if (Object.keys(profileUpdates).length > 0) {
      updatePromises.push(
        Profile.findOneAndUpdate({ user: userId }, profileUpdates, {
          new: true,
          runValidators: true,
        })
      );
    }

    if (updatePromises.length === 0) {
      throw new Error('No valid fields to update');
    }

    await Promise.all(updatePromises);

    // Get updated user with profile
    const updatedUser = await User.findById(userId).populate('profile').populate('achievements');

    // Publish event
    this.eventPublisher.publishProfileUpdated({
      userId: updatedUser!.id,
      updates: Object.keys(updates),
      timestamp: new Date(),
    });

    return {
      id: updatedUser!.id,
      email: updatedUser!.email,
      profile: updatedUser!.profile,
      achievements: updatedUser!.achievements,
      stats: updatedUser!.stats,
      preferences: updatedUser!.preferences,
    };
  }

  async addFriend(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new Error('Cannot add yourself as a friend');
    }

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      throw new AuthenticationError('User not found');
    }

    // Check if already friends
    if (user.friends?.includes(friendId as any)) {
      throw new ConflictError('Already friends');
    }

    // Add friend to both users
    user.friends = user.friends || [];
    user.friends.push(friendId as any);
    await user.save();

    friend.friends = friend.friends || [];
    friend.friends.push(userId as any);
    await friend.save();

    // Publish event
    this.eventPublisher.publishFriendAdded({
      userId,
      friendId,
      timestamp: new Date(),
    });

    return { success: true };
  }

  async removeFriend(userId: string, friendId: string) {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      throw new AuthenticationError('User not found');
    }

    // Remove friend from both users
    user.friends = user.friends?.filter((id) => id.toString() !== friendId) || [];
    await user.save();

    friend.friends = friend.friends?.filter((id) => id.toString() !== userId) || [];
    await friend.save();

    // Publish event
    this.eventPublisher.publishFriendRemoved({
      userId,
      friendId,
      timestamp: new Date(),
    });

    return { success: true };
  }

  async getFriends(userId: string) {
    const user = await User.findById(userId).populate('friends', 'email profile');

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return user.friends || [];
  }

  async searchUsers(query: string, limit = 20, offset = 0) {
    const users = await User.find({
      $or: [{ email: { $regex: query, $options: 'i' } }],
      isActive: true,
    })
      .skip(offset)
      .limit(limit)
      .populate('profile', 'firstName lastName username avatar')
      .select('email profile stats');

    const total = await User.countDocuments({
      $or: [{ email: { $regex: query, $options: 'i' } }],
      isActive: true,
    });

    return {
      users,
      total,
      hasMore: offset + users.length < total,
    };
  }

  async getUserStats(userId: string) {
    const user = await User.findById(userId).select('stats achievements');

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return {
      stats: user.stats,
      achievementsCount: user.achievements?.length || 0,
    };
  }

  async updateUserStats(userId: string, statsUpdate: any) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Merge stats
    user.stats = {
      ...user.stats,
      ...statsUpdate,
    };

    await user.save();

    // Publish stats updated event
    this.eventPublisher.publishStatsUpdated({
      userId,
      stats: user.stats,
      timestamp: new Date(),
    });

    return user.stats;
  }

  async deactivateUser(userId: string) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    user.isActive = false;
    await user.save();

    return { success: true };
  }

  async reactivateUser(userId: string) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    user.isActive = true;
    await user.save();

    return { success: true };
  }

  async bulkAddFriends(userId: string, friendIds: string[]) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const validFriendIds: string[] = [];

    for (const friendId of friendIds) {
      if (friendId !== userId && !user.friends?.includes(friendId as any)) {
        validFriendIds.push(friendId);
      }
    }

    if (validFriendIds.length === 0) {
      return { success: true, added: 0 };
    }

    // Verify all friends exist
    const friends = await User.find({
      _id: { $in: validFriendIds },
      isActive: true,
    });

    if (friends.length !== validFriendIds.length) {
      throw new AuthenticationError('Some users not found');
    }

    // Add to user's friends list
    user.friends = user.friends || [];
    user.friends.push(...(validFriendIds as any));
    await user.save();

    // Add user to each friend's list
    await User.updateMany({ _id: { $in: validFriendIds } }, { $addToSet: { friends: userId } });

    return { success: true, added: validFriendIds.length };
  }
}
