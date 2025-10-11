# Advanced Venue Booking System

## Overview

The Advanced Venue Booking System is a comprehensive solution for managing venue bookings with real-time availability, dynamic pricing, and extensive booking management features.

## Features Implemented

### ✅ Booking Management

#### Real-time Availability Calendar

- **Endpoint**: `POST /api/v1/venues/bookings/check-availability`
- Displays open time slots for venues
- Checks for booking conflicts
- Suggests alternative available slots

#### Time Slot Booking

- **Endpoint**: `POST /api/v1/venues/bookings`
- Supports hourly or daily bookings
- Validates venue operating hours
- Prevents double bookings

#### Booking Conflicts Prevention

- Automatic conflict detection before booking creation
- Checks overlapping time slots
- Returns conflicting bookings with suggested alternatives

#### Booking Confirmation Emails

- Automated email confirmations using Nodemailer
- Detailed booking information
- Venue location and contact details

### ✅ Booking Operations

#### Check-in/Check-out System

- **Check-in**: `POST /api/v1/venues/bookings/:id/checkin`
- **Check-out**: `POST /api/v1/venues/bookings/:id/checkout`
- Tracks booking status transitions
- 30-minute grace period before booking start time

#### Booking Modifications

- **Endpoint**: `PATCH /api/v1/venues/bookings/:id`
- Update booking date and time
- Modify number of participants
- Update booking notes
- Automatic conflict checking for new times

#### Cancellation with Refund Policies

- **Endpoint**: `POST /api/v1/venues/bookings/:id/cancel`
- Automatic refund calculation:
  - **24+ hours before**: 100% refund
  - **12-24 hours before**: 50% refund
  - **<12 hours before**: No refund
- Email notification with refund details

#### No-show Management

- **Endpoint**: `POST /api/v1/venues/bookings/:id/no-show`
- Venue owners can mark bookings as no-show
- Tracks no-show statistics
- Only available after booking end time

#### Booking History

- **Endpoint**: `GET /api/v1/venues/bookings/my-bookings`
- Complete booking history per user
- Filter by status (upcoming, completed, cancelled)
- Full booking details with venue information

### ✅ Pricing & Discounts

#### Dynamic Pricing

- **Peak Pricing** (50% increase):
  - After 5 PM on weekdays
  - All day on weekends (Saturday & Sunday)
- **Off-Peak Pricing**:
  - Standard rates before 5 PM on weekdays

#### Early Bird Discounts

- **10% off** for bookings made 7+ days in advance
- Automatically applied during booking creation
- Clearly shown in price breakdown

#### Group Booking Discounts

- **15% off** for groups of 5 or more participants
- Automatically applied based on participant count
- Combined with other applicable discounts

#### Promotional Codes

- **Model**: PromoCode with comprehensive features
- Support for percentage and fixed amount discounts
- Minimum booking amount requirements
- Maximum discount caps
- Usage limits and tracking
- Venue-specific applicability
- Validity period management
- Example codes: `SAVE10`, `WELCOME20`

#### Package Deals

- Extensible architecture for custom packages
- Ready for implementation in pricing configuration

### ✅ Venue Owner Dashboard

#### Booking Calendar View

- **Endpoint**: `GET /api/v1/venues/:venueId/calendar`
- Displays all bookings for owned venues
- Date range filtering
- Color-coded by booking status
- Real-time availability display

#### Revenue Analytics

- **Endpoint**: `GET /api/v1/venues/:venueId/analytics`
- Total revenue from confirmed bookings
- Average booking value calculation
- Revenue trends and insights
- Date range filtering

#### Booking Statistics

- **Endpoint**: `GET /api/v1/venues/bookings/dashboard/stats`
- Total bookings count
- Confirmed bookings
- Cancelled bookings
- No-show bookings
- Completed bookings
- Occupancy rate calculation

#### Popular Time Slots Analysis

- Identifies most booked time slots
- Hour-by-hour booking frequency
- Helps optimize pricing and availability

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/venues/bookings/check-availability` | Check availability for time slot |

### User Endpoints (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/venues/bookings` | Create new booking |
| GET | `/api/v1/venues/bookings` | List all bookings (with filters) |
| GET | `/api/v1/venues/bookings/my-bookings` | Get user's bookings |
| GET | `/api/v1/venues/bookings/:id` | Get booking by ID |
| PATCH | `/api/v1/venues/bookings/:id` | Update booking |
| POST | `/api/v1/venues/bookings/:id/cancel` | Cancel booking |
| POST | `/api/v1/venues/bookings/:id/confirm-payment` | Confirm payment |
| POST | `/api/v1/venues/bookings/:id/checkin` | Check in to booking |
| POST | `/api/v1/venues/bookings/:id/checkout` | Check out from booking |

### Venue Owner Endpoints (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/venues/bookings/venue/:venueId` | Get venue bookings |
| GET | `/api/v1/venues/bookings/venue/:venueId/analytics` | Get venue analytics |
| GET | `/api/v1/venues/bookings/venue/:venueId/calendar` | Get booking calendar |
| GET | `/api/v1/venues/bookings/dashboard/stats` | Get dashboard statistics |
| POST | `/api/v1/venues/bookings/:id/no-show` | Mark booking as no-show |

## Data Models

### Booking Model

```typescript
{
  venue: ObjectId,              // Reference to Venue
  user: ObjectId,               // Reference to User
  startTime: Date,              // Booking start time
  endTime: Date,                // Booking end time
  status: BookingStatus,        // pending, confirmed, checked_in, completed, cancelled, no_show
  bookingType: BookingType,     // hourly, daily, recurring
  participants: Number,         // Number of participants
  basePrice: Number,            // Original price
  discountAmount: Number,       // Total discount applied
  totalPrice: Number,           // Final price
  pricingType: PricingType,     // standard, peak, off_peak
  appliedPromoCodes: [String],  // Promo codes used
  paymentStatus: String,        // pending, paid, refunded, partially_refunded
  paymentMethod: String,        // Payment method used
  transactionId: String,        // Payment transaction ID
  checkInTime: Date,            // Actual check-in time
  checkOutTime: Date,           // Actual check-out time
  notes: String,                // Booking notes
  cancellationReason: String,   // Reason for cancellation
  cancelledAt: Date,            // Cancellation timestamp
  refundAmount: Number,         // Refund amount if cancelled
  refundedAt: Date,             // Refund timestamp
}
```

### PromoCode Model

```typescript
{
  code: String,                 // Unique promo code (e.g., "SAVE10")
  description: String,          // Description of the promotion
  discountType: String,         // percentage or fixed
  discountValue: Number,        // Discount amount or percentage
  minBookingAmount: Number,     // Minimum booking amount
  maxDiscountAmount: Number,    // Maximum discount cap
  validFrom: Date,              // Start of validity period
  validUntil: Date,             // End of validity period
  usageLimit: Number,           // Maximum number of uses
  usedCount: Number,            // Current usage count
  applicableVenues: [ObjectId], // Specific venues or empty for all
  isActive: Boolean,            // Active status
  createdBy: ObjectId,          // Creator reference
}
```

## Request/Response Examples

### 1. Create Booking

**Request:**

```bash
POST /api/v1/venues/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "venueId": "507f1f77bcf86cd799439011",
  "startTime": "2025-10-15T18:00:00Z",
  "endTime": "2025-10-15T20:00:00Z",
  "bookingType": "hourly",
  "participants": 6,
  "notes": "Team practice session",
  "promoCodes": ["SAVE10"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": "507f1f77bcf86cd799439012",
      "venue": {...},
      "user": {...},
      "startTime": "2025-10-15T18:00:00Z",
      "endTime": "2025-10-15T20:00:00Z",
      "basePrice": 150,
      "discountAmount": 37.5,
      "totalPrice": 112.5,
      "pricingType": "peak",
      "status": "pending",
      "durationHours": 2
    }
  }
}
```

### 2. Check Availability

**Request:**

```bash
POST /api/v1/venues/bookings/check-availability
Content-Type: application/json

{
  "venueId": "507f1f77bcf86cd799439011",
  "startTime": "2025-10-15T14:00:00Z",
  "endTime": "2025-10-15T16:00:00Z"
}
```

**Response (Available):**

```json
{
  "success": true,
  "data": {
    "isAvailable": true
  }
}
```

**Response (Unavailable):**

```json
{
  "success": true,
  "data": {
    "isAvailable": false,
    "conflictingBookings": [
      {
        "id": "507f1f77bcf86cd799439013",
        "startTime": "2025-10-15T13:00:00Z",
        "endTime": "2025-10-15T15:00:00Z"
      }
    ],
    "suggestedSlots": [
      {
        "startTime": "2025-10-15T16:00:00Z",
        "endTime": "2025-10-15T18:00:00Z"
      }
    ]
  }
}
```

### 3. Get Venue Analytics

**Request:**

```bash
GET /api/v1/venues/bookings/venue/507f1f77bcf86cd799439011/analytics?startDate=2025-10-01&endDate=2025-10-31
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "analytics": {
      "totalBookings": 45,
      "confirmedBookings": 38,
      "cancelledBookings": 5,
      "noShowBookings": 2,
      "completedBookings": 35,
      "totalRevenue": 4750.50,
      "averageBookingValue": 125.28,
      "occupancyRate": 68.5,
      "popularTimeSlots": [
        { "hour": 18, "bookings": 12 },
        { "hour": 19, "bookings": 10 },
        { "hour": 17, "bookings": 8 }
      ]
    }
  }
}
```

### 4. Cancel Booking

**Request:**

```bash
POST /api/v1/venues/bookings/507f1f77bcf86cd799439012/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Schedule conflict, unable to attend"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "booking": {
      "id": "507f1f77bcf86cd799439012",
      "status": "cancelled",
      "cancellationReason": "Schedule conflict, unable to attend",
      "refundAmount": 112.5,
      "cancelledAt": "2025-10-10T10:30:00Z",
      "refundedAt": "2025-10-10T10:30:00Z"
    }
  }
}
```

## Event-Driven Architecture

The booking system publishes events for integration with other modules:

### Published Events

| Event Type | Payload | Description |
|-----------|---------|-------------|
| `venues.booking.created` | bookingId, venueId, userId, startTime, endTime, totalPrice | New booking created |
| `venues.booking.updated` | bookingId, userId, updates | Booking updated |
| `venues.booking.cancelled` | bookingId, userId, reason, refundAmount | Booking cancelled |
| `venues.booking.payment.confirmed` | bookingId, transactionId, amount | Payment confirmed |
| `venues.booking.checkedIn` | bookingId, userId, checkInTime | User checked in |
| `venues.booking.completed` | bookingId, userId, checkOutTime | Booking completed |
| `venues.booking.noShow` | bookingId, userId | Marked as no-show |

### Event Subscribers

Other modules can subscribe to these events for:

- **Notifications**: Send push notifications and emails
- **Analytics**: Track booking trends and user behavior
- **Loyalty Programs**: Award points for bookings
- **Reviews**: Prompt for reviews after checkout

## Email Notifications

The system sends automated emails for:

### 1. Booking Confirmation

- Sent immediately after booking creation
- Includes all booking details
- Venue information and directions
- Check-in instructions

### 2. Cancellation Notification

- Sent when booking is cancelled
- Refund amount and policy details
- Timeline for refund processing

### 3. Booking Reminders

- Can be scheduled via background jobs
- Sent 24 hours before booking
- Includes check-in instructions

## Security & Validation

### Input Validation

- All endpoints use express-validator
- Request body and query parameters validated
- MongoDB ObjectId validation
- Date format validation (ISO 8601)

### Authorization

- Authentication required for all booking operations
- Venue owners can only access their own venue data
- Users can only manage their own bookings

### Data Integrity

- Booking conflicts prevented at database level
- Compound indexes for conflict checking
- Transaction-like behavior for booking creation

## Performance Optimizations

### Database Indexes

```javascript
// Conflict checking
{ venue: 1, status: 1, startTime: 1, endTime: 1 }

// User bookings
{ user: 1, status: 1 }

// Venue bookings
{ venue: 1, status: 1, paymentStatus: 1 }

// Analytics queries
{ createdAt: -1 }
```

### Query Optimization

- Lean queries for read-only operations
- Field selection to minimize data transfer
- Pagination for large result sets
- Aggregation pipelines for analytics

## Future Enhancements

### 1. Recurring Bookings

- Weekly/monthly recurring slots
- Bulk booking creation
- Recurring booking management

### 2. Payout Tracking

- Track venue owner payouts
- Payment schedule management
- Financial reporting

### 3. Customer Reviews

- Post-booking review system
- Rating aggregation
- Review moderation

### 4. Package Deals

- Multi-booking packages
- Season passes
- Corporate packages

### 5. Advanced Analytics

- Revenue forecasting
- Demand prediction
- Pricing optimization

## Testing

### Unit Tests

```bash
npm test src/modules/venues/domain/services/BookingService.test.ts
```

### Integration Tests

```bash
npm test src/modules/venues/api/controllers/BookingController.test.ts
```

### E2E Tests

```bash
npm test src/tests/e2e/booking-flow.test.ts
```

## Configuration

### Environment Variables

```bash
# Email Configuration (for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Pricing Configuration (optional, defaults in code)
DEFAULT_HOURLY_RATE=50
PEAK_HOUR_MULTIPLIER=1.5
EARLY_BIRD_DISCOUNT=10
GROUP_DISCOUNT_THRESHOLD=5
GROUP_DISCOUNT_PERCENTAGE=15
```

## Deployment Checklist

- [ ] Set up email service credentials
- [ ] Configure pricing parameters
- [ ] Set up payment gateway integration
- [ ] Create initial promo codes
- [ ] Test booking flow end-to-end
- [ ] Set up monitoring and alerts
- [ ] Configure backup and recovery
- [ ] Document operational procedures

## Support

For issues or questions:

1. Check API documentation at `/api/v1/docs`
2. Review error logs in `/logs`
3. Contact backend team via Slack #backend-help

---

**Last Updated**: October 10, 2025  
**Version**: 1.0  
**Maintained By**: Backend Team
