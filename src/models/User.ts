import { Schema, model, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserStatics } from '../types';

const socialLoginSchema = new Schema({
  provider: {
    type: String,
    enum: ['google', 'facebook', 'github'],
    required: true
  },
  providerId: {
    type: String,
    required: true
  },
  email: String,
  name: String,
  profileUrl: String
}, { _id: false });

const mfaSettingsSchema = new Schema({
  isEnabled: {
    type: Boolean,
    default: false
  },
  secret: String,
  backupCodes: [{
    type: String
  }],
  lastUsedAt: Date
}, { _id: false });

const securitySettingsSchema = new Schema({
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastFailedLogin: Date,
  allowedIPs: [{
    type: String
  }],
  trustedDevices: [{
    type: String
  }]
}, { _id: false });

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in query results by default
  },
  profile: {
    type: Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  preferences: {
    type: Schema.Types.Mixed,
    default: {}
  },
  stats: {
    type: Schema.Types.Mixed,
    default: {}
  },
  friends: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  achievements: [{
    type: Schema.Types.ObjectId,
    ref: 'Achievement'
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  refreshTokens: [{
    type: String,
    select: false
  }],
  lastLoginAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  socialLogins: [socialLoginSchema],
  mfaSettings: {
    type: mfaSettingsSchema,
    default: () => ({})
  },
  securitySettings: {
    type: securitySettingsSchema,
    default: () => ({})
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete (ret as any).password;
      delete (ret as any).refreshTokens;
      delete (ret as any).__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Indexes
// email index already created by unique: true
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for friend count
userSchema.virtual('friendCount').get(function() {
  return this.friends?.length || 0;
});

// Virtual for follower count
userSchema.virtual('followerCount').get(function() {
  return this.followers?.length || 0;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new) and exists
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if account is locked
userSchema.methods.isAccountLocked = function(): boolean {
  return !!(this.securitySettings?.lockUntil && this.securitySettings.lockUntil > Date.now());
};

// Instance method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function(): Promise<void> {
  // Reset attempts if last failed login was more than 2 hours ago
  if (this.securitySettings?.lastFailedLogin && 
      Date.now() - this.securitySettings.lastFailedLogin.getTime() > 2 * 60 * 60 * 1000) {
    this.securitySettings.loginAttempts = 0;
  }

  this.securitySettings.loginAttempts += 1;
  this.securitySettings.lastFailedLogin = new Date();

  // Lock account after 5 failed attempts for 30 minutes
  if (this.securitySettings.loginAttempts >= 5) {
    this.securitySettings.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
  }

  await this.save();
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  this.securitySettings.loginAttempts = 0;
  this.securitySettings.lockUntil = undefined;
  this.securitySettings.lastFailedLogin = undefined;
  await this.save();
};

// Instance method to add refresh token
userSchema.methods.addRefreshToken = function(token: string): void {
  if (!this.refreshTokens) {
    this.refreshTokens = [];
  }
  this.refreshTokens.push(token);
  
  // Keep only the last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

// Instance method to remove refresh token
userSchema.methods.removeRefreshToken = function(token: string): void {
  if (this.refreshTokens) {
    this.refreshTokens = this.refreshTokens.filter((t: string) => t !== token);
  }
};

// Instance method to clear all refresh tokens
userSchema.methods.clearRefreshTokens = function(): void {
  this.refreshTokens = [];
};

// Static method to find by email
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by social login
userSchema.statics.findBySocialLogin = function(provider: string, providerId: string) {
  return this.findOne({ 
    'socialLogins.provider': provider, 
    'socialLogins.providerId': providerId 
  });
};

export const User = model<IUser, Model<IUser> & IUserStatics>('User', userSchema);