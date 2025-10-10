import { Document, Types } from "mongoose";

// User related types
export interface ISocialLogin {
  provider: "google" | "facebook" | "github";
  providerId: string;
  email?: string;
  name?: string;
  profileUrl?: string;
}

export interface IMFASettings {
  isEnabled: boolean;
  secret?: string;
  backupCodes: string[];
  lastUsedAt?: Date;
}

export interface ISecuritySettings {
  loginAttempts: number;
  lockUntil?: Date;
  lastFailedLogin?: Date;
  allowedIPs: string[];
  trustedDevices: string[];
}

export interface IUser extends Document {
  email: string;
  password?: string; // Made optional for SSO-only users
  profile: Types.ObjectId;
  preferences: Record<string, unknown>;
  stats: Record<string, unknown>;
  friends: Types.ObjectId[];
  followers: Types.ObjectId[];
  achievements: Types.ObjectId[];
  isEmailVerified: boolean;
  refreshTokens: string[];
  lastLoginAt?: Date;
  isActive: boolean;
  role: "user" | "admin" | "moderator";
  socialLogins: ISocialLogin[];
  mfaSettings: IMFASettings;
  securitySettings: ISecuritySettings;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  addRefreshToken(token: string): void;
  removeRefreshToken(token: string): void;
  clearRefreshTokens(): void;
  isAccountLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

export interface IUserStatics {
  findByEmail(email: string): Promise<IUser | null>;
  findBySocialLogin(
    provider: string,
    providerId: string
  ): Promise<IUser | null>;
}

export interface IProfile extends Document {
  user: Types.ObjectId;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  bio?: string;
  achievements: Types.ObjectId[];
  qrCode?: string;
  dateOfBirth?: Date;
  location?: string;
  phoneNumber?: string;

  // Virtual properties
  fullName: string;
  displayName: string;
  achievementCount: number;
  age: number | null;
}

export interface IProfileStatics {
  findByUsername(username: string): Promise<IProfile | null>;
  searchProfiles(query: string, limit?: number): Promise<IProfile[]>;
}

// Match related types
export enum MatchType {
  PUBLIC = "public",
  PRIVATE = "private",
}

export enum MatchStatus {
  UPCOMING = "upcoming",
  ONGOING = "ongoing",
  COMPLETED = "completed",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

export interface IMatch extends Document {
  type: MatchType;
  status: MatchStatus;
  participants: Types.ObjectId[];
  schedule: {
    date: Date;
    time: string;
    timezone: string;
    duration?: number;
  };
  venue: Types.ObjectId;
  rules: Record<string, unknown>;
  chat: Types.ObjectId;
  sport: string;
  createdBy: Types.ObjectId;
  scores?: Record<string, number>;
  winner?: Types.ObjectId;
  metadata?: Record<string, unknown>;

  // Virtual properties
  scheduledDateTime: Date | null;
  isUpcoming: boolean;
  isExpired: boolean;
  participantCount: number;
  formattedDuration: string | null;
}

// Tournament related types
export enum TournamentStatus {
  UPCOMING = "upcoming",
  ONGOING = "ongoing",
  COMPLETED = "completed",
}

export interface ITournament extends Document {
  name: string;
  description?: string;
  matches: Types.ObjectId[];
  bracket: Record<string, unknown>;
  standings: Types.ObjectId[];
  rules: Record<string, unknown>;
  chat: Types.ObjectId;
  status: TournamentStatus;
  createdBy: Types.ObjectId;
  participants: Types.ObjectId[];
  startDate: Date;
  endDate?: Date;
  maxParticipants?: number;
  entryFee?: number;
  prizes?: Record<string, unknown>;

  // Virtual properties
  participantCount: number;
  matchCount: number;
  isFull: boolean;
  canStart: boolean;
  duration: number | null;
}

// Notification types
export enum NotificationType {
  MATCH = "match",
  TOURNAMENT = "tournament",
  TEAM = "team",
  SYSTEM = "system",
  CHAT = "chat",
  ALERT = "alert",
}

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: Record<string, unknown>;
  relatedEntity?: {
    type: string;
    id: Types.ObjectId;
  };
  expiresAt?: Date;
}

// Chat related types
export enum ChatType {
  DIRECT = "direct",
  GROUP = "group",
  MATCH = "match",
  TOURNAMENT = "tournament",
  TEAM = "team",
}

export enum MessageType {
  TEXT = "text",
  MEDIA = "media",
  SYSTEM = "system",
  FILE = "file",
}

export interface IChat extends Document {
  type: "direct" | "group" | "match" | "tournament" | "team";
  name?: string;
  participants: Types.ObjectId[];
  messages: Types.ObjectId[];
  media: Types.ObjectId[];
  reactions: Record<string, unknown>;
  threads: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  lastActivity: Date;
  isActive: boolean;
  metadata?: Record<string, unknown>;

  // Instance methods
  addParticipant(userId: string): void;
  removeParticipant(userId: string): void;
  isParticipant(userId: string): boolean;
  updateActivity(): void;
}

export interface IChatStatics {
  findByUser(userId: string): Promise<IChat[]>;
  findDirectChat(user1: string, user2: string): Promise<IChat | null>;
}

export interface IMessage extends Document {
  sender: Types.ObjectId;
  chat: Types.ObjectId;
  content: string;
  timestamp: Date;
  media: Types.ObjectId[];
  reactions: Record<string, { users: Types.ObjectId[]; count: number }>;
  thread?: Types.ObjectId;
  messageType: "text" | "media" | "system" | "file";
  editedAt?: Date;
  deletedAt?: Date;
  isSystem: boolean;
  replyTo?: Types.ObjectId;

  // Instance methods
  addReaction(emoji: string, userId: string): void;
  removeReaction(emoji: string, userId: string): void;
  softDelete(): void;
  editContent(newContent: string): void;
}

export interface IMessageStatics {
  findByChat(
    chatId: string,
    limit?: number,
    before?: Date
  ): Promise<IMessage[]>;
}

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  FILE = "file",
}

export interface IMedia extends Document {
  url: string;
  type: MediaType;
  filename: string;
  mimetype: string;
  size: number;
  uploadedBy: Types.ObjectId;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  thumbnailUrl?: string;
  isPublic: boolean;
}

export interface IThread extends Document {
  parentMessage: Types.ObjectId;
  messages: Types.ObjectId[];
  chat: Types.ObjectId;
  participants: Types.ObjectId[];
  lastActivity: Date;
}

// Settings types
export interface ISettings extends Document {
  user: Types.ObjectId;
  account: {
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  preferences: {
    theme: "light" | "dark" | "auto";
    sportPreferences: string[];
    units: "metric" | "imperial";
  };
  privacy: {
    profileVisibility: "public" | "friends" | "private";
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    showAchievements: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
  };
  support: {
    helpCenter: boolean;
    bugReporting: boolean;
  };
}

// AdminTool types
export interface IAdminTool extends Document {
  user: Types.ObjectId;
  permissions: string[];
  roster: Types.ObjectId[];
  scoreInput: Record<string, unknown>;
  bracketEditor: Record<string, unknown>;
  analytics: Record<string, unknown>;
  refunds: Record<string, unknown>;
  eventId: Types.ObjectId;
  eventType: "match" | "tournament";
}

// Team related types
export enum TeamRole {
  CAPTAIN = "captain",
  PLAYER = "player",
}

export interface ITeamMember {
  user: Types.ObjectId;
  role: TeamRole;
  joinedAt: Date;
}

export interface ITeam extends Document {
  name: string;
  description?: string;
  sport?: string;
  members: ITeamMember[];
  captain: Types.ObjectId;
  createdBy: Types.ObjectId;
  chat: Types.ObjectId;
  isActive: boolean;
  maxMembers?: number;
  metadata?: Record<string, unknown>;

  // Virtual properties
  memberCount: number;
  isFull: boolean;

  // Instance methods
  addMember(userId: string, role?: TeamRole): void;
  removeMember(userId: string): void;
  isMember(userId: string): boolean;
  isCaptain(userId: string): boolean;
  updateMemberRole(userId: string, role: TeamRole): void;
  transferCaptaincy(newCaptainId: string): void;
}

export interface ITeamStatics {
  findByUser(userId: string): Promise<ITeam[]>;
  findBySport(sport: string, limit?: number): Promise<ITeam[]>;
}

// Venue types
export interface IVenue extends Document {
  name: string;
  description?: string;
  location: {
    coordinates: [number, number]; // [longitude, latitude] for GeoJSON
    address: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
  };
  surfaceType:
    | "grass"
    | "clay"
    | "hard"
    | "indoor"
    | "outdoor"
    | "sand"
    | "pool"
    | "court";
  capacity?: number;
  amenities: string[];
  operatingHours?: {
    [key in
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday"]?: {
      open: string;
      close: string;
    };
  };
  isPublic: boolean;
  createdBy: Types.ObjectId;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  pricing?: {
    hourlyRate?: number;
    currency: string;
  };
  images?: Array<{
    url: string;
    caption?: string;
    isPrimary?: boolean;
  }>;
  rating: {
    average: number;
    count: number;
  };
  isActive: boolean;
  // Virtuals
  fullAddress: string;
  primaryImage: any;
  isCurrentlyOpen: boolean;
  // Methods
  isAvailableAt(date: Date): boolean;
  distanceFrom(lat: number, lng: number): number;
}

// Achievement types
export interface IAchievement extends Document {
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: Record<string, unknown>;
  points: number;
  isActive: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}

// JWT Payload type
export interface IJWTPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

// API Response types
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    timestamp: Date;
    version: string;
  };
}

// Error types
export interface IApiError {
  message: string;
  statusCode: number;
  code?: string;
  details?: unknown;
  stack?: string;
}

// Pagination types
export interface IPaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
  populate?: string[];
}

export interface IPaginatedResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number;
  prevPage?: number;
}

// Query types
export interface IQueryOptions {
  filter?: Record<string, unknown>;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  populate?: string[];
  select?: string;
}

export interface IUpdateOptions {
  new?: boolean;
  runValidators?: boolean;
  upsert?: boolean;
}

// Socket.IO types
export interface ISocketUser {
  userId: string;
  socketId: string;
  isOnline: boolean;
  lastSeen: Date;
}

// Real-time event types
export interface IRealTimeEvent {
  type: string;
  payload: unknown;
  timestamp: Date;
  room?: string;
  sender?: string;
}

// API Key types
export interface IApiKey extends Document {
  name: string;
  keyHash: string;
  userId: Types.ObjectId;
  permissions: string[];
  isActive: boolean;
  lastUsedAt?: Date;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  allowedIPs: string[];
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  // Instance methods
  validateKey(providedKey: string): boolean;
  updateLastUsed(): Promise<void>;
}

export interface IApiKeyStatics {
  findByHash(keyHash: string): Promise<IApiKey | null>;
  generateApiKey(): { key: string; hash: string };
}
