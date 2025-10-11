# Quick Start Guide - Venue Booking System

## Prerequisites

- Node.js 16+
- MongoDB running
- Environment variables configured

## Environment Setup

Add to your `.env` file:

```bash
# Email Service (Required for booking confirmations)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Pricing Configuration (Optional - defaults provided)
DEFAULT_HOURLY_RATE=50
PEAK_HOUR_MULTIPLIER=1.5
EARLY_BIRD_DISCOUNT=10
EARLY_BIRD_DAYS=7
GROUP_DISCOUNT_THRESHOLD=5
GROUP_DISCOUNT_PERCENTAGE=15
```

## Installation

```bash
# Install dependencies (if not already done)
npm install

# The booking system is integrated into the venues module
# No additional installation needed
```

## Usage

### 1. Start the Server

```bash
npm run dev
```

The booking endpoints are now available at:

- Base URL: `http://localhost:3000/api/v1/venues/bookings`

### 2. Create a Venue (Required First)

```bash
curl -X POST http://localhost:3000/api/v1/venues \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Sports Arena",
    "location": {
      "coordinates": [-73.935242, 40.730610],
      "address": "123 Main St",
      "city": "New York",
      "country": "USA"
    },
    "surfaceType": "indoor",
    "pricing": {
      "hourlyRate": 50,
      "currency": "USD"
    },
    "operatingHours": {
      "monday": { "open": "09:00", "close": "22:00" },
      "tuesday": { "open": "09:00", "close": "22:00" }
    }
  }'
```

### 3. Check Availability

```bash
curl -X POST http://localhost:3000/api/v1/venues/bookings/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "venueId": "YOUR_VENUE_ID",
    "startTime": "2025-10-15T14:00:00Z",
    "endTime": "2025-10-15T16:00:00Z"
  }'
```

### 4. Create a Booking

```bash
curl -X POST http://localhost:3000/api/v1/venues/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "venueId": "YOUR_VENUE_ID",
    "startTime": "2025-10-15T18:00:00Z",
    "endTime": "2025-10-15T20:00:00Z",
    "bookingType": "hourly",
    "participants": 6,
    "promoCodes": ["SAVE10"]
  }'
```

### 5. View Your Bookings

```bash
curl -X GET http://localhost:3000/api/v1/venues/bookings/my-bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Venue Owner Dashboard

```bash
# Get analytics
curl -X GET http://localhost:3000/api/v1/venues/bookings/venue/YOUR_VENUE_ID/analytics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get calendar view
curl -X GET "http://localhost:3000/api/v1/venues/bookings/venue/YOUR_VENUE_ID/calendar?startDate=2025-10-01&endDate=2025-10-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Creating Promo Codes

You can create promo codes directly in MongoDB:

```javascript
// Connect to MongoDB
use sportification

// Create a promo code
db.promocodes.insertOne({
  code: "SAVE10",
  description: "10% off all bookings",
  discountType: "percentage",
  discountValue: 10,
  validFrom: new Date("2025-01-01"),
  validUntil: new Date("2025-12-31"),
  usageLimit: 1000,
  usedCount: 0,
  applicableVenues: [],  // Empty = applies to all venues
  isActive: true,
  createdBy: ObjectId("YOUR_ADMIN_USER_ID"),
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Testing the Flow

### Complete Booking Journey

1. **Check availability** → Get available slots
2. **Create booking** → Receive confirmation email
3. **View booking** → See all details
4. **Check-in** (30 min before) → Update status
5. **Check-out** (after use) → Complete booking

### Cancellation Flow

1. **Create booking**
2. **Cancel booking** → Calculate refund automatically
3. **Receive email** → Get cancellation confirmation

## Common Operations

### Filter Bookings

```bash
# By status
curl -X GET "http://localhost:3000/api/v1/venues/bookings?status=confirmed" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# By date range
curl -X GET "http://localhost:3000/api/v1/venues/bookings?startDate=2025-10-01&endDate=2025-10-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# By payment status
curl -X GET "http://localhost:3000/api/v1/venues/bookings?paymentStatus=paid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Booking

```bash
curl -X PATCH http://localhost:3000/api/v1/venues/bookings/BOOKING_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2025-10-15T19:00:00Z",
    "endTime": "2025-10-15T21:00:00Z",
    "participants": 8
  }'
```

### Cancel Booking

```bash
curl -X POST http://localhost:3000/api/v1/venues/bookings/BOOKING_ID/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Schedule conflict, unable to attend"
  }'
```

## Pricing Examples

### Standard Booking (Weekday, 2pm-4pm, 2 people)

- Base rate: $50/hour × 2 hours = $100
- No peak pricing (before 5 PM)
- **Total: $100**

### Peak Booking (Weekday, 6pm-8pm, 2 people)

- Base rate: $50/hour × 2 hours = $100
- Peak pricing: +50% = $150
- **Total: $150**

### Group Booking (Weekend, 6pm-8pm, 6 people, SAVE10 code)

- Base rate: $50/hour × 2 hours = $100
- Peak pricing: +50% = $150
- Group discount: -15% = $127.50
- Promo code: -10% = $114.75
- **Total: $114.75**

### Early Bird (Booked 14 days in advance, 5 people)

- Base rate: $50/hour × 2 hours = $100
- Early bird: -10% = $90
- **Total: $90**

## Troubleshooting

### Issue: Email not sending

**Solution**: Check email configuration in `.env` file. For Gmail:

1. Enable 2-factor authentication
2. Generate app-specific password
3. Use that password in `EMAIL_PASS`

### Issue: Booking conflict not detected

**Solution**: Ensure MongoDB indexes are created:

```bash
npm run dev  # Indexes are created automatically on startup
```

### Issue: Promo code not working

**Check**:

- Code is active: `isActive: true`
- Current date is within validity period
- Usage limit not exceeded
- Minimum booking amount met

### Issue: Refund amount is 0

**Reason**: Cancellation is less than 12 hours before booking start time (no refund policy).

## API Documentation

Full API documentation available at:

- Swagger UI: `http://localhost:3000/api/v1/docs`
- Feature Docs: `docs/features/venue-booking.md`

## Support

- Slack: #backend-help
- Email: <backend-team@sportification.com>
- GitHub Issues: Report bugs and feature requests

## Next Steps

1. ✅ Test complete booking flow
2. ✅ Configure email service
3. ✅ Create initial promo codes
4. ✅ Set up monitoring
5. ✅ Review analytics dashboard

---

**Happy Booking!** 🎉
