import passport from "passport";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import {Strategy as FacebookStrategy} from "passport-facebook";
import {Strategy as GitHubStrategy} from "passport-github2";
import {User} from "../../modules/users/domain/models";
import {Profile} from "../../modules/users/domain/models";
import config from "./index";
import logger from "../infrastructure/logging";

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id).populate("profile");
    done(null, user);
  } catch (error) {
    done(error as Error, false);
  }
});

// Google OAuth Strategy
if (config.oauth.google.clientId && config.oauth.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: `/api/v1/auth/google/callback`,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any
      ) => {
        try {
          // Check if user already exists with this Google account
          let user = await User.findBySocialLogin("google", profile.id);

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findByEmail(email);
            if (user) {
              // Add Google social login to existing account
              user.socialLogins.push({
                provider: "google",
                providerId: profile.id,
                email: email,
                name: profile.displayName,
                profileUrl: profile.profileUrl,
              });
              user.isEmailVerified = true; // Trust Google verification
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          const newProfile = new Profile({
            firstName:
              profile.name?.givenName ||
              profile.displayName?.split(" ")[0] ||
              "User",
            lastName:
              profile.name?.familyName ||
              profile.displayName?.split(" ").slice(1).join(" ") ||
              "",
            username:
              `${profile.name?.givenName || "user"}${Date.now()}`.toLowerCase(),
            user: null, // Will be set after user creation
          });

          const newUser = new User({
            email: email?.toLowerCase(),
            profile: newProfile._id,
            isEmailVerified: true,
            socialLogins: [
              {
                provider: "google",
                providerId: profile.id,
                email: email,
                name: profile.displayName,
                profileUrl: profile.profileUrl,
              },
            ],
            preferences: {
              theme: "light",
              notifications: true,
              language: "en",
            },
          });

          // Set user reference in profile
          newProfile.user = newUser._id as any;

          // Save both documents
          await Promise.all([newUser.save(), newProfile.save()]);

          logger.info(`New user created via Google OAuth: ${email}`, {
            userId: newUser.id,
          });
          done(null, newUser);
        } catch (error) {
          logger.error("Google OAuth error:", error);
          done(error as Error, false);
        }
      }
    )
  );
}

// GitHub OAuth Strategy
if (config.oauth.github.clientId && config.oauth.github.clientSecret) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.oauth.github.clientId,
        clientSecret: config.oauth.github.clientSecret,
        callbackURL: `/api/v1/auth/github/callback`,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any
      ) => {
        try {
          // Check if user already exists with this GitHub account
          let user = await User.findBySocialLogin("github", profile.id);

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findByEmail(email);
            if (user) {
              // Add GitHub social login to existing account
              user.socialLogins.push({
                provider: "github",
                providerId: profile.id,
                email: email,
                name: profile.displayName || profile.username,
                profileUrl: profile.profileUrl,
              });
              user.isEmailVerified = true;
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          const newProfile = new Profile({
            firstName:
              profile.displayName?.split(" ")[0] || profile.username || "User",
            lastName: profile.displayName?.split(" ").slice(1).join(" ") || "",
            username:
              `${profile.username || "user"}${Date.now()}`.toLowerCase(),
            user: null,
          });

          const newUser = new User({
            email: email?.toLowerCase(),
            profile: newProfile._id,
            isEmailVerified: !!email,
            socialLogins: [
              {
                provider: "github",
                providerId: profile.id,
                email: email,
                name: profile.displayName || profile.username,
                profileUrl: profile.profileUrl,
              },
            ],
            preferences: {
              theme: "light",
              notifications: true,
              language: "en",
            },
          });

          newProfile.user = newUser._id as any;
          await Promise.all([newUser.save(), newProfile.save()]);

          logger.info(`New user created via GitHub OAuth: ${email}`, {
            userId: newUser.id,
          });
          done(null, newUser);
        } catch (error) {
          logger.error("GitHub OAuth error:", error);
          done(error as Error, false);
        }
      }
    )
  );
}

// Facebook OAuth Strategy
if (config.oauth.facebook.clientId && config.oauth.facebook.clientSecret) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: config.oauth.facebook.clientId,
        clientSecret: config.oauth.facebook.clientSecret,
        callbackURL: `/api/v1/auth/facebook/callback`,
        profileFields: ["id", "emails", "name", "displayName"],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any
      ) => {
        try {
          // Check if user already exists with this Facebook account
          let user = await User.findBySocialLogin("facebook", profile.id);

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findByEmail(email);
            if (user) {
              // Add Facebook social login to existing account
              user.socialLogins.push({
                provider: "facebook",
                providerId: profile.id,
                email: email,
                name: profile.displayName,
                profileUrl: profile.profileUrl,
              });
              user.isEmailVerified = true;
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          const newProfile = new Profile({
            firstName:
              profile.name?.givenName ||
              profile.displayName?.split(" ")[0] ||
              "User",
            lastName:
              profile.name?.familyName ||
              profile.displayName?.split(" ").slice(1).join(" ") ||
              "",
            username:
              `${profile.name?.givenName || "user"}${Date.now()}`.toLowerCase(),
            user: null,
          });

          const newUser = new User({
            email: email?.toLowerCase(),
            profile: newProfile._id,
            isEmailVerified: !!email,
            socialLogins: [
              {
                provider: "facebook",
                providerId: profile.id,
                email: email,
                name: profile.displayName,
                profileUrl: profile.profileUrl,
              },
            ],
            preferences: {
              theme: "light",
              notifications: true,
              language: "en",
            },
          });

          newProfile.user = newUser._id as any;
          await Promise.all([newUser.save(), newProfile.save()]);

          logger.info(`New user created via Facebook OAuth: ${email}`, {
            userId: newUser.id,
          });
          done(null, newUser);
        } catch (error) {
          logger.error("Facebook OAuth error:", error);
          done(error as Error, false);
        }
      }
    )
  );
}

export default passport;
