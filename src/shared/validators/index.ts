import {body, param, query} from "express-validator";
import {isValidObjectId, isValidPassword} from "../middleware/validation";

const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

const ensureObjectId =
  (message: string) =>
  (value: string): boolean => {
    if (!isValidObjectId(value)) {
      throw new Error(message);
    }
    return true;
  };

const ensureFutureDate =
  (message: string) =>
  (value: string): boolean => {
    const date = new Date(value);
    if (date <= new Date()) {
      throw new Error(message);
    }
    return true;
  };

const ensurePasswordStrength =
  (message: string) =>
  (value: string): boolean => {
    if (!isValidPassword(value)) {
      throw new Error(message);
    }
    return true;
  };

// Auth validation schemas
export const registerValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({min: 8})
    .withMessage("Password must be at least 8 characters long")
    .custom(
      ensurePasswordStrength(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      )
    ),
  body("firstName")
    .trim()
    .isLength({min: 1, max: 50})
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({min: 1, max: 50})
    .withMessage("Last name must be between 1 and 50 characters"),
  body("username")
    .trim()
    .isLength({min: 3, max: 30})
    .withMessage("Username must be between 3 and 30 characters")
    .matches(USERNAME_REGEX)
    .withMessage(
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
];

export const updateProfileValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({min: 1, max: 50})
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({min: 1, max: 50})
    .withMessage("Last name must be between 1 and 50 characters"),
  body("bio")
    .optional()
    .trim()
    .isLength({max: 500})
    .withMessage("Bio cannot exceed 500 characters"),
  body("location")
    .optional()
    .trim()
    .isLength({max: 100})
    .withMessage("Location cannot exceed 100 characters"),
  body("phoneNumber")
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Please provide a valid phone number"),
  body("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
];

export const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

export const refreshTokenValidation = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

export const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({min: 8})
    .withMessage("New password must be at least 8 characters long")
    .custom(
      ensurePasswordStrength(
        "New password must contain at least one uppercase letter, one lowercase letter, and one number"
      )
    ),
];

// User validation schemas
export const getUserValidation = [
  param("id").custom(ensureObjectId("Invalid user ID")),
];

// Match validation schemas
export const createMatchValidation = [
  body("type")
    .isIn(["public", "private"])
    .withMessage("Match type must be either public or private"),
  body("sport")
    .trim()
    .notEmpty()
    .withMessage("Sport is required")
    .isLength({max: 50})
    .withMessage("Sport name cannot exceed 50 characters"),
  body("schedule.date")
    .isISO8601()
    .withMessage("Please provide a valid date")
    .custom(ensureFutureDate("Match date must be in the future")),
  body("schedule.time")
    .matches(TIME_REGEX)
    .withMessage("Time must be in HH:MM format"),
  body("schedule.timezone").notEmpty().withMessage("Timezone is required"),
  body("schedule.duration")
    .optional()
    .isInt({min: 1, max: 480})
    .withMessage("Duration must be between 1 and 480 minutes"),
  body("venue").custom(ensureObjectId("Invalid venue ID")),
  body("participants")
    .optional()
    .isArray({min: 0, max: 50})
    .withMessage("Participants must be an array with maximum 50 members")
    .custom((participants: string[]) => {
      if (participants && !participants.every(isValidObjectId)) {
        throw new Error("All participant IDs must be valid");
      }
      return true;
    }),
];

export const updateMatchValidation = [
  param("id").custom(ensureObjectId("Invalid match ID")),
  body("type")
    .optional()
    .isIn(["public", "private"])
    .withMessage("Match type must be either public or private"),
  body("status")
    .optional()
    .isIn(["upcoming", "ongoing", "completed", "expired"])
    .withMessage("Invalid match status"),
  body("schedule.date")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date"),
  body("schedule.time")
    .optional()
    .matches(TIME_REGEX)
    .withMessage("Time must be in HH:MM format"),
];

// Tournament validation schemas
export const createTournamentValidation = [
  body("name")
    .trim()
    .isLength({min: 1, max: 100})
    .withMessage("Tournament name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({max: 1000})
    .withMessage("Description cannot exceed 1000 characters"),
  body("startDate")
    .isISO8601()
    .withMessage("Please provide a valid start date")
    .custom(ensureFutureDate("Start date must be in the future")),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid end date")
    .custom((value: string, {req}) => {
      if (value && req.body.startDate) {
        const endDate = new Date(value);
        const startDate = new Date(req.body.startDate);
        if (endDate <= startDate) {
          throw new Error("End date must be after start date");
        }
      }
      return true;
    }),
  body("maxParticipants")
    .optional()
    .isInt({min: 4, max: 256})
    .withMessage("Maximum participants must be between 4 and 256"),
  body("entryFee")
    .optional()
    .isFloat({min: 0})
    .withMessage("Entry fee cannot be negative"),
];

// Venue validation schemas
export const createVenueValidation = [
  body("name")
    .trim()
    .isLength({min: 1, max: 100})
    .withMessage("Venue name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({max: 1000})
    .withMessage("Description cannot exceed 1000 characters"),
  body("location.lat")
    .isFloat({min: -90, max: 90})
    .withMessage("Latitude must be between -90 and 90"),
  body("location.lng")
    .isFloat({min: -180, max: 180})
    .withMessage("Longitude must be between -180 and 180"),
  body("location.address").trim().notEmpty().withMessage("Address is required"),
  body("location.city").trim().notEmpty().withMessage("City is required"),
  body("location.country").trim().notEmpty().withMessage("Country is required"),
  body("surfaceType").trim().notEmpty().withMessage("Surface type is required"),
  body("capacity")
    .isInt({min: 1})
    .withMessage("Capacity must be a positive integer"),
  body("contactInfo.email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email address"),
];

// Chat validation schemas
export const createChatValidation = [
  body("type")
    .isIn(["direct", "group", "match", "tournament"])
    .withMessage("Invalid chat type"),
  body("participants")
    .isArray({min: 1})
    .withMessage("Participants array is required")
    .custom((participants: string[]) => {
      if (!participants.every(isValidObjectId)) {
        throw new Error("All participant IDs must be valid");
      }
      return true;
    }),
  body("name")
    .optional()
    .trim()
    .isLength({max: 100})
    .withMessage("Chat name cannot exceed 100 characters"),
];

export const createMessageValidation = [
  body("content")
    .optional()
    .trim()
    .isLength({min: 1, max: 2000})
    .withMessage("Message content must be between 1 and 2000 characters"),
  body("messageType")
    .optional()
    .isIn(["text", "media", "system", "file"])
    .withMessage("Invalid message type"),
  body("replyTo")
    .optional()
    .custom(ensureObjectId("Invalid message ID for reply")),
];

// Notification validation schemas
export const createNotificationValidation = [
  body("type")
    .isIn(["match", "tournament", "system", "chat", "alert"])
    .withMessage("Invalid notification type"),
  body("title")
    .trim()
    .isLength({min: 1, max: 100})
    .withMessage("Title must be between 1 and 100 characters"),
  body("message")
    .trim()
    .isLength({min: 1, max: 500})
    .withMessage("Message must be between 1 and 500 characters"),
  body("user").custom(ensureObjectId("Invalid user ID")),
];

// Pagination validation
export const paginationValidation = [
  query("page")
    .optional()
    .isInt({min: 1})
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({min: 1, max: 100})
    .withMessage("Limit must be between 1 and 100"),
  query("sort").optional().isString().withMessage("Sort must be a string"),
];

// Team validation schemas
export const createTeamValidation = [
  body("name")
    .trim()
    .isLength({min: 2, max: 100})
    .withMessage("Team name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({max: 500})
    .withMessage("Description cannot exceed 500 characters"),
  body("sport")
    .optional()
    .trim()
    .isLength({max: 50})
    .withMessage("Sport name cannot exceed 50 characters"),
  body("maxMembers")
    .optional()
    .isInt({min: 2, max: 50})
    .withMessage("Max members must be between 2 and 50"),
];

export const updateTeamValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({min: 2, max: 100})
    .withMessage("Team name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({max: 500})
    .withMessage("Description cannot exceed 500 characters"),
  body("sport")
    .optional()
    .trim()
    .isLength({max: 50})
    .withMessage("Sport name cannot exceed 50 characters"),
  body("maxMembers")
    .optional()
    .isInt({min: 2, max: 50})
    .withMessage("Max members must be between 2 and 50"),
];

export const updateMemberRoleValidation = [
  body("role")
    .isIn(["captain", "player"])
    .withMessage("Role must be either captain or player"),
];

export const transferCaptaincyValidation = [
  body("newCaptainId").custom(ensureObjectId("Invalid user ID format")),
];

export const teamQueryValidation = [
  query("sport").optional().isString().withMessage("Sport must be a string"),
  query("search").optional().isString().withMessage("Search must be a string"),
  query("page")
    .optional()
    .isInt({min: 1})
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({min: 1, max: 100})
    .withMessage("Limit must be between 1 and 100"),
];

// ID parameter validation
export const idParamValidation = [
  param("id").custom(ensureObjectId("Invalid ID format")),
];
