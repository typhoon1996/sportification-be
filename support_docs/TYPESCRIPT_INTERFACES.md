# TypeScript Interfaces for Frontend Development

## Sports Companion API - TypeScript Type Definitions

This file contains comprehensive TypeScript interfaces for the Sports Companion API to ensure type safety in frontend development.

---

## Table of Contents

1. [Base Types](#base-types)
2. [User & Authentication](#user--authentication)
3. [Matches & Sports](#matches--sports)
4. [Tournaments](#tournaments)
5. [Teams](#teams)
6. [Chat & Messaging](#chat--messaging)
7. [Notifications](#notifications)
8. [Admin Analytics & Management](#admin-analytics--management)
9. [API Responses](#api-responses)
10. [WebSocket Events](#websocket-events)
11. [Utility Types](#utility-types)

---

## Usage

Save this content as a TypeScript declaration file (e.g., `src/types/api.ts`) in your frontend project:

```typescript
// Copy and paste the interfaces below into your project
```

---

## Base Types

```typescript
// Basic ID type
export type ObjectId = string;

// Common status types
export type MatchStatus = 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
export type TournamentStatus = 'registration_open' | 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
export type ChatType = 'direct' | 'group' | 'match' | 'tournament';
export type MessageType = 'text' | 'image' | 'file' | 'system';
export type NotificationType = 'match_invitation' | 'tournament_invitation' | 'new_message' | 'friend_request' | 'match_update' | 'tournament_update';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';
export type UserRole = 'user' | 'admin' | 'moderator';

// Location and coordinates
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: Coordinates;
}

// Date and time
export interface Schedule {
  date: string; // ISO date string
  time: string; // HH:MM format
  timezone: string;
  duration?: number; // minutes
}
```

---

## User & Authentication

```typescript
// User profile statistics
export interface UserStatistics {
  matchesPlayed: number;
  matchesWon: number;
  winRate: number;
  tournamentsJoined: number;
  tournamentsWon: number;
  averageRating?: number;
  totalPointsEarned?: number;
}

// User achievements
export interface Achievement {
  type: string;
  title: string;
  description: string;
  earnedAt: string;
  icon?: string;
  points?: number;
}

// User profile
export interface UserProfile {
  bio?: string;
  location?: string;
  sports: string[];
  skillLevel: SkillLevel;
  dateOfBirth?: string;
  phoneNumber?: string;
  achievements: Achievement[];
  statistics: UserStatistics;
  preferences?: UserPreferences;
}

// User preferences
export interface UserPreferences {
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showEmail: boolean;
    showLocation: boolean;
    showPhoneNumber: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    types: NotificationType[];
  };
  matching: {
    preferredSports: string[];
    maxDistance?: number;
    skillLevelRange: {
      min: SkillLevel;
      max: SkillLevel;
    };
  };
}

// Social accounts
export interface SocialAccount {
  provider: 'google' | 'facebook' | 'github';
  providerId: string;
  email?: string;
  linkedAt: string;
}

// Security settings
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  allowedIPs: string[];
  sessionTimeout: number;
  loginNotifications: boolean;
}

// Complete user object
export interface User {
  _id: ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  profile: UserProfile;
  socialAccounts?: SocialAccount[];
  securitySettings?: SecuritySettings;
  lastLoginAt?: string;
  lastActiveAt?: string;
  isOnline?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Authentication request/response types
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  profile?: Partial<UserProfile>;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}
```

---

## Matches & Sports

```typescript
// Match rules and configuration
export interface MatchRules {
  format: 'singles' | 'doubles' | 'team';
  scoringSystem: 'traditional' | 'no-ad' | 'timed';
  equipment: 'provided' | 'bring_own' | 'shared';
  skillLevel?: SkillLevel;
  duration?: number; // minutes
  maxSets?: number;
  tiebreakRules?: string;
}

// Match requirements
export interface MatchRequirements {
  minSkillLevel?: SkillLevel;
  maxSkillLevel?: SkillLevel;
  ageRange?: {
    min: number;
    max: number;
  };
  gender?: 'male' | 'female' | 'mixed';
  experience?: string;
}

// Venue information
export interface Venue {
  _id: ObjectId;
  name: string;
  description?: string;
  location: Location;
  amenities: string[];
  sports: string[];
  capacity?: number;
  hourlyRate?: number;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  images?: string[];
  ratings?: {
    average: number;
    count: number;
  };
  availability?: VenueAvailability[];
}

export interface VenueAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  openTime: string; // HH:MM
  closeTime: string; // HH:MM
  isAvailable: boolean;
}

// Match participant
export interface MatchParticipant {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  username: string;
  profile: {
    skillLevel: SkillLevel;
    sports: string[];
  };
  role: 'organizer' | 'participant';
  joinedAt: string;
  status: 'confirmed' | 'pending' | 'declined';
}

// Match result
export interface MatchResult {
  scores: Array<{
    playerId: ObjectId;
    sets: number[];
    totalGames: number;
    winner: boolean;
  }>;
  duration: number; // minutes
  completedAt: string;
  notes?: string;
}

// Complete match object
export interface Match {
  _id: ObjectId;
  type: 'public' | 'private';
  sport: string;
  title: string;
  description?: string;
  participants: MatchParticipant[];
  maxParticipants: number;
  currentParticipants: number;
  status: MatchStatus;
  schedule: Schedule;
  venue: Venue;
  rules: MatchRules;
  requirements?: MatchRequirements;
  organizer: {
    _id: ObjectId;
    firstName: string;
    lastName: string;
    username: string;
  };
  chat?: {
    _id: ObjectId;
    unreadCount?: number;
  };
  result?: MatchResult;
  tags?: string[];
  inviteCode?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // for weekly
  endDate?: string;
  maxOccurrences?: number;
}

// Match creation request
export interface CreateMatchRequest {
  type: 'public' | 'private';
  sport: string;
  title: string;
  description?: string;
  maxParticipants: number;
  schedule: Schedule;
  venue: ObjectId;
  rules: MatchRules;
  requirements?: MatchRequirements;
  tags?: string[];
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
}

// Match filters
export interface MatchFilters {
  sport?: string;
  status?: MatchStatus;
  type?: 'public' | 'private';
  date?: string;
  location?: string;
  skillLevel?: SkillLevel;
  maxDistance?: number;
  availableOnly?: boolean;
}
```

---

## Tournaments

```typescript
// Tournament rules
export interface TournamentRules {
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  matchFormat: 'best_of_1' | 'best_of_3' | 'best_of_5';
  scoringSystem: 'traditional' | 'no_ad' | 'timed';
  skillLevelRequired?: SkillLevel;
  ageRestrictions?: {
    min?: number;
    max?: number;
  };
  seedingMethod: 'random' | 'ranking' | 'skill_level';
  tiebreakRules?: string;
}

// Tournament bracket
export interface TournamentMatch {
  matchId?: ObjectId;
  player1?: ObjectId;
  player2?: ObjectId;
  winner?: ObjectId;
  status: 'scheduled' | 'in_progress' | 'completed' | 'bye';
  scheduledAt?: string;
  result?: MatchResult;
  position: number; // position in bracket
}

export interface TournamentRound {
  round: number;
  name: string; // e.g., "Final", "Semi-Final", "Quarter-Final"
  matches: TournamentMatch[];
  startDate?: string;
  endDate?: string;
}

export interface TournamentBracket {
  type: 'single_elimination' | 'double_elimination' | 'round_robin';
  rounds: TournamentRound[];
  consolationBracket?: TournamentRound[]; // for double elimination
}

// Prize structure
export interface PrizeStructure {
  total: number;
  currency: string;
  distribution: {
    first: number;
    second: number;
    third?: number;
    fourth?: number;
    [key: string]: number | undefined;
  };
}

// Tournament participant
export interface TournamentParticipant {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  username: string;
  profile: {
    skillLevel: SkillLevel;
    sports: string[];
  };
  seed?: number;
  registeredAt: string;
  status: 'registered' | 'confirmed' | 'withdrawn';
  stats?: {
    matchesPlayed: number;
    matchesWon: number;
    setsWon: number;
    gamesWon: number;
  };
}

// Complete tournament object
export interface Tournament {
  _id: ObjectId;
  name: string;
  description?: string;
  sport: string;
  type: 'elimination' | 'round_robin' | 'swiss';
  format: string;
  participants: TournamentParticipant[];
  maxParticipants: number;
  currentParticipants: number;
  status: TournamentStatus;
  registrationDeadline: string;
  startDate: string;
  endDate: string;
  venue: Venue;
  rules: TournamentRules;
  bracket: TournamentBracket;
  organizer: {
    _id: ObjectId;
    firstName: string;
    lastName: string;
    username: string;
  };
  prize?: PrizeStructure;
  entryFee?: {
    amount: number;
    currency: string;
  };
  sponsors?: Array<{
    name: string;
    logo?: string;
    website?: string;
  }>;
  chat?: {
    _id: ObjectId;
    unreadCount?: number;
  };
  tags?: string[];
  images?: string[];
  livestream?: {
    url: string;
    isLive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// Tournament creation request
export interface CreateTournamentRequest {
  name: string;
  description?: string;
  sport: string;
  type: 'elimination' | 'round_robin' | 'swiss';
  maxParticipants: number;
  registrationDeadline: string;
  startDate: string;
  endDate: string;
  venue: ObjectId;
  rules: TournamentRules;
  prize?: PrizeStructure;
  entryFee?: {
    amount: number;
    currency: string;
  };
  tags?: string[];
}

// Tournament filters
export interface TournamentFilters {
  sport?: string;
  status?: TournamentStatus;
  location?: string;
  skillLevel?: SkillLevel;
  startDate?: string;
  endDate?: string;
  hasEntryFee?: boolean;
  hasPrize?: boolean;
}
```

---

## Teams

```typescript
// Team roles
export enum TeamRole {
  CAPTAIN = 'captain',
  PLAYER = 'player'
}

// Team member
export interface ITeamMember {
  user: ObjectId;
  role: TeamRole;
  joinedAt: Date;
}

// Team interface
export interface ITeam {
  _id: ObjectId;
  name: string;
  description?: string;
  sport?: string;
  members: ITeamMember[];
  captain: ObjectId;
  createdBy: ObjectId;
  chat: ObjectId;
  isActive: boolean;
  maxMembers?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  memberCount: number;
  isFull: boolean;
}

// Team response object
export interface Team {
  _id: ObjectId;
  name: string;
  description?: string;
  sport?: string;
  captain: {
    _id: ObjectId;
    profile: {
      firstName: string;
      lastName: string;
      username: string;
    };
  };
  members: Array<{
    user: {
      _id: ObjectId;
      profile: {
        firstName: string;
        lastName: string;
        username: string;
      };
    };
    role: TeamRole;
    joinedAt: string;
  }>;
  chat: {
    _id: ObjectId;
    type: 'team';
    name: string;
  };
  maxMembers?: number;
  memberCount: number;
  isFull: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create team request
export interface CreateTeamRequest {
  name: string;
  description?: string;
  sport?: string;
  maxMembers?: number;
}

// Update team request
export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  sport?: string;
  maxMembers?: number;
}

// Update member role request
export interface UpdateMemberRoleRequest {
  role: TeamRole;
}

// Transfer captaincy request
export interface TransferCaptaincyRequest {
  newCaptainId: string;
}

// Team query filters
export interface TeamQueryFilters {
  sport?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Team list response
export interface TeamListResponse {
  success: boolean;
  message: string;
  data: {
    teams: Team[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Team response
export interface TeamResponse {
  success: boolean;
  message: string;
  data: {
    team: Team;
  };
}
```

---

## Chat & Messaging

```typescript
// Message reactions
export interface MessageReaction {
  emoji: string;
  users: Array<{
    _id: ObjectId;
    firstName: string;
    lastName?: string;
  }>;
  count: number;
}

// Message reply reference
export interface MessageReply {
  _id: ObjectId;
  content: string;
  sender: {
    _id: ObjectId;
    firstName: string;
    lastName?: string;
  };
  messageType: MessageType;
}

// File attachment
export interface MessageAttachment {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
}

// Complete message object
export interface Message {
  _id: ObjectId;
  chat: ObjectId;
  sender: {
    _id: ObjectId;
    firstName: string;
    lastName: string;
    username: string;
    isOnline?: boolean;
  };
  content: string;
  messageType: MessageType;
  isEdited: boolean;
  editedAt?: string;
  reactions: MessageReaction[];
  replyTo?: MessageReply;
  attachment?: MessageAttachment;
  isDeleted?: boolean;
  deletedAt?: string;
  readBy: Array<{
    user: ObjectId;
    readAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Chat participant
export interface ChatParticipant {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  username: string;
  isOnline: boolean;
  lastActiveAt?: string;
  role?: 'admin' | 'moderator' | 'member';
  joinedAt: string;
}

// Chat settings
export interface ChatSettings {
  notifications: boolean;
  role: 'admin' | 'moderator' | 'member';
  canInvite: boolean;
  canRemove: boolean;
  canEditInfo: boolean;
}

// Complete chat object
export interface Chat {
  _id: ObjectId;
  type: ChatType;
  name?: string; // for group chats
  description?: string;
  participants: ChatParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  settings?: ChatSettings;
  isArchived?: boolean;
  isPinned?: boolean;
  relatedEntity?: {
    type: 'match' | 'tournament';
    id: ObjectId;
  };
  createdBy: {
    _id: ObjectId;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Message creation request
export interface SendMessageRequest {
  content: string;
  messageType: MessageType;
  replyTo?: ObjectId;
  attachment?: File;
}

// Chat creation request
export interface CreateChatRequest {
  type: ChatType;
  name?: string;
  description?: string;
  participants: ObjectId[];
}

// Typing indicator
export interface TypingIndicator {
  userId: ObjectId;
  firstName: string;
  isTyping: boolean;
  chatId: ObjectId;
}
```

---

## Notifications

```typescript
// Notification action
export interface NotificationAction {
  type: 'accept' | 'decline' | 'view' | 'dismiss';
  label: string;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: Record<string, any>;
}

// Notification data
export interface NotificationData {
  matchId?: ObjectId;
  tournamentId?: ObjectId;
  chatId?: ObjectId;
  senderId?: ObjectId;
  inviterId?: ObjectId;
  messagePreview?: string;
  matchTitle?: string;
  tournamentName?: string;
  [key: string]: any;
}

// Complete notification object
export interface Notification {
  _id: ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData;
  recipient: ObjectId;
  isRead: boolean;
  readAt?: string;
  actionRequired: boolean;
  actions?: NotificationAction[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: string;
  category?: string;
  icon?: string;
  createdAt: string;
}

// Notification preferences
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  types: NotificationType[];
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
    timezone: string;
  };
  frequency?: {
    email: 'immediate' | 'hourly' | 'daily' | 'weekly';
    push: 'immediate' | 'grouped';
  };
}

// Notification filters
export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired?: boolean;
  category?: string;
  startDate?: string;
  endDate?: string;
}

// Notification summary
export interface NotificationSummary {
  total: number;
  unread: number;
  actionRequired: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<string, number>;
}
```

---

## Admin Analytics & Management

### Admin User Types

```typescript
// Admin user with enhanced permissions
interface AdminUser extends User {
  role: 'admin';
  adminPermissions: AdminPermission[];
  lastAdminActivity: string;
  adminSince: string;
}

// Admin permissions
export type AdminPermission = 
  | 'analytics:read'
  | 'analytics:export'
  | 'users:manage'
  | 'users:suspend'
  | 'system:monitor'
  | 'reports:generate'
  | 'insights:view';

// Admin session info
interface AdminSession {
  user: AdminUser;
  sessionId: string;
  loginTime: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
}
```

### Analytics Types

```typescript
// Analytics dashboard data
interface AnalyticsDashboard {
  activeUsers: number;
  requestsPerMinute: number[];
  avgResponseTime: number;
  errorRate: number;
  systemHealth: SystemHealthStatus;
  topEndpoints: EndpointMetric[];
  userActivities: UserActivityMetric[];
  deviceBreakdown: DeviceMetric[];
}

// System health status
interface SystemHealthStatus {
  api: 'healthy' | 'warning' | 'critical';
  database: 'healthy' | 'warning' | 'critical';
  cache: 'healthy' | 'warning' | 'critical';
  external_services: 'healthy' | 'warning' | 'critical';
}

// Endpoint performance metrics
interface EndpointMetric {
  endpoint: string;
  requests: number;
  avgResponseTime: number;
  errorRate: number;
  p95ResponseTime: number;
}

// User activity metrics
interface UserActivityMetric {
  timestamp: string;
  activeUsers: number;
  newSessions: number;
  totalActions: number;
  avgSessionDuration: number;
}

// Device breakdown
interface DeviceMetric {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  count: number;
  percentage: number;
}

// User engagement analytics
interface UserEngagementAnalytics {
  summary: {
    totalUsers: number;
    activeUsers: number;
    engagementRate: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  timeline: EngagementTimelinePoint[];
  cohortAnalysis: CohortData;
  featureUsage: FeatureUsageMetric[];
}

interface EngagementTimelinePoint {
  date: string;
  activeUsers: number;
  sessions: number;
  avgDuration: number;
  pageViews: number;
}

interface CohortData {
  week1: number;
  week2: number;
  week4: number;
  week8: number;
  week12: number;
}

interface FeatureUsageMetric {
  feature: string;
  users: number;
  usage: number;
  adoptionRate: number;
}

// Performance analytics
interface PerformanceAnalytics {
  overview: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    totalRequests: number;
    successRate: number;
  };
  timeline: PerformanceTimelinePoint[];
  endpointBreakdown: EndpointPerformance[];
  errorBreakdown: ErrorMetric[];
}

interface PerformanceTimelinePoint {
  timestamp: string;
  responseTime: number;
  errorRate: number;
  throughput: number;
  concurrentUsers: number;
}

interface EndpointPerformance {
  endpoint: string;
  avgResponseTime: number;
  requests: number;
  errorRate: number;
  p95ResponseTime: number;
}

interface ErrorMetric {
  type: string;
  count: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}
```

### Custom Reports

```typescript
// Custom report configuration
interface CustomReportConfig {
  reportType: 'user_retention' | 'feature_adoption' | 'performance_summary' | 'revenue_analysis';
  startDate: string;
  endDate: string;
  dimensions: string[];
  metrics: string[];
  filters: Record<string, any>;
}

// Generated custom report
interface CustomReport {
  reportType: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  data: ReportDataPoint[];
  metadata: {
    totalRecords: number;
    processingTime: number;
    dataQuality: 'high' | 'medium' | 'low';
  };
  summary: ReportSummary;
}

interface ReportDataPoint {
  dimension: string;
  metrics: Record<string, number>;
  trend: number;
  comparison: number;
}

interface ReportSummary {
  keyFindings: string[];
  recommendations: string[];
  trends: TrendIndicator[];
}

interface TrendIndicator {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
  significance: 'high' | 'medium' | 'low';
}
```

### Insights Types

```typescript
// Application insights
interface ApplicationInsights {
  summary: {
    health: 'excellent' | 'good' | 'fair' | 'poor';
    trends: 'positive' | 'neutral' | 'negative';
    alerts: number;
    score: number;
  };
  userInsights: {
    mostActiveHours: string[];
    popularSports: string[];
    engagementPatterns: Record<string, number>;
    churnRisk: ChurnRiskAnalysis;
  };
  activityInsights: {
    peakTimes: PeakTimeAnalysis;
    seasonalTrends: SeasonalTrend[];
    userBehaviorPatterns: BehaviorPattern[];
  };
  performanceInsights: {
    slowestEndpoints: string[];
    recommendedOptimizations: OptimizationRecommendation[];
    capacityForecast: CapacityForecast;
  };
  recommendations: InsightRecommendation[];
}

interface ChurnRiskAnalysis {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  factors: ChurnFactor[];
}

interface ChurnFactor {
  factor: string;
  impact: number;
  actionable: boolean;
}

interface PeakTimeAnalysis {
  daily: TimeSlot[];
  weekly: DayAnalysis[];
  monthly: MonthAnalysis[];
}

interface TimeSlot {
  hour: number;
  activity: number;
  users: number;
}

interface DayAnalysis {
  day: string;
  activity: number;
  trend: number;
}

interface MonthAnalysis {
  month: string;
  activity: number;
  seasonality: number;
}

interface SeasonalTrend {
  period: string;
  trend: number;
  factors: string[];
}

interface BehaviorPattern {
  pattern: string;
  frequency: number;
  userSegment: string;
  significance: number;
}

interface OptimizationRecommendation {
  area: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

interface CapacityForecast {
  currentCapacity: number;
  projectedDemand: number;
  recommendations: string[];
  timeline: CapacityTimelinePoint[];
}

interface CapacityTimelinePoint {
  date: string;
  demand: number;
  capacity: number;
  utilization: number;
}

interface InsightRecommendation {
  type: 'performance' | 'user_experience' | 'security' | 'feature' | 'infrastructure';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  effort: string;
  timeline: string;
}
```

### System Management Types

```typescript
// System overview
interface SystemOverview {
  systemOverview: {
    totalUsers: number;
    totalMatches: number;
    totalTournaments: number;
    systemUptime: number;
    memoryUsage: MemoryUsage;
    diskUsage: DiskUsage;
  };
  securityMetrics: SecurityMetrics;
  performanceProfile: PerformanceProfile;
  databaseStats: DatabaseStats;
}

interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

interface DiskUsage {
  total: number;
  used: number;
  available: number;
  usagePercentage: number;
}

interface SecurityMetrics {
  failedLoginAttempts: number;
  blockedIPs: string[];
  suspiciousActivity: SuspiciousActivity[];
  securityAlerts: SecurityAlert[];
}

interface SuspiciousActivity {
  type: 'multiple_failed_logins' | 'unusual_access_pattern' | 'potential_brute_force';
  userId?: string;
  ipAddress: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface PerformanceProfile {
  cpuUsage: CPUUsage;
  averageResponseTime: number;
  activeConnections: number;
  requestQueue: number;
  memoryLeaks: MemoryLeak[];
}

interface CPUUsage {
  user: number;
  system: number;
  idle: number;
  percentage: number;
}

interface MemoryLeak {
  component: string;
  growth: number;
  severity: 'low' | 'medium' | 'high';
}

interface DatabaseStats {
  connectionPool: {
    active: number;
    idle: number;
    total: number;
  };
  queries: {
    total: number;
    slow: number;
    failed: number;
    avgDuration: number;
  };
  storage: {
    totalSize: number;
    indexSize: number;
    dataSize: number;
  };
}

// User management for admins
interface UserManagementData {
  summary: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    pending: number;
  };
  recentActivity: {
    newSignups: number;
    monthlyActiveUsers: number;
    churnRate: number;
    growthRate: number;
  };
  users: ManagedUser[];
  pagination: PaginationInfo;
}

interface ManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  role: UserRole;
  lastLoginAt?: string;
  registeredAt: string;
  matchesPlayed: number;
  tournamentsJoined: number;
  securityFlags: SecurityFlag[];
}

interface SecurityFlag {
  type: 'suspicious_login' | 'multiple_accounts' | 'policy_violation';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: string;
}

// Admin action logs
interface AdminActionLog {
  id: string;
  adminId: string;
  adminName: string;
  action: AdminActionType;
  target: {
    type: 'user' | 'system' | 'content';
    id: string;
    name?: string;
  };
  details: Record<string, any>;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure' | 'partial';
}

export type AdminActionType = 
  | 'user:suspend'
  | 'user:activate'
  | 'user:delete'
  | 'user:role_change'
  | 'system:restart'
  | 'system:config_change'
  | 'report:generate'
  | 'data:export'
  | 'content:moderate';
```

### Admin API Client Types

```typescript
// Admin API client interface
interface AdminApiClient {
  // Analytics methods
  getAnalyticsDashboard(timeframe?: string): Promise<ApiResponse<AnalyticsDashboard>>;
  getUserEngagementAnalytics(startDate: string, endDate: string, filters?: Record<string, any>): Promise<ApiResponse<UserEngagementAnalytics>>;
  getPerformanceAnalytics(startDate: string, endDate: string, filters?: Record<string, any>): Promise<ApiResponse<PerformanceAnalytics>>;
  generateCustomReport(config: CustomReportConfig): Promise<ApiResponse<CustomReport>>;
  
  // System management methods
  getSystemOverview(includeDeep?: boolean): Promise<ApiResponse<SystemOverview>>;
  getUserManagement(filters?: Record<string, any>): Promise<ApiResponse<UserManagementData>>;
  
  // Insights methods
  getApplicationInsights(): Promise<ApiResponse<ApplicationInsights>>;
  getCompetitiveInsights(): Promise<ApiResponse<any>>;
  
  // User management actions
  suspendUser(userId: string): Promise<ApiResponse<void>>;
  activateUser(userId: string): Promise<ApiResponse<void>>;
  deleteUser(userId: string): Promise<ApiResponse<void>>;
  
  // Logging
  logAction(action: Partial<AdminActionLog>): Promise<ApiResponse<void>>;
}
```

---

## API Responses

```typescript
// Generic API response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
  timestamp: string;
}

// Error response
export interface ErrorResponse {
  success: false;
  message: string;
  errors: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
  code: string;
  timestamp: string;
  path?: string;
  requestId?: string;
}

// Health check response
export interface HealthResponse {
  status: 'OK' | 'ERROR';
  timestamp: string;
  environment: string;
  version: string;
  uptime?: number;
  memory?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  nodejs?: string;
}

// Common query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface SearchParams {
  search?: string;
  q?: string;
}

// API request options
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean;
  cache?: boolean;
}
```

---

## WebSocket Events

```typescript
// Socket authentication
export interface SocketAuthData {
  user: User;
  sessionId: string;
}

// Socket event payloads
export interface SocketEventPayloads {
  // Authentication events
  authenticate: string; // JWT token
  authenticated: SocketAuthData;
  authentication_error: { message: string };

  // Room management
  'join-room': string; // room ID
  'leave-room': string; // room ID
  'room-joined': { roomId: string; participants: number };
  'room-left': { roomId: string; participants: number };

  // Chat events
  'send-message': SendMessageRequest & { roomId: string };
  'new-message': Message;
  'message-updated': {
    messageId: ObjectId;
    type: 'edit' | 'delete';
    content?: string;
    updatedAt: string;
  };
  'user-typing': TypingIndicator;
  typing: { chatId: ObjectId; isTyping: boolean };

  // Match events
  'match-updated': {
    matchId: ObjectId;
    type: 'participant_joined' | 'participant_left' | 'status_changed' | 'details_updated';
    data: any;
    timestamp: string;
  };
  'player-joined': {
    matchId: ObjectId;
    player: MatchParticipant;
    currentParticipants: number;
  };
  'player-left': {
    matchId: ObjectId;
    player: MatchParticipant;
    currentParticipants: number;
  };

  // Tournament events
  'tournament-updated': {
    tournamentId: ObjectId;
    type: 'registration_opened' | 'registration_closed' | 'bracket_generated' | 'match_completed';
    data: any;
    timestamp: string;
  };

  // Notification events
  notification: Notification;
  'notification-updated': {
    notificationId: ObjectId;
    isRead: boolean;
    readAt?: string;
  };

  // User status events
  'user-online': { userId: ObjectId; timestamp: string };
  'user-offline': { userId: ObjectId; lastActiveAt: string };

  // System events
  'system-announcement': {
    message: string;
    type: 'info' | 'warning' | 'error';
    timestamp: string;
  };
}

// Socket event names
export type SocketEventName = keyof SocketEventPayloads;

// Socket client interface
export interface SocketClient {
  connect(): void;
  disconnect(): void;
  authenticate(token: string): void;
  joinRoom(roomId: string): void;
  leaveRoom(roomId: string): void;
  sendMessage(roomId: string, message: SendMessageRequest): void;
  on<T extends SocketEventName>(event: T, callback: (data: SocketEventPayloads[T]) => void): void;
  off<T extends SocketEventName>(event: T, callback?: (data: SocketEventPayloads[T]) => void): void;
  emit<T extends SocketEventName>(event: T, data: SocketEventPayloads[T]): void;
}
```

---

## Utility Types

```typescript
// Form validation
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
}

// API hooks return types
export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

// Filters and sorting
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

export interface FilterOption<T = any> {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';
  value: T;
}

// Component props helpers
export interface LoadingProps {
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export interface ErrorProps {
  error?: string | null;
  onRetry?: () => void;
  showRetry?: boolean;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: string;
}

// Theme and styling
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

// File upload
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

// Geolocation
export interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: number;
}

// Device info
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  platform: string;
}

// Export all types for easy importing
export type {
  // Re-export all the main interfaces
  User,
  Match,
  Tournament,
  Chat,
  Message,
  Notification,
  Venue,
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  SocketEventPayloads
};
```

---

## Usage Examples

### Basic API Call with Types

```typescript
import { ApiResponse, User, LoginRequest, AuthResponse } from './types/api';

const loginUser = async (credentials: LoginRequest): Promise<User> => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  const data: ApiResponse<AuthResponse> = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data.user;
};
```

### React Component with Types

```typescript
import React from 'react';
import { Match, MatchFilters } from './types/api';

interface MatchListProps {
  matches: Match[];
  filters: MatchFilters;
  onFilterChange: (filters: MatchFilters) => void;
  onMatchSelect: (match: Match) => void;
}

const MatchList: React.FC<MatchListProps> = ({
  matches,
  filters,
  onFilterChange,
  onMatchSelect
}) => {
  return (
    <div>
      {matches.map((match) => (
        <div key={match._id} onClick={() => onMatchSelect(match)}>
          <h3>{match.title}</h3>
          <p>{match.sport} - {match.status}</p>
          <p>{match.participants.length}/{match.maxParticipants} players</p>
        </div>
      ))}
    </div>
  );
};
```

### WebSocket Hook with Types

```typescript
import { useEffect, useRef } from 'react';
import { SocketClient, SocketEventPayloads } from './types/api';

export const useSocket = (): SocketClient | null => {
  const socketRef = useRef<SocketClient | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = new SocketClientImpl();
    socketRef.current.connect();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef.current;
};
```

---

Save this file as `src/types/api.ts` in your frontend project and import the types you need:

```typescript
import type { User, Match, Tournament, ApiResponse } from './types/api';
```

This provides complete type safety for your Sports Companion API integration!