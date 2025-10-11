import { Schema, model } from 'mongoose';
import { IBooking, BookingStatus, BookingType, PricingType } from '../../types';

const bookingSchema = new Schema<IBooking>(
  {
    venue: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      required: [true, 'Venue is required'],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function (this: IBooking, value: Date) {
          return value > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
      index: true,
    },
    bookingType: {
      type: String,
      enum: Object.values(BookingType),
      default: BookingType.HOURLY,
    },
    participants: {
      type: Number,
      required: [true, 'Number of participants is required'],
      min: [1, 'At least 1 participant is required'],
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative'],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    pricingType: {
      type: String,
      enum: Object.values(PricingType),
      default: PricingType.STANDARD,
    },
    appliedPromoCodes: [
      {
        type: String,
        trim: true,
        uppercase: true,
      },
    ],
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      trim: true,
    },
    cancellationReason: {
      type: String,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative'],
    },
    refundedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for booking duration in hours
bookingSchema.virtual('durationHours').get(function () {
  const duration = this.endTime.getTime() - this.startTime.getTime();
  return Math.round((duration / (1000 * 60 * 60)) * 100) / 100;
});

// Virtual for is past booking
bookingSchema.virtual('isPast').get(function () {
  return this.endTime < new Date();
});

// Virtual for is upcoming
bookingSchema.virtual('isUpcoming').get(function () {
  return this.startTime > new Date() && this.status !== BookingStatus.CANCELLED;
});

// Virtual for is ongoing
bookingSchema.virtual('isOngoing').get(function () {
  const now = new Date();
  return this.startTime <= now && this.endTime >= now && this.status === BookingStatus.CHECKED_IN;
});

// Method to calculate price based on various factors
bookingSchema.methods.calculatePrice = function (): number {
  // This is a placeholder - actual calculation is done in BookingService
  return this.totalPrice;
};

// Method to apply discount
bookingSchema.methods.applyDiscount = function (discountPercentage: number): void {
  const discountAmount = (this.basePrice * discountPercentage) / 100;
  this.discountAmount += discountAmount;
  this.totalPrice = this.basePrice - this.discountAmount;
};

// Method to check if booking can be cancelled
bookingSchema.methods.canCancel = function (): boolean {
  if (this.status === BookingStatus.CANCELLED || this.status === BookingStatus.COMPLETED) {
    return false;
  }

  // Can't cancel if booking has already started
  return this.startTime > new Date();
};

// Method to calculate refund amount based on cancellation time
bookingSchema.methods.getRefundAmount = function (): number {
  if (!this.canCancel()) {
    return 0;
  }

  const now = new Date();
  const hoursUntilStart = (this.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Refund policy:
  // - More than 24 hours: 100% refund
  // - 12-24 hours: 50% refund
  // - Less than 12 hours: No refund
  if (hoursUntilStart >= 24) {
    return this.totalPrice;
  } else if (hoursUntilStart >= 12) {
    return this.totalPrice * 0.5;
  } else {
    return 0;
  }
};

// Indexes
bookingSchema.index({ venue: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ status: 1, startTime: 1 });
bookingSchema.index({ venue: 1, status: 1, paymentStatus: 1 });
bookingSchema.index({ createdAt: -1 });

// Compound index for conflict checking
bookingSchema.index({
  venue: 1,
  status: 1,
  startTime: 1,
  endTime: 1,
});

export const Booking = model<IBooking>('Booking', bookingSchema);
