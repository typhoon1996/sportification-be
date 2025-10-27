/**
 * OAuthService - Social Login Service
 *
 * Handles OAuth authentication with third-party providers:
 * - Google OAuth 2.0
 * - Facebook Login
 * - GitHub OAuth
 *
 * Supports both:
 * - New user registration via social login
 * - Linking social accounts to existing users
 *
 * @class OAuthService
 */

import {User} from "../../../users/domain/models/User";
import {Profile as UserProfile} from "../../../users/domain/models/Profile";
import {
  AuthenticationError,
  ConflictError,
} from "../../../../shared/middleware/errorHandler";
import {TokenService} from "./TokenService";
import logger from "../../../../shared/infrastructure/logging";
import {IamEventPublisher} from "../../events/publishers/IamEventPublisher";

export interface IOAuthProfile {
  provider: "google" | "facebook" | "github";
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
}

export interface IOAuthResult {
  user: {
    id: string;
    email: string;
    profile: any;
    isEmailVerified: boolean;
  };
  tokens: any;
  isNewUser: boolean;
}

export class OAuthService {
  private readonly tokenService: TokenService;
  private readonly eventPublisher: IamEventPublisher;

  constructor() {
    this.tokenService = new TokenService();
    this.eventPublisher = new IamEventPublisher();
  }

  /**
   * Authenticate user with OAuth provider
   *
   * If user exists with this social login, returns existing user.
   * If user exists with same email, links the social login.
   * If user doesn't exist, creates a new user.
   *
   * @param oauthProfile - OAuth profile from provider
   * @returns Authentication result with tokens
   */
  async authenticateWithOAuth(
    oauthProfile: IOAuthProfile
  ): Promise<IOAuthResult> {
    // Check if user exists with this social login
    let user = await User.findBySocialLogin(
      oauthProfile.provider,
      oauthProfile.providerId
    );

    let isNewUser = false;
    let profile: any;

    if (user) {
      // User exists with this social login
      logger.info("OAuth login - existing social account", {
        provider: oauthProfile.provider,
        userId: user.id,
      });
    } else {
      // Check if user exists with same email
      user = await User.findByEmail(oauthProfile.email);

      if (user) {
        // Link social account to existing user
        await this.linkSocialAccount(user.id, oauthProfile);
        logger.info("OAuth login - linked to existing account", {
          provider: oauthProfile.provider,
          userId: user.id,
        });
      } else {
        // Create new user with social login
        const result = await this.createUserWithOAuth(oauthProfile);
        user = result.user;
        profile = result.profile;
        isNewUser = true;

        logger.info("OAuth login - new user created", {
          provider: oauthProfile.provider,
          userId: user.id,
        });
      }
    }

    // Fetch user with profile if not already loaded
    if (!profile) {
      user = await User.findById(user.id).populate("profile");
      profile = user?.profile;
    }

    // Generate tokens
    const tokens = this.tokenService.generateTokenPair(user!.id, user!.email);

    // Store refresh token
    user!.addRefreshToken(tokens.refreshToken);
    user!.lastLoginAt = new Date();
    await user!.save();

    // Publish event
    if (isNewUser) {
      this.eventPublisher.publishUserRegistered({
        userId: user!.id,
        email: user!.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        profileId: profile.id,
      });
    } else {
      this.eventPublisher.publishUserLoggedIn({
        userId: user!.id,
        email: user!.email,
        timestamp: new Date(),
      });
    }

    return {
      user: {
        id: user!.id,
        email: user!.email,
        profile,
        isEmailVerified: user!.isEmailVerified,
      },
      tokens,
      isNewUser,
    };
  }

  /**
   * Link social account to existing user
   *
   * Adds a social login provider to an authenticated user's account.
   *
   * @param userId - User ID
   * @param oauthProfile - OAuth profile to link
   * @returns Success indicator
   */
  async linkSocialAccount(
    userId: string,
    oauthProfile: IOAuthProfile
  ): Promise<{success: boolean}> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Check if this social account is already linked
    const alreadyLinked = user.socialLogins?.some(
      (login) =>
        login.provider === oauthProfile.provider &&
        login.providerId === oauthProfile.providerId
    );

    if (alreadyLinked) {
      throw new ConflictError("This social account is already linked");
    }

    // Check if another user has this social login
    const existingUser = await User.findBySocialLogin(
      oauthProfile.provider,
      oauthProfile.providerId
    );

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictError(
        "This social account is linked to another user"
      );
    }

    // Add social login
    user.socialLogins = user.socialLogins || [];
    user.socialLogins.push({
      provider: oauthProfile.provider,
      providerId: oauthProfile.providerId,
    });

    await user.save();

    logger.info("Social account linked", {
      userId,
      provider: oauthProfile.provider,
    });

    return {success: true};
  }

  /**
   * Unlink social account from user
   *
   * Removes a social login provider from user's account.
   * Requires at least one authentication method to remain.
   *
   * @param userId - User ID
   * @param provider - OAuth provider to unlink
   * @returns Success indicator
   */
  async unlinkSocialAccount(
    userId: string,
    provider: string
  ): Promise<{success: boolean}> {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Check if user has password or other social logins
    const hasPassword = !!user.password;
    const otherSocialLogins =
      user.socialLogins?.filter((login) => login.provider !== provider) || [];

    if (!hasPassword && otherSocialLogins.length === 0) {
      throw new ConflictError(
        "Cannot unlink last authentication method. Set a password first."
      );
    }

    // Remove social login
    user.socialLogins =
      user.socialLogins?.filter((login) => login.provider !== provider) || [];

    await user.save();

    logger.info("Social account unlinked", {
      userId,
      provider,
    });

    return {success: true};
  }

  /**
   * Create new user with OAuth profile
   *
   * @private
   * @param oauthProfile - OAuth profile from provider
   * @returns Created user and profile
   */
  private async createUserWithOAuth(oauthProfile: IOAuthProfile): Promise<{
    user: any;
    profile: any;
  }> {
    const {provider, providerId, email, firstName, lastName, displayName, avatar} =
      oauthProfile;

    // Generate username from email or display name
    let username = email.split("@")[0];
    
    // Check if username exists and make it unique
    let existingProfile = await UserProfile.findByUsername(username);
    let counter = 1;
    while (existingProfile) {
      username = `${email.split("@")[0]}${counter}`;
      existingProfile = await UserProfile.findByUsername(username);
      counter++;
    }

    // Create profile
    const profile = new UserProfile({
      firstName: firstName || displayName?.split(" ")[0] || "User",
      lastName: lastName || displayName?.split(" ").slice(1).join(" ") || "",
      username,
      avatar,
      user: null,
    });

    // Create user with social login
    const user = new User({
      email: email.toLowerCase(),
      password: undefined, // No password for social login users
      profile: profile._id,
      socialLogins: [
        {
          provider,
          providerId,
        },
      ],
      isEmailVerified: true, // Email is verified by OAuth provider
      preferences: {
        theme: "light",
        notifications: true,
        language: "en",
      },
      stats: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
      },
    });

    // Link profile to user
    profile.user = user._id as any;

    // Save both
    await Promise.all([user.save(), profile.save()]);

    return {user, profile};
  }

  /**
   * Get linked social accounts for user
   *
   * @param userId - User ID
   * @returns List of linked providers
   */
  async getLinkedAccounts(userId: string): Promise<{
    providers: Array<{provider: string; linkedAt?: Date}>;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    const providers =
      user.socialLogins?.map((login) => ({
        provider: login.provider,
        linkedAt: login.createdAt,
      })) || [];

    return {providers};
  }
}
