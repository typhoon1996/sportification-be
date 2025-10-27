/**
 * Booking Service - Business Logic Layer
 */

import {BookingRepository} from "../../data/repositories/BookingRepository";
import {Venue} from "../models/Venue";
import {PromoCode} from "../models/PromoCode";
import {
  IBooking,
  BookingStatus,
  PricingType,
  PricingConfig,
  CreateBookingDTO,
  UpdateBookingDTO,
  CancelBookingDTO,
  BookingFilterOptions,
  AvailabilityCheckResult,
  VenueAnalytics,
  DashboardStats,
} from "../../types";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../../../../shared/middleware/errorHandler";
import logger from "../../../../shared/infrastructure/logging";
import {BookingEventPublisher} from "../../events/publishers/BookingEventPublisher";
import emailService from "../../../../shared/services/email";

export class BookingService {
  private readonly bookingRepository: BookingRepository;
  private readonly eventPublisher: BookingEventPublisher;

  constructor() {
    this.bookingRepository = new BookingRepository();
    this.eventPublisher = new BookingEventPublisher();
  }

  /**
   * Create a new booking with dynamic pricing
   */
  async createBooking(
    userId: string,
    dto: CreateBookingDTO
  ): Promise<IBooking> {
    // Validate venue exists
    const venue = await Venue.findById(dto.venueId);
    if (!venue) {
      throw new NotFoundError("Venue");
    }

    if (!venue.isActive) {
      throw new ValidationError("Venue is not active");
    }

    // Validate booking times
    this.validateBookingTimes(dto.startTime, dto.endTime);

    // Check for conflicts
    const conflicts = await this.bookingRepository.findConflictingBookings(
      dto.venueId,
      dto.startTime,
      dto.endTime
    );

    if (conflicts.length > 0) {
      throw new ConflictError("Time slot is already booked");
    }

    // Calculate pricing
    const pricingConfig = this.getPricingConfig(venue);
    const {basePrice, totalPrice, discountAmount, pricingType} =
      await this.calculateBookingPrice(
        venue,
        dto.startTime,
        dto.endTime,
        dto.participants,
        dto.promoCodes || [],
        pricingConfig
      );

    // Create booking
    const booking = await this.bookingRepository.create({
      venue: venue._id as any,
      user: userId as any,
      startTime: dto.startTime,
      endTime: dto.endTime,
      bookingType: dto.bookingType,
      participants: dto.participants,
      basePrice,
      discountAmount,
      totalPrice,
      pricingType,
      appliedPromoCodes: dto.promoCodes || [],
      status: BookingStatus.PENDING,
      paymentStatus: "pending",
      notes: dto.notes,
    });

    // Update promo code usage
    if (dto.promoCodes && dto.promoCodes.length > 0) {
      await this.incrementPromoCodeUsage(dto.promoCodes);
    }

    // Publish event
    this.eventPublisher.publishBookingCreated({
      bookingId: booking.id,
      venueId: dto.venueId,
      userId,
      startTime: dto.startTime,
      endTime: dto.endTime,
      totalPrice,
    });

    // Send confirmation email
    await this.sendBookingConfirmationEmail(booking);

    logger.info("Booking created", {
      bookingId: booking.id,
      userId,
      venueId: dto.venueId,
    });

    return booking;
  }

  /**
   * Calculate booking price with dynamic pricing and discounts
   */
  private async calculateBookingPrice(
    venue: any,
    startTime: Date,
    endTime: Date,
    participants: number,
    promoCodes: string[],
    config: PricingConfig
  ): Promise<{
    basePrice: number;
    totalPrice: number;
    discountAmount: number;
    pricingType: PricingType;
    appliedDiscounts: Array<{type: string; amount: number}>;
  }> {
    const durationHours =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    let baseHourlyRate = config.baseHourlyRate;
    const appliedDiscounts: Array<{type: string; amount: number}> = [];

    // Apply peak pricing (after 5 PM or weekends)
    const hour = startTime.getHours();
    const dayOfWeek = startTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPeakHour = hour >= 17;

    let pricingType: PricingType;
    if (isPeakHour || isWeekend) {
      pricingType = PricingType.PEAK;
      baseHourlyRate *= config.peakHourMultiplier;
    } else {
      pricingType = PricingType.OFF_PEAK;
    }

    const basePrice = baseHourlyRate * durationHours;
    let discountAmount = 0;

    // Early bird discount (7+ days in advance)
    const daysInAdvance =
      (startTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysInAdvance >= config.earlyBirdDays) {
      const earlyBirdDiscount = (basePrice * config.earlyBirdDiscount) / 100;
      discountAmount += earlyBirdDiscount;
      appliedDiscounts.push({type: "Early Bird", amount: earlyBirdDiscount});
    }

    // Group booking discount (5+ participants)
    if (participants >= config.groupDiscountThreshold) {
      const groupDiscount = (basePrice * config.groupDiscountPercentage) / 100;
      discountAmount += groupDiscount;
      appliedDiscounts.push({type: "Group Discount", amount: groupDiscount});
    }

    // Apply promo codes
    if (promoCodes.length > 0) {
      const promoDiscount = await this.applyPromoCodes(
        promoCodes,
        basePrice,
        venue._id.toString()
      );
      discountAmount += promoDiscount;
      if (promoDiscount > 0) {
        appliedDiscounts.push({type: "Promo Code", amount: promoDiscount});
      }
    }

    const totalPrice = Math.max(0, basePrice - discountAmount);

    return {
      basePrice,
      totalPrice,
      discountAmount,
      pricingType,
      appliedDiscounts,
    };
  }

  /**
   * Apply promo codes and calculate discount
   */
  private async applyPromoCodes(
    codes: string[],
    bookingAmount: number,
    venueId: string
  ): Promise<number> {
    let totalDiscount = 0;

    for (const code of codes) {
      const promoCode = await PromoCode.findOne({
        code: code.toUpperCase(),
        isActive: true,
        validFrom: {$lte: new Date()},
        validUntil: {$gte: new Date()},
      });

      if (!promoCode) {
        logger.warn("Invalid or expired promo code", {code});
        continue;
      }

      // Check if promo code is applicable to this venue
      if (
        promoCode.applicableVenues.length > 0 &&
        !promoCode.applicableVenues.some(v => v.toString() === venueId)
      ) {
        logger.warn("Promo code not applicable to this venue", {code, venueId});
        continue;
      }

      // Check minimum booking amount
      if (
        promoCode.minBookingAmount &&
        bookingAmount < promoCode.minBookingAmount
      ) {
        logger.warn("Booking amount below minimum for promo code", {
          code,
          bookingAmount,
          minRequired: promoCode.minBookingAmount,
        });
        continue;
      }

      // Calculate discount
      let discount = 0;
      if (promoCode.discountType === "percentage") {
        discount = (bookingAmount * promoCode.discountValue) / 100;
      } else {
        discount = promoCode.discountValue;
      }

      // Apply max discount limit
      if (promoCode.maxDiscountAmount) {
        discount = Math.min(discount, promoCode.maxDiscountAmount);
      }

      totalDiscount += discount;
    }

    return totalDiscount;
  }

  /**
   * Increment promo code usage count
   */
  private async incrementPromoCodeUsage(codes: string[]): Promise<void> {
    for (const code of codes) {
      await PromoCode.findOneAndUpdate(
        {code: code.toUpperCase()},
        {$inc: {usedCount: 1}}
      );
    }
  }

  /**
   * Get pricing configuration for a venue
   */
  private getPricingConfig(venue: any): PricingConfig {
    return {
      baseHourlyRate: venue.pricing?.hourlyRate || 50,
      peakHourMultiplier: 1.5,
      weekendMultiplier: 1.3,
      earlyBirdDiscount: 10,
      earlyBirdDays: 7,
      groupDiscountThreshold: 5,
      groupDiscountPercentage: 15,
      currency: venue.pricing?.currency || "USD",
    };
  }

  /**
   * Validate booking times
   */
  private validateBookingTimes(startTime: Date, endTime: Date): void {
    const now = new Date();

    if (startTime < now) {
      throw new ValidationError("Booking start time must be in the future");
    }

    if (endTime <= startTime) {
      throw new ValidationError("Booking end time must be after start time");
    }

    const durationHours =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    if (durationHours < 1) {
      throw new ValidationError("Minimum booking duration is 1 hour");
    }

    if (durationHours > 24) {
      throw new ValidationError("Maximum booking duration is 24 hours");
    }
  }

  /**
   * Check availability for a venue and time slot
   */
  async checkAvailability(
    venueId: string,
    startTime: Date,
    endTime: Date
  ): Promise<AvailabilityCheckResult> {
    const venue = await Venue.findById(venueId);
    if (!venue) {
      throw new NotFoundError("Venue");
    }

    const conflicts = await this.bookingRepository.findConflictingBookings(
      venueId,
      startTime,
      endTime
    );

    if (conflicts.length > 0) {
      // Suggest alternative time slots
      const suggestedSlots = await this.findAvailableSlots(venueId, startTime);

      return {
        isAvailable: false,
        conflictingBookings: conflicts.map(b => ({
          id: b.id,
          startTime: b.startTime,
          endTime: b.endTime,
        })),
        suggestedSlots,
      };
    }

    return {
      isAvailable: true,
    };
  }

  /**
   * Find available time slots for a venue
   */
  private async findAvailableSlots(
    venueId: string,
    preferredDate: Date,
    count: number = 3
  ): Promise<Array<{startTime: Date; endTime: Date}>> {
    const suggestedSlots: Array<{startTime: Date; endTime: Date}> = [];
    const date = new Date(preferredDate);
    date.setHours(9, 0, 0, 0); // Start checking from 9 AM

    for (let i = 0; i < 24 && suggestedSlots.length < count; i++) {
      const startTime = new Date(date);
      startTime.setHours(startTime.getHours() + i);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2); // 2-hour slots

      const conflicts = await this.bookingRepository.findConflictingBookings(
        venueId,
        startTime,
        endTime
      );

      if (conflicts.length === 0) {
        suggestedSlots.push({startTime, endTime});
      }
    }

    return suggestedSlots;
  }

  /**
   * Update an existing booking
   */
  async updateBooking(
    bookingId: string,
    userId: string,
    dto: UpdateBookingDTO
  ): Promise<IBooking> {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    if (booking.user.toString() !== userId) {
      throw new ValidationError("Only booking owner can update it");
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new ValidationError("Cannot update cancelled booking");
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new ValidationError("Cannot update completed booking");
    }

    // If updating times, check for conflicts
    const newStartTime = dto.startTime || booking.startTime;
    const newEndTime = dto.endTime || booking.endTime;

    if (dto.startTime || dto.endTime) {
      this.validateBookingTimes(newStartTime, newEndTime);

      const conflicts = await this.bookingRepository.findConflictingBookings(
        booking.venue.toString(),
        newStartTime,
        newEndTime,
        bookingId
      );

      if (conflicts.length > 0) {
        throw new ConflictError("New time slot is already booked");
      }
    }

    // Update booking
    const updated = await this.bookingRepository.update(bookingId, dto);

    if (!updated) {
      throw new Error("Failed to update booking");
    }

    // Publish event
    this.eventPublisher.publishBookingUpdated({
      bookingId,
      userId,
      updates: dto,
    });

    logger.info("Booking updated", {bookingId, userId});

    return updated;
  }

  /**
   * Cancel a booking with refund calculation
   */
  async cancelBooking(
    bookingId: string,
    userId: string,
    dto: CancelBookingDTO
  ): Promise<IBooking> {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    if (booking.user.toString() !== userId) {
      throw new ValidationError("Only booking owner can cancel it");
    }

    if (!booking.canCancel()) {
      throw new ValidationError("Booking cannot be cancelled");
    }

    const refundAmount = booking.getRefundAmount();

    const updated = await this.bookingRepository.update(bookingId, {
      status: BookingStatus.CANCELLED,
      cancellationReason: dto.reason,
      cancelledAt: new Date(),
      refundAmount,
      paymentStatus: refundAmount > 0 ? "refunded" : booking.paymentStatus,
      refundedAt: refundAmount > 0 ? new Date() : undefined,
    } as Partial<IBooking>);

    if (!updated) {
      throw new Error("Failed to cancel booking");
    }

    // Publish event
    this.eventPublisher.publishBookingCancelled({
      bookingId,
      userId,
      reason: dto.reason,
      refundAmount,
    });

    // Send cancellation email
    await this.sendCancellationEmail(updated, refundAmount);

    logger.info("Booking cancelled", {bookingId, userId, refundAmount});

    return updated;
  }

  /**
   * Confirm booking payment
   */
  async confirmPayment(
    bookingId: string,
    transactionId: string,
    paymentMethod: string
  ): Promise<IBooking> {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    const updated = await this.bookingRepository.update(bookingId, {
      status: BookingStatus.CONFIRMED,
      paymentStatus: "paid",
      transactionId,
      paymentMethod,
    } as Partial<IBooking>);

    if (!updated) {
      throw new Error("Failed to confirm payment");
    }

    // Publish event
    this.eventPublisher.publishPaymentConfirmed({
      bookingId,
      transactionId,
      amount: booking.totalPrice,
    });

    logger.info("Booking payment confirmed", {bookingId, transactionId});

    return updated;
  }

  /**
   * Check in to a booking
   */
  async checkIn(bookingId: string, userId: string): Promise<IBooking> {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    if (booking.user.toString() !== userId) {
      throw new ValidationError("Only booking owner can check in");
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ValidationError("Only confirmed bookings can be checked in");
    }

    const now = new Date();
    const gracePeriod = 30 * 60 * 1000; // 30 minutes before start time

    if (now < new Date(booking.startTime.getTime() - gracePeriod)) {
      throw new ValidationError(
        "Check-in too early. Please wait until 30 minutes before booking time"
      );
    }

    if (now > booking.endTime) {
      throw new ValidationError("Cannot check in after booking end time");
    }

    const updated = await this.bookingRepository.update(bookingId, {
      status: BookingStatus.CHECKED_IN,
      checkInTime: now,
    } as Partial<IBooking>);

    if (!updated) {
      throw new Error("Failed to check in");
    }

    // Publish event
    this.eventPublisher.publishBookingCheckedIn({
      bookingId,
      userId,
      checkInTime: now,
    });

    logger.info("Booking checked in", {bookingId, userId});

    return updated;
  }

  /**
   * Check out from a booking
   */
  async checkOut(bookingId: string, userId: string): Promise<IBooking> {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    if (booking.user.toString() !== userId) {
      throw new ValidationError("Only booking owner can check out");
    }

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new ValidationError("Only checked-in bookings can be checked out");
    }

    const updated = await this.bookingRepository.update(bookingId, {
      status: BookingStatus.COMPLETED,
      checkOutTime: new Date(),
    } as Partial<IBooking>);

    if (!updated) {
      throw new Error("Failed to check out");
    }

    // Publish event
    this.eventPublisher.publishBookingCompleted({
      bookingId,
      userId,
      checkOutTime: new Date(),
    });

    logger.info("Booking checked out", {bookingId, userId});

    return updated;
  }

  /**
   * Mark booking as no-show
   */
  async markNoShow(bookingId: string, venueOwnerId: string): Promise<IBooking> {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    const venue = await Venue.findById(booking.venue);
    if (!venue || venue.createdBy.toString() !== venueOwnerId) {
      throw new ValidationError("Only venue owner can mark no-show");
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ValidationError(
        "Only confirmed bookings can be marked as no-show"
      );
    }

    const now = new Date();
    if (now < booking.endTime) {
      throw new ValidationError(
        "Cannot mark as no-show before booking end time"
      );
    }

    const updated = await this.bookingRepository.update(bookingId, {
      status: BookingStatus.NO_SHOW,
    } as Partial<IBooking>);

    if (!updated) {
      throw new Error("Failed to mark as no-show");
    }

    // Publish event
    this.eventPublisher.publishBookingNoShow({
      bookingId,
      userId: booking.user.toString(),
    });

    logger.info("Booking marked as no-show", {bookingId});

    return updated;
  }

  /**
   * Get bookings with filters
   */
  async getBookings(
    filters: BookingFilterOptions,
    page: number = 1,
    limit: number = 10
  ): Promise<{bookings: IBooking[]; total: number; pages: number}> {
    const {bookings, total} = await this.bookingRepository.findWithFilters(
      filters,
      page,
      limit
    );

    return {
      bookings,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: string): Promise<IBooking> {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    return booking;
  }

  /**
   * Get user's bookings
   */
  async getUserBookings(
    userId: string,
    status?: BookingStatus
  ): Promise<IBooking[]> {
    return this.bookingRepository.findByUser(userId, {status});
  }

  /**
   * Get venue's bookings (for owner)
   */
  async getVenueBookings(
    venueId: string,
    userId: string,
    status?: BookingStatus
  ): Promise<IBooking[]> {
    const venue = await Venue.findById(venueId);

    if (!venue) {
      throw new NotFoundError("Venue");
    }

    if (venue.createdBy.toString() !== userId) {
      throw new ValidationError("Only venue owner can view bookings");
    }

    return this.bookingRepository.findByVenue(venueId, {status});
  }

  /**
   * Get venue analytics (for owner dashboard)
   */
  async getVenueAnalytics(
    venueId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<VenueAnalytics> {
    const venue = await Venue.findById(venueId);

    if (!venue) {
      throw new NotFoundError("Venue");
    }

    if (venue.createdBy.toString() !== userId) {
      throw new ValidationError("Only venue owner can view analytics");
    }

    // Default date range if not provided
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const analyticsData = await this.bookingRepository.getVenueAnalytics(
      venueId,
      startDate || defaultStartDate,
      endDate || defaultEndDate
    );

    const statusCounts: Record<string, number> =
      analyticsData.statusCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

    const revenueData = analyticsData.revenue[0] || {
      totalRevenue: 0,
      averageBookingValue: 0,
    };

    return {
      totalBookings: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      confirmedBookings: statusCounts[BookingStatus.CONFIRMED] || 0,
      cancelledBookings: statusCounts[BookingStatus.CANCELLED] || 0,
      noShowBookings: statusCounts[BookingStatus.NO_SHOW] || 0,
      completedBookings: statusCounts[BookingStatus.COMPLETED] || 0,
      totalRevenue: revenueData.totalRevenue,
      averageBookingValue: revenueData.averageBookingValue,
      occupancyRate: 0, // Calculated based on total hours booked vs available hours
      popularTimeSlots: analyticsData.popularTimeSlots.map((slot: any) => ({
        hour: slot._id,
        bookings: slot.bookings,
      })),
    };
  }

  /**
   * Get calendar view of bookings for a venue
   */
  async getVenueCalendar(
    venueId: string,
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IBooking[]> {
    const venue = await Venue.findById(venueId);

    if (!venue) {
      throw new NotFoundError("Venue");
    }

    if (venue.createdBy.toString() !== userId) {
      throw new ValidationError("Only venue owner can view calendar");
    }

    return this.bookingRepository.getCalendarBookings(
      venueId,
      startDate,
      endDate
    );
  }

  /**
   * Get dashboard statistics for venue owner
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Get all venues owned by user
    const venues = await Venue.find({createdBy: userId, isActive: true});
    const venueIds = venues.map(v => (v._id as any).toString());

    const stats = {
      totalRevenue: 0,
      totalBookings: 0,
      upcomingBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      noShowBookings: 0,
      occupancyRate: 0,
      revenueByMonth: [] as Array<{month: string; revenue: number}>,
    };

    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    for (const venueId of venueIds) {
      const analytics = await this.bookingRepository.getVenueAnalytics(
        venueId,
        defaultStartDate,
        defaultEndDate
      );
      const statusCounts: Record<string, number> =
        analytics.statusCounts?.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}) || {};

      const revenueData = analytics.revenue[0] || {totalRevenue: 0};

      stats.totalRevenue += revenueData.totalRevenue;
      stats.totalBookings += Object.values(statusCounts).reduce(
        (a, b) => a + b,
        0
      );
      stats.completedBookings += statusCounts[BookingStatus.COMPLETED] || 0;
      stats.cancelledBookings += statusCounts[BookingStatus.CANCELLED] || 0;
      stats.noShowBookings += statusCounts[BookingStatus.NO_SHOW] || 0;
    }

    // Count upcoming bookings
    for (const venueId of venueIds) {
      const upcoming =
        await this.bookingRepository.findUpcomingByVenue(venueId);
      stats.upcomingBookings += upcoming.length;
    }

    return stats;
  }

  /**
   * Send booking confirmation email
   */
  private async sendBookingConfirmationEmail(booking: IBooking): Promise<void> {
    try {
      const populated = await booking.populate([
        {path: "venue", select: "name location contactInfo"},
        {path: "user", select: "email profile"},
      ]);

      await emailService.sendBookingConfirmationEmail({
        booking: populated,
        venue: populated.venue as any,
        user: populated.user as any,
        priceBreakdown: {
          basePrice: booking.basePrice,
          discounts: [],
          totalPrice: booking.totalPrice,
        },
      });
    } catch (error) {
      logger.error("Failed to send booking confirmation email", {
        error,
        bookingId: booking.id,
      });
    }
  }

  /**
   * Send cancellation email
   */
  private async sendCancellationEmail(
    booking: IBooking,
    refundAmount: number
  ): Promise<void> {
    try {
      const populated = await booking.populate([
        {path: "venue", select: "name location"},
        {path: "user", select: "email profile"},
      ]);

      await emailService.sendBookingCancellationEmail({
        booking: populated,
        venue: populated.venue as any,
        user: populated.user as any,
        refundAmount,
      });
    } catch (error) {
      logger.error("Failed to send cancellation email", {
        error,
        bookingId: booking.id,
      });
    }
  }
}
