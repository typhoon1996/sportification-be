import {Schema, model} from "mongoose";
import {IPromoCode} from "../../types";

const promoCodeSchema = new Schema<IPromoCode>(
  {
    code: {
      type: String,
      required: [true, "Promo code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, "Promo code must be at least 3 characters"],
      maxlength: [20, "Promo code cannot exceed 20 characters"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type is required"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
      validate: {
        validator: function (this: IPromoCode, value: number) {
          if (this.discountType === "percentage") {
            return value > 0 && value <= 100;
          }
          return value > 0;
        },
        message: "Percentage discount must be between 0 and 100",
      },
    },
    minBookingAmount: {
      type: Number,
      min: [0, "Minimum booking amount cannot be negative"],
    },
    maxDiscountAmount: {
      type: Number,
      min: [0, "Maximum discount amount cannot be negative"],
    },
    validFrom: {
      type: Date,
      required: [true, "Valid from date is required"],
      index: true,
    },
    validUntil: {
      type: Date,
      required: [true, "Valid until date is required"],
      validate: {
        validator: function (this: IPromoCode, value: Date) {
          return value > this.validFrom;
        },
        message: "Valid until date must be after valid from date",
      },
      index: true,
    },
    usageLimit: {
      type: Number,
      min: [1, "Usage limit must be at least 1"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, "Used count cannot be negative"],
    },
    applicableVenues: [
      {
        type: Schema.Types.ObjectId,
        ref: "Venue",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
  },
  {
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true},
  }
);

// Virtual for is valid
promoCodeSchema.virtual("isValid").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    this.validFrom <= now &&
    this.validUntil >= now &&
    (!this.usageLimit || this.usedCount < this.usageLimit)
  );
});

// Virtual for remaining uses
promoCodeSchema.virtual("remainingUses").get(function () {
  if (!this.usageLimit) {
    return Infinity;
  }
  return Math.max(0, this.usageLimit - this.usedCount);
});

// Virtual for usage percentage
promoCodeSchema.virtual("usagePercentage").get(function () {
  if (!this.usageLimit) {
    return 0;
  }
  return Math.round((this.usedCount / this.usageLimit) * 100);
});

// Static method to find valid promo code
promoCodeSchema.statics.findValidCode = function (code: string) {
  const now = new Date();
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    validFrom: {$lte: now},
    validUntil: {$gte: now},
    $or: [
      {usageLimit: {$exists: false}},
      {$expr: {$lt: ["$usedCount", "$usageLimit"]}},
    ],
  });
};

// Indexes
promoCodeSchema.index({code: 1, isActive: 1});
promoCodeSchema.index({validFrom: 1, validUntil: 1});
promoCodeSchema.index({createdBy: 1});
promoCodeSchema.index({isActive: 1, validUntil: -1});

export const PromoCode = model<IPromoCode>("PromoCode", promoCodeSchema);
