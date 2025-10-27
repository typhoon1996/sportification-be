/**
 * Booking Repository - Data Access Layer
 *
 * Handles all database operations for bookings following the Repository pattern.
 */

import {Booking} from "../../domain/models/Booking";
import {IBooking, BookingStatus, BookingFilterOptions} from "../../types";

export class BookingRepository {
  /**
   * Create a new booking
   */
  async create(bookingData: Partial<IBooking>): Promise<IBooking> {
    const booking = new Booking(bookingData);
    await booking.save();
    return booking.populate(["venue", "user"]);
  }

  /**
   * Find booking by ID
   */
  async findById(bookingId: string): Promise<IBooking | null> {
    return Booking.findById(bookingId)
      .populate("venue")
      .populate("user", "email profile")
      .exec();
  }

  /**
   * Find conflicting bookings for a venue in a time range
   */
  async findConflictingBookings(
    venueId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<IBooking[]> {
    const query: any = {
      venue: venueId,
      status: {$in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]},
      $or: [
        // New booking starts during existing booking
        {startTime: {$lte: startTime}, endTime: {$gt: startTime}},
        // New booking ends during existing booking
        {startTime: {$lt: endTime}, endTime: {$gte: endTime}},
        // New booking completely contains existing booking
        {startTime: {$gte: startTime}, endTime: {$lte: endTime}},
      ],
    };

    if (excludeBookingId) {
      query._id = {$ne: excludeBookingId};
    }

    return Booking.find(query).exec();
  }

  /**
   * Find bookings by user
   */
  async findByUser(
    userId: string,
    filters?: BookingFilterOptions
  ): Promise<IBooking[]> {
    const query: any = {user: userId};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.venueId) {
      query.venue = filters.venueId;
    }

    if (filters?.startDate && filters?.endDate) {
      query.startTime = {
        $gte: filters.startDate,
        $lte: filters.endDate,
      };
    }

    return Booking.find(query)
      .populate("venue", "name location")
      .sort({startTime: -1})
      .limit(filters?.limit || 100)
      .exec();
  }

  /**
   * Find bookings by venue
   */
  async findByVenue(
    venueId: string,
    filters?: BookingFilterOptions
  ): Promise<IBooking[]> {
    const query: any = {venue: venueId};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.startDate && filters?.endDate) {
      query.startTime = {
        $gte: filters.startDate,
        $lte: filters.endDate,
      };
    }

    return Booking.find(query)
      .populate("user", "email profile")
      .sort({startTime: 1})
      .limit(filters?.limit || 100)
      .exec();
  }

  /**
   * Update booking
   */
  async update(
    bookingId: string,
    updateData: Partial<IBooking>
  ): Promise<IBooking | null> {
    return Booking.findByIdAndUpdate(bookingId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("venue")
      .populate("user", "email profile")
      .exec();
  }

  /**
   * Update booking status
   */
  async updateStatus(
    bookingId: string,
    status: BookingStatus
  ): Promise<IBooking | null> {
    return this.update(bookingId, {status});
  }

  /**
   * Delete booking (soft delete by setting status to cancelled)
   */
  async delete(bookingId: string): Promise<IBooking | null> {
    return this.updateStatus(bookingId, BookingStatus.CANCELLED);
  }

  /**
   * Hard delete booking (for admin purposes)
   */
  async hardDelete(bookingId: string): Promise<void> {
    await Booking.findByIdAndDelete(bookingId);
  }

  /**
   * Find upcoming bookings for a user
   */
  async findUpcomingByUser(userId: string): Promise<IBooking[]> {
    return Booking.find({
      user: userId,
      status: {$in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]},
      startTime: {$gte: new Date()},
    })
      .populate("venue", "name location")
      .sort({startTime: 1})
      .exec();
  }

  /**
   * Find past bookings for a user
   */
  async findPastByUser(userId: string, limit = 20): Promise<IBooking[]> {
    return Booking.find({
      user: userId,
      status: {$in: [BookingStatus.COMPLETED, BookingStatus.CANCELLED]},
      endTime: {$lt: new Date()},
    })
      .populate("venue", "name location")
      .sort({endTime: -1})
      .limit(limit)
      .exec();
  }

  /**
   * Count bookings by status
   */
  async countByStatus(status: BookingStatus): Promise<number> {
    return Booking.countDocuments({status}).exec();
  }

  /**
   * Count bookings by venue
   */
  async countByVenue(venueId: string): Promise<number> {
    return Booking.countDocuments({venue: venueId}).exec();
  }

  /**
   * Find bookings that need check-in reminder (starting in 1 hour)
   */
  async findNeedingCheckInReminder(): Promise<IBooking[]> {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

    return Booking.find({
      status: BookingStatus.CONFIRMED,
      startTime: {$gte: oneHourFromNow, $lte: twoHoursFromNow},
    })
      .populate("user", "email profile")
      .populate("venue", "name location")
      .exec();
  }

  /**
   * Find bookings that are overdue (past end time but not completed/cancelled)
   */
  async findOverdue(): Promise<IBooking[]> {
    return Booking.find({
      status: {$in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]},
      endTime: {$lt: new Date()},
    })
      .populate("venue", "name location")
      .populate("user", "email profile")
      .exec();
  }

  /**
   * Find bookings with filters and pagination
   */
  async findWithFilters(
    filters: BookingFilterOptions,
    page: number = 1,
    limit: number = 10
  ): Promise<{bookings: IBooking[]; total: number}> {
    const query: any = {};

    if (filters.venueId) {
      query.venue = filters.venueId;
    }

    if (filters.userId) {
      query.user = filters.userId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    if (filters.startDate && filters.endDate) {
      query.startTime = {
        $gte: filters.startDate,
        $lte: filters.endDate,
      };
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("venue", "name location")
        .populate("user", "email profile")
        .sort({startTime: -1})
        .skip(skip)
        .limit(limit)
        .exec(),
      Booking.countDocuments(query).exec(),
    ]);

    return {bookings, total};
  }

  /**
   * Get venue analytics
   */
  async getVenueAnalytics(
    venueId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const bookings = await Booking.find({
      venue: venueId,
      startTime: {$gte: startDate, $lte: endDate},
      status: {$in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]},
    }).exec();

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalBookings = bookings.length;
    const averageBookingValue =
      totalBookings > 0 ? totalRevenue / totalBookings : 0;

    return {
      totalRevenue,
      totalBookings,
      averageBookingValue,
      bookings,
    };
  }

  /**
   * Get calendar bookings for a venue
   */
  async getCalendarBookings(
    venueId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IBooking[]> {
    return Booking.find({
      venue: venueId,
      startTime: {$gte: startDate, $lte: endDate},
      status: {$in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]},
    })
      .populate("user", "email profile")
      .sort({startTime: 1})
      .exec();
  }

  /**
   * Find upcoming bookings for a venue
   */
  async findUpcomingByVenue(venueId: string): Promise<IBooking[]> {
    return Booking.find({
      venue: venueId,
      status: {$in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]},
      startTime: {$gte: new Date()},
    })
      .populate("user", "email profile")
      .sort({startTime: 1})
      .exec();
  }
}
