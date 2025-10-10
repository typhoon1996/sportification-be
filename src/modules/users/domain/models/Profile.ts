import { Schema, model, Model } from 'mongoose';
import { IProfile, IProfileStatics } from '../../../../shared/types';

const profileSchema = new Schema<IProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      validate: {
        validator: function (username: string) {
          return /^[a-zA-Z0-9_-]+$/.test(username);
        },
        message: 'Username can only contain letters, numbers, underscores, and hyphens',
      },
    },
    avatar: {
      type: String,
      validate: {
        validator: function (url: string) {
          if (!url) return true; // Allow empty avatar
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        },
        message: 'Avatar must be a valid image URL',
      },
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      trim: true,
    },
    achievements: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Achievement',
      },
    ],
    qrCode: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (date: Date) {
          if (!date) return true; // Allow empty date
          const today = new Date();
          const age = today.getFullYear() - date.getFullYear();
          return age >= 13 && age <= 120; // Reasonable age range
        },
        message: 'User must be between 13 and 120 years old',
      },
    },
    location: {
      type: String,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: function (phone: string) {
          if (!phone) return true; // Allow empty phone number
          return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''));
        },
        message: 'Please provide a valid phone number',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes
// user index already created by unique: true
// username index already created by unique: true
profileSchema.index({ createdAt: -1 });

// Virtual for full name
profileSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name (username or full name)
profileSchema.virtual('displayName').get(function () {
  return this.username || this.fullName;
});

// Virtual for achievement count
profileSchema.virtual('achievementCount').get(function () {
  return this.achievements?.length || 0;
});

// Virtual for age (if date of birth is provided)
profileSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
});

// Pre-save middleware to generate QR code if needed
profileSchema.pre('save', function (next) {
  if (this.isNew && !this.qrCode) {
    // Generate a simple QR code identifier (in real app, you'd use a QR library)
    this.qrCode = `https://api.sportification.app/qr/${this.username}`;
  }
  next();
});

// Static method to find by username
profileSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ username: username.toLowerCase() });
};

// Static method to search profiles
profileSchema.statics.searchProfiles = function (query: string, limit = 10) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [{ firstName: searchRegex }, { lastName: searchRegex }, { username: searchRegex }],
  })
    .limit(limit)
    .populate('user', 'email isActive')
    .populate('achievements', 'name icon');
};

export const Profile = model<IProfile, Model<IProfile> & IProfileStatics>('Profile', profileSchema);
