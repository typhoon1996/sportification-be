import { Schema, model, Types } from 'mongoose';
import { IVenue } from '../../../../shared/types';

const venueSchema = new Schema<IVenue>(
  {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
      maxlength: [100, 'Venue name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      trim: true,
    },
    location: {
      coordinates: {
        type: [Number],
        required: [true, 'Venue coordinates are required'],
      },
      address: {
        type: String,
        required: [true, 'Venue address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
      },
      zipCode: {
        type: String,
        trim: true,
      },
    },
    surfaceType: {
      type: String,
      required: [true, 'Surface type is required'],
      enum: ['grass', 'clay', 'hard', 'indoor', 'outdoor', 'sand', 'pool', 'court'],
      lowercase: true,
    },
    capacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1'],
      max: [10000, 'Capacity cannot exceed 10000'],
    },
    amenities: [
      {
        type: String,
        enum: [
          'parking',
          'restrooms',
          'lockers',
          'showers',
          'lighting',
          'pro_shop',
          'cafe',
          'equipment_rental',
          'timing_system',
          'sound_system',
          'wifi',
          'accessibility',
        ],
      },
    ],
    operatingHours: {
      monday: {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
      tuesday: {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
      wednesday: {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
      thursday: {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
      friday: {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
      saturday: {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
      sunday: {
        open: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        close: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
    contactInfo: {
      phone: {
        type: String,
        match: /^\+?[1-9]\d{1,14}$/,
      },
      email: {
        type: String,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
      website: {
        type: String,
        match: /^https?:\/\/.+/,
      },
    },
    pricing: {
      hourlyRate: {
        type: Number,
        min: [0, 'Hourly rate cannot be negative'],
      },
      currency: {
        type: String,
        default: 'USD',
        uppercase: true,
      },
    },
    images: [
      {
        url: {
          type: String,
          required: true,
          match: /^https?:\/\/.+/,
        },
        caption: String,
        isPrimary: Boolean,
      },
    ],
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      count: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full address
venueSchema.virtual('fullAddress').get(function () {
  const parts = [
    this.location.address,
    this.location.city,
    this.location.state,
    this.location.zipCode,
    this.location.country,
  ].filter(Boolean);
  return parts.join(', ');
});

// Virtual for primary image
venueSchema.virtual('primaryImage').get(function () {
  const primary = this.images?.find((img) => img.isPrimary);
  return primary || this.images?.[0];
});

// Virtual for current availability (simplified)
venueSchema.virtual('isCurrentlyOpen').get(function () {
  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    now.getDay()
  ];
  const currentTime = now.toTimeString().slice(0, 5);

  const todayHours = this.operatingHours?.[dayOfWeek as keyof typeof this.operatingHours];
  if (!todayHours?.open || !todayHours?.close) return false;

  return currentTime >= todayHours.open && currentTime <= todayHours.close;
});

// Instance method to check if venue is available at specific time
venueSchema.methods.isAvailableAt = function (date: Date): boolean {
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    date.getDay()
  ];
  const timeString = date.toTimeString().slice(0, 5);

  const dayHours = this.operatingHours?.[dayOfWeek as keyof typeof this.operatingHours];
  if (!dayHours?.open || !dayHours?.close) return false;

  return timeString >= dayHours.open && timeString <= dayHours.close;
};

// Instance method to calculate distance from coordinates
venueSchema.methods.distanceFrom = function (lat: number, lng: number): number {
  if (!this.location?.coordinates) return Infinity;

  const [venueLng, venueLat] = this.location.coordinates;
  const R = 6371; // Earth's radius in kilometers

  const dLat = ((venueLat - lat) * Math.PI) / 180;
  const dLng = ((venueLng - lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((venueLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Static method to find venues near coordinates
venueSchema.statics.findNearby = function (lat: number, lng: number, maxDistance: number = 10) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: maxDistance * 1000, // Convert km to meters
      },
    },
    isActive: true,
    isPublic: true,
  });
};

// Static method to find venues by amenities
venueSchema.statics.findByAmenities = function (amenities: string[]) {
  return this.find({
    amenities: { $in: amenities },
    isActive: true,
    isPublic: true,
  });
};

// Indexes
venueSchema.index({ 'location.coordinates': '2dsphere' });
venueSchema.index({ isPublic: 1, 'location.city': 1 });
venueSchema.index({ name: 'text', description: 'text' });
venueSchema.index({ createdBy: 1, isActive: 1 });
venueSchema.index({ surfaceType: 1, capacity: 1 });
venueSchema.index({ 'rating.average': -1 });

export const Venue = model<IVenue>('Venue', venueSchema);
