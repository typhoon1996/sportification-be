/**
 * Venue Module Type Definitions
 */

import { Types, Document } from 'mongoose';

// Booking Status
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

// Booking Type
export enum BookingType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  RECURRING = 'recurring',
}

// Pricing Type
export enum PricingType {
  STANDARD = 'standard',
  PEAK = 'peak',
  OFF_PEAK = 'off_peak',
}

// Refund Policy
export enum RefundPolicy {
  FULL = 'full',
  PARTIAL = 'partial',
  NO_REFUND = 'no_refund',
}

// Booking Interface
export interface IBooking extends Document {
  venue: Types.ObjectId;
  user: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  bookingType: BookingType;
  participants: number;
  basePrice: number;
  discountAmount: number;
  totalPrice: number;
  pricingType: PricingType;
  appliedPromoCodes: string[];
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partially_refunded';
  paymentMethod?: string;
  transactionId?: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  refundAmount?: number;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculatePrice(): number;
  applyDiscount(discountPercentage: number): void;
  canCancel(): boolean;
  getRefundAmount(): number;
}

// Promo Code Interface
export interface IPromoCode extends Document {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minBookingAmount?: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usedCount: number;
  applicableVenues: Types.ObjectId[];
  isActive: boolean;
  createdBy: Types.ObjectId;
}

// Venue Availability Slot
export interface IAvailabilitySlot {
  date: Date;
  startTime: string; // HH:mm format
  endTime: string;
  isAvailable: boolean;
  bookedBy?: string;
}

// Create Booking DTO
export interface CreateBookingDTO {
  venueId: string;
  startTime: Date;
  endTime: Date;
  bookingType: BookingType;
  participants: number;
  notes?: string;
  promoCodes?: string[];
}

// Update Booking DTO
export interface UpdateBookingDTO {
  startTime?: Date;
  endTime?: Date;
  participants?: number;
  notes?: string;
}

// Cancel Booking DTO
export interface CancelBookingDTO {
  reason: string;
}

// Booking Filter Options
export interface BookingFilterOptions {
  venueId?: string;
  userId?: string;
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
  paymentStatus?: string;
}

// Venue Analytics
export interface VenueAnalytics {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  occupancyRate: number;
  popularTimeSlots: Array<{
    hour: number;
    bookings: number;
  }>;
}

// Dashboard Statistics
export interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  occupancyRate: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
}

// Pricing Configuration
export interface PricingConfig {
  baseHourlyRate: number;
  peakHourMultiplier: number; // e.g., 1.5 = 50% increase
  weekendMultiplier: number;
  earlyBirdDiscount: number; // percentage
  earlyBirdDays: number; // days in advance
  groupDiscountThreshold: number; // min participants
  groupDiscountPercentage: number;
  currency: string;
}

// Availability Check Result
export interface AvailabilityCheckResult {
  isAvailable: boolean;
  conflictingBookings?: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
  }>;
  suggestedSlots?: Array<{
    startTime: Date;
    endTime: Date;
  }>;
}

// Booking Confirmation Data
export interface BookingConfirmationData {
  booking: IBooking;
  venue: {
    name: string;
    address: string;
    contactInfo: any;
  };
  user: {
    email: string;
    name: string;
  };
  priceBreakdown: {
    basePrice: number;
    discounts: Array<{
      type: string;
      amount: number;
    }>;
    totalPrice: number;
  };
}
