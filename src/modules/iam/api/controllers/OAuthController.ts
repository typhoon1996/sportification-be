import {Request, Response, NextFunction} from "express";
import passport from "passport";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import {Strategy as FacebookStrategy} from "passport-facebook";
import {Strategy as GitHubStrategy} from "passport-github2";
import config from "../../../../shared/config";
import {AuthRequest} from "../../../../shared/middleware/auth";
import {
  sendSuccess,
  asyncHandler,
} from "../../../../shared/middleware/errorHandler";
import {OAuthService, IOAuthProfile} from "../../domain/services/OAuthService";
import {AuditLogger} from "../../../../shared/services/audit";
import logger from "../../../../shared/infrastructure/logging";

/**
 * OAuthController - Social Login Controller
 *
 * Handles OAuth authentication with Google, Facebook, and GitHub.
 * Provides endpoints for:
 * - Initiating OAuth flow
 * - Handling OAuth callbacks
 * - Linking/unlinking social accounts
 * - Getting linked accounts
 *
 * @class OAuthController
 */
export class OAuthController {
  private readonly oauthService: OAuthService;

  constructor() {
    this.oauthService = new OAuthService();
    this.initializePassportStrategies();
  }

  /**
   * Initialize Passport strategies for OAuth providers
   *
   * @private
   */
  private initializePassportStrategies(): void {
    // Google OAuth Strategy
    if (config.oauth?.google?.clientId && config.oauth?.google?.clientSecret) {
      passport.use(
        new GoogleStrategy(
          {
            clientID: config.oauth.google.clientId,
            clientSecret: config.oauth.google.clientSecret,
            callbackURL: config.oauth.google.callbackURL || "/api/v1/oauth/google/callback",
          },
          (accessToken, refreshToken, profile, done) => {
            const oauthProfile: IOAuthProfile = {
              provider: "google",
              providerId: profile.id,
              email: profile.emails?.[0]?.value || "",
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              displayName: profile.displayName,
              avatar: profile.photos?.[0]?.value,
            };
            done(null, oauthProfile);
          }
        )
      );
    }

    // Facebook OAuth Strategy
    if (config.oauth?.facebook?.clientId && config.oauth?.facebook?.clientSecret) {
      passport.use(
        new FacebookStrategy(
          {
            clientID: config.oauth.facebook.clientId,
            clientSecret: config.oauth.facebook.clientSecret,
            callbackURL: config.oauth.facebook.callbackURL || "/api/v1/oauth/facebook/callback",
            profileFields: ["id", "emails", "name", "picture.type(large)"],
          },
          (accessToken, refreshToken, profile, done) => {
            const oauthProfile: IOAuthProfile = {
              provider: "facebook",
              providerId: profile.id,
              email: profile.emails?.[0]?.value || "",
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              displayName: profile.displayName,
              avatar: profile.photos?.[0]?.value,
            };
            done(null, oauthProfile);
          }
        )
      );
    }

    // GitHub OAuth Strategy
    if (config.oauth?.github?.clientId && config.oauth?.github?.clientSecret) {
      passport.use(
        new GitHubStrategy(
          {
            clientID: config.oauth.github.clientId,
            clientSecret: config.oauth.github.clientSecret,
            callbackURL: config.oauth.github.callbackURL || "/api/v1/oauth/github/callback",
            scope: ["user:email"],
          },
          (accessToken, refreshToken, profile, done) => {
            const oauthProfile: IOAuthProfile = {
              provider: "github",
              providerId: profile.id,
              email: profile.emails?.[0]?.value || "",
              displayName: profile.displayName || profile.username,
              avatar: profile.photos?.[0]?.value,
            };
            done(null, oauthProfile);
          }
        )
      );
    }
  }

  /**
   * Initiate Google OAuth flow
   */
  googleAuth = passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  });

  /**
   * Handle Google OAuth callback
   */
  googleCallback = [
    passport.authenticate("google", {session: false, failureRedirect: "/login"}),
    asyncHandler(async (req: Request, res: Response) => {
      const oauthProfile = req.user as IOAuthProfile;

      const result = await this.oauthService.authenticateWithOAuth(oauthProfile);

      await AuditLogger.logSecurity({
        req,
        action: "oauth_login",
        userId: result.user.id,
        status: "success",
        details: {
          provider: "google",
          isNewUser: result.isNewUser,
        },
      });

      // In a real application, you'd redirect to the frontend with tokens
      // For API-only, return JSON
      res.json({
        success: true,
        data: result,
        message: result.isNewUser
          ? "Account created successfully"
          : "Logged in successfully",
      });
    }),
  ];

  /**
   * Initiate Facebook OAuth flow
   */
  facebookAuth = passport.authenticate("facebook", {
    scope: ["email", "public_profile"],
    session: false,
  });

  /**
   * Handle Facebook OAuth callback
   */
  facebookCallback = [
    passport.authenticate("facebook", {
      session: false,
      failureRedirect: "/login",
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const oauthProfile = req.user as IOAuthProfile;

      const result = await this.oauthService.authenticateWithOAuth(oauthProfile);

      await AuditLogger.logSecurity({
        req,
        action: "oauth_login",
        userId: result.user.id,
        status: "success",
        details: {
          provider: "facebook",
          isNewUser: result.isNewUser,
        },
      });

      res.json({
        success: true,
        data: result,
        message: result.isNewUser
          ? "Account created successfully"
          : "Logged in successfully",
      });
    }),
  ];

  /**
   * Initiate GitHub OAuth flow
   */
  githubAuth = passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  });

  /**
   * Handle GitHub OAuth callback
   */
  githubCallback = [
    passport.authenticate("github", {
      session: false,
      failureRedirect: "/login",
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const oauthProfile = req.user as IOAuthProfile;

      const result = await this.oauthService.authenticateWithOAuth(oauthProfile);

      await AuditLogger.logSecurity({
        req,
        action: "oauth_login",
        userId: result.user.id,
        status: "success",
        details: {
          provider: "github",
          isNewUser: result.isNewUser,
        },
      });

      res.json({
        success: true,
        data: result,
        message: result.isNewUser
          ? "Account created successfully"
          : "Logged in successfully",
      });
    }),
  ];

  /**
   * Link social account to authenticated user
   */
  linkAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {provider, providerId, email} = req.body;

    const oauthProfile: IOAuthProfile = {
      provider,
      providerId,
      email,
    };

    await this.oauthService.linkSocialAccount(req.userId, oauthProfile);

    logger.info("Social account linked", {
      userId: req.userId,
      provider,
    });

    await AuditLogger.logSecurity({
      req,
      action: "oauth_account_linked",
      userId: req.userId,
      status: "success",
      details: {provider},
    });

    sendSuccess(res, null, "Social account linked successfully");
  });

  /**
   * Unlink social account from authenticated user
   */
  unlinkAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {provider} = req.params;

    await this.oauthService.unlinkSocialAccount(req.userId, provider);

    logger.info("Social account unlinked", {
      userId: req.userId,
      provider,
    });

    await AuditLogger.logSecurity({
      req,
      action: "oauth_account_unlinked",
      userId: req.userId,
      status: "success",
      details: {provider},
    });

    sendSuccess(res, null, "Social account unlinked successfully");
  });

  /**
   * Get linked social accounts
   */
  getLinkedAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await this.oauthService.getLinkedAccounts(req.userId);

    sendSuccess(res, result);
  });
}

export const oauthController = new OAuthController();
