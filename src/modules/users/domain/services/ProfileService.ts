/**
 * ProfileService - User Profile Management
 *
 * Handles all user profile operations following Single Responsibility Principle.
 * Only manages profile-related data and updates.
 *
 * @class ProfileService
 * @implements {IProfileService}
 */

import {User} from "../models/User";
import {Profile} from "../models/Profile";
import {
  IProfileService,
  IUserData,
  IProfileUpdate,
  IUserEventPublisher,
} from "../interfaces";
import {AuthenticationError} from "../../../../shared/middleware/errorHandler";
import {UserEventPublisher} from "../../events/publishers/UserEventPublisher";

export class ProfileService implements IProfileService {
  private readonly eventPublisher: IUserEventPublisher;

  constructor(eventPublisher?: IUserEventPublisher) {
    this.eventPublisher = eventPublisher || new UserEventPublisher();
  }

  /**
   * Get user profile by ID
   *
   * @param {string} userId - User ID
   * @returns {Promise<IUserData>} User profile data
   * @throws {AuthenticationError} If user not found
   */
  async getProfile(userId: string): Promise<IUserData> {
    const user = await User.findById(userId)
      .populate("profile")
      .populate("achievements", "name description icon points");

    if (!user) {
      throw new AuthenticationError("User not found");
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
   * Update user profile
   *
   * Separates user model updates from profile model updates.
   * Updates only the relevant documents and publishes update event.
   *
   * @param {string} userId - User ID
   * @param {IProfileUpdate} updates - Profile update data
   * @returns {Promise<IUserData>} Updated user data
   * @throws {AuthenticationError} If user not found
   * @throws {Error} If no valid fields to update
   */
  async updateProfile(
    userId: string,
    updates: IProfileUpdate
  ): Promise<IUserData> {
    const {userUpdates, profileUpdates} = this.separateUpdates(updates);

    if (
      Object.keys(userUpdates).length === 0 &&
      Object.keys(profileUpdates).length === 0
    ) {
      throw new Error("No valid fields to update");
    }

    const updatePromises = [];

    if (Object.keys(userUpdates).length > 0) {
      updatePromises.push(
        User.findByIdAndUpdate(userId, userUpdates, {
          new: true,
          runValidators: true,
        })
      );
    }

    if (Object.keys(profileUpdates).length > 0) {
      updatePromises.push(
        Profile.findOneAndUpdate({user: userId}, profileUpdates, {
          new: true,
          runValidators: true,
        })
      );
    }

    await Promise.all(updatePromises);

    const updatedUser = await User.findById(userId)
      .populate("profile")
      .populate("achievements");

    if (!updatedUser) {
      throw new AuthenticationError("User not found");
    }

    this.eventPublisher.publishProfileUpdated({
      userId: updatedUser.id,
      updates: Object.keys(updates),
      timestamp: new Date(),
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      profile: updatedUser.profile,
      achievements: updatedUser.achievements,
      stats: updatedUser.stats,
      preferences: updatedUser.preferences,
    };
  }

  /**
   * Separate user model updates from profile model updates
   *
   * @private
   * @param {IProfileUpdate} updates - Update data
   * @returns Separated updates
   */
  private separateUpdates(updates: IProfileUpdate): {
    userUpdates: any;
    profileUpdates: any;
  } {
    const userUpdates: any = {};
    const profileUpdates: any = {};

    const userFields = ["preferences", "stats"];
    const profileFields = [
      "firstName",
      "lastName",
      "bio",
      "avatar",
      "location",
      "phoneNumber",
    ];

    Object.keys(updates).forEach(key => {
      if (userFields.includes(key)) {
        userUpdates[key] = updates[key as keyof IProfileUpdate];
      } else if (profileFields.includes(key)) {
        profileUpdates[key] = updates[key as keyof IProfileUpdate];
      }
    });

    return {userUpdates, profileUpdates};
  }
}
