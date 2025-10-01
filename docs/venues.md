# Venue Management

## Features

- Create and manage sports venues
- Location-based venue search
- Nearby venue discovery
- Venue availability checking
- Venue ratings and reviews
- Amenity filtering
- Surface type categorization
- Venue photos and descriptions
- User-created venues

## Endpoints

### Venue Management

- `POST /api/v1/venues` → Create a new venue (requires auth)
- `GET /api/v1/venues` → Get all venues with filtering
- `GET /api/v1/venues/:id` → Get specific venue details by ID
- `PUT /api/v1/venues/:id` → Update venue details (requires auth, creator only)
- `DELETE /api/v1/venues/:id` → Delete a venue (requires auth, creator only)

### Venue Search & Discovery

- `GET /api/v1/venues/search` → Search venues by name or location
- `GET /api/v1/venues/nearby` → Find venues near a location
- `GET /api/v1/venues/amenities` → Get venues by specific amenities

### Venue Operations

- `GET /api/v1/venues/:id/availability` → Check venue availability for date/time
- `GET /api/v1/venues/user/:userId` → Get venues created by a specific user

## Request/Response Examples

### Create Venue

**Request:**
```http
POST /api/v1/venues
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Central Park Tennis Courts",
  "description": "Premium outdoor tennis facility with 8 courts",
  "location": {
    "lat": 40.7829,
    "lng": -73.9654,
    "address": "Central Park, New York, NY 10024",
    "city": "New York",
    "country": "USA"
  },
  "surfaceType": "hard",
  "sports": ["tennis"],
  "amenities": ["parking", "restrooms", "water_fountain", "lighting"],
  "capacity": 16,
  "availability": {
    "monday": { "open": "06:00", "close": "22:00" },
    "tuesday": { "open": "06:00", "close": "22:00" },
    "wednesday": { "open": "06:00", "close": "22:00" },
    "thursday": { "open": "06:00", "close": "22:00" },
    "friday": { "open": "06:00", "close": "22:00" },
    "saturday": { "open": "07:00", "close": "21:00" },
    "sunday": { "open": "07:00", "close": "21:00" }
  },
  "pricing": {
    "currency": "USD",
    "hourlyRate": 25,
    "description": "Per court per hour"
  },
  "contact": {
    "phone": "+1-555-0123",
    "email": "info@centralparktennis.com",
    "website": "https://centralparktennis.com"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "venue": {
      "_id": "60d5ecb54b24a50015c4d3a0",
      "name": "Central Park Tennis Courts",
      "description": "Premium outdoor tennis facility with 8 courts",
      "creator": {
        "_id": "60d5ecb54b24a50015c4d1a0",
        "username": "johndoe",
        "firstName": "John"
      },
      "location": {
        "type": "Point",
        "coordinates": [-73.9654, 40.7829],
        "lat": 40.7829,
        "lng": -73.9654,
        "address": "Central Park, New York, NY 10024",
        "city": "New York",
        "country": "USA"
      },
      "surfaceType": "hard",
      "sports": ["tennis"],
      "amenities": ["parking", "restrooms", "water_fountain", "lighting"],
      "capacity": 16,
      "availability": {
        "monday": { "open": "06:00", "close": "22:00" },
        "tuesday": { "open": "06:00", "close": "22:00" },
        "wednesday": { "open": "06:00", "close": "22:00" },
        "thursday": { "open": "06:00", "close": "22:00" },
        "friday": { "open": "06:00", "close": "22:00" },
        "saturday": { "open": "07:00", "close": "21:00" },
        "sunday": { "open": "07:00", "close": "21:00" }
      },
      "pricing": {
        "currency": "USD",
        "hourlyRate": 25,
        "description": "Per court per hour"
      },
      "contact": {
        "phone": "+1-555-0123",
        "email": "info@centralparktennis.com",
        "website": "https://centralparktennis.com"
      },
      "rating": {
        "average": 0,
        "count": 0
      },
      "verified": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Venue created successfully"
}
```

### Get All Venues

**Request:**
```http
GET /api/v1/venues?sport=tennis&city=New York&page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "venues": [
      {
        "_id": "60d5ecb54b24a50015c4d3a0",
        "name": "Central Park Tennis Courts",
        "location": {
          "address": "Central Park, New York, NY 10024",
          "city": "New York",
          "country": "USA"
        },
        "surfaceType": "hard",
        "sports": ["tennis"],
        "amenities": ["parking", "restrooms", "water_fountain", "lighting"],
        "rating": {
          "average": 4.5,
          "count": 127
        },
        "pricing": {
          "currency": "USD",
          "hourlyRate": 25
        },
        "distance": null
      },
      {
        "_id": "60d5ecb54b24a50015c4d3a1",
        "name": "Riverside Tennis Club",
        "location": {
          "address": "123 Riverside Dr, New York, NY 10025",
          "city": "New York",
          "country": "USA"
        },
        "surfaceType": "clay",
        "sports": ["tennis"],
        "amenities": ["parking", "restrooms", "pro_shop", "cafe"],
        "rating": {
          "average": 4.7,
          "count": 89
        },
        "pricing": {
          "currency": "USD",
          "hourlyRate": 35
        },
        "distance": null
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3
  }
}
```

### Get Venue by ID

**Request:**
```http
GET /api/v1/venues/60d5ecb54b24a50015c4d3a0
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "venue": {
      "_id": "60d5ecb54b24a50015c4d3a0",
      "name": "Central Park Tennis Courts",
      "description": "Premium outdoor tennis facility with 8 courts",
      "creator": {
        "_id": "60d5ecb54b24a50015c4d1a0",
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe"
      },
      "location": {
        "type": "Point",
        "coordinates": [-73.9654, 40.7829],
        "lat": 40.7829,
        "lng": -73.9654,
        "address": "Central Park, New York, NY 10024",
        "city": "New York",
        "country": "USA"
      },
      "surfaceType": "hard",
      "sports": ["tennis"],
      "amenities": ["parking", "restrooms", "water_fountain", "lighting"],
      "capacity": 16,
      "availability": {
        "monday": { "open": "06:00", "close": "22:00" },
        "tuesday": { "open": "06:00", "close": "22:00" },
        "wednesday": { "open": "06:00", "close": "22:00" },
        "thursday": { "open": "06:00", "close": "22:00" },
        "friday": { "open": "06:00", "close": "22:00" },
        "saturday": { "open": "07:00", "close": "21:00" },
        "sunday": { "open": "07:00", "close": "21:00" }
      },
      "pricing": {
        "currency": "USD",
        "hourlyRate": 25,
        "description": "Per court per hour"
      },
      "contact": {
        "phone": "+1-555-0123",
        "email": "info@centralparktennis.com",
        "website": "https://centralparktennis.com"
      },
      "photos": [
        {
          "url": "https://example.com/venues/central-park-1.jpg",
          "caption": "Court 1 - Hard surface"
        },
        {
          "url": "https://example.com/venues/central-park-2.jpg",
          "caption": "Facility overview"
        }
      ],
      "rating": {
        "average": 4.5,
        "count": 127,
        "breakdown": {
          "5": 80,
          "4": 35,
          "3": 10,
          "2": 1,
          "1": 1
        }
      },
      "verified": true,
      "upcomingMatches": 12,
      "createdAt": "2024-01-10T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Search Venues

**Request:**
```http
GET /api/v1/venues/search?q=tennis&location=New York
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "venues": [
      {
        "_id": "60d5ecb54b24a50015c4d3a0",
        "name": "Central Park Tennis Courts",
        "location": {
          "address": "Central Park, New York, NY 10024",
          "city": "New York"
        },
        "sports": ["tennis"],
        "rating": {
          "average": 4.5,
          "count": 127
        }
      }
    ]
  }
}
```

### Find Nearby Venues

**Request:**
```http
GET /api/v1/venues/nearby?lat=40.7829&lng=-73.9654&maxDistance=5000&sport=tennis
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "venues": [
      {
        "_id": "60d5ecb54b24a50015c4d3a0",
        "name": "Central Park Tennis Courts",
        "location": {
          "lat": 40.7829,
          "lng": -73.9654,
          "address": "Central Park, New York, NY 10024",
          "city": "New York"
        },
        "surfaceType": "hard",
        "sports": ["tennis"],
        "rating": {
          "average": 4.5,
          "count": 127
        },
        "distance": 150
      },
      {
        "_id": "60d5ecb54b24a50015c4d3a1",
        "name": "Riverside Tennis Club",
        "location": {
          "lat": 40.7950,
          "lng": -73.9720,
          "address": "123 Riverside Dr, New York, NY 10025",
          "city": "New York"
        },
        "surfaceType": "clay",
        "sports": ["tennis"],
        "rating": {
          "average": 4.7,
          "count": 89
        },
        "distance": 1250
      }
    ]
  }
}
```

### Get Venues by Amenities

**Request:**
```http
GET /api/v1/venues/amenities?amenities=parking,lighting&sport=tennis
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "venues": [
      {
        "_id": "60d5ecb54b24a50015c4d3a0",
        "name": "Central Park Tennis Courts",
        "location": {
          "city": "New York"
        },
        "amenities": ["parking", "restrooms", "water_fountain", "lighting"],
        "rating": {
          "average": 4.5
        }
      }
    ]
  }
}
```

### Check Venue Availability

**Request:**
```http
GET /api/v1/venues/60d5ecb54b24a50015c4d3a0/availability?date=2024-01-20&time=14:00
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "available": true,
    "venue": {
      "_id": "60d5ecb54b24a50015c4d3a0",
      "name": "Central Park Tennis Courts",
      "capacity": 16
    },
    "date": "2024-01-20T00:00:00.000Z",
    "time": "14:00",
    "scheduledMatches": [
      {
        "_id": "60d5ecb54b24a50015c4d2a0",
        "sport": "tennis",
        "schedule": {
          "time": "14:00"
        },
        "participantCount": 4
      }
    ],
    "capacityUsed": 4,
    "capacityAvailable": 12
  }
}
```

### Update Venue

**Request:**
```http
PUT /api/v1/venues/60d5ecb54b24a50015c4d3a0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "description": "Premium outdoor tennis facility with 8 newly resurfaced courts",
  "amenities": ["parking", "restrooms", "water_fountain", "lighting", "pro_shop"],
  "pricing": {
    "currency": "USD",
    "hourlyRate": 30,
    "description": "Per court per hour (updated rates)"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Venue updated successfully",
  "data": {
    "venue": {
      "_id": "60d5ecb54b24a50015c4d3a0",
      "description": "Premium outdoor tennis facility with 8 newly resurfaced courts",
      "amenities": ["parking", "restrooms", "water_fountain", "lighting", "pro_shop"],
      "pricing": {
        "currency": "USD",
        "hourlyRate": 30,
        "description": "Per court per hour (updated rates)"
      },
      "updatedAt": "2024-01-16T10:00:00.000Z"
    }
  }
}
```

### Delete Venue

**Request:**
```http
DELETE /api/v1/venues/60d5ecb54b24a50015c4d3a0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Venue deleted successfully"
}
```

### Get User Venues

**Request:**
```http
GET /api/v1/venues/user/60d5ecb54b24a50015c4d1a0
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "venues": [
      {
        "_id": "60d5ecb54b24a50015c4d3a0",
        "name": "Central Park Tennis Courts",
        "location": {
          "city": "New York"
        },
        "sports": ["tennis"],
        "rating": {
          "average": 4.5,
          "count": 127
        },
        "createdAt": "2024-01-10T10:30:00.000Z"
      }
    ]
  }
}
```

## Query Parameters

### Get All Venues (`/venues`)
- `sport` - Filter by sport type
- `city` - Filter by city
- `country` - Filter by country
- `surfaceType` - Filter by surface type (grass, clay, hard, indoor, outdoor, sand, pool, court)
- `verified` - Filter by verification status (true/false)
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Results per page

### Search Venues (`/venues/search`)
- `q` (required) - Search query (venue name, location)
- `location` - Location filter (city or address)
- `sport` - Filter by sport type
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Results per page

### Find Nearby Venues (`/venues/nearby`)
- `lat` (required) - Latitude coordinate
- `lng` (required) - Longitude coordinate
- `maxDistance` (default: 5000) - Maximum distance in meters
- `sport` - Filter by sport type
- `amenities` - Comma-separated list of required amenities
- `limit` (default: 20, max: 50) - Results per page

### Get Venues by Amenities (`/venues/amenities`)
- `amenities` (required) - Comma-separated list of amenities
- `sport` - Filter by sport type
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Results per page

### Check Availability (`/venues/:id/availability`)
- `date` (required) - Date in ISO 8601 format (YYYY-MM-DD)
- `time` (required) - Time in HH:MM format

## Surface Types

- `grass` - Natural grass surface
- `clay` - Clay court surface
- `hard` - Hard court surface (asphalt/concrete)
- `indoor` - Indoor facility
- `outdoor` - Outdoor facility
- `sand` - Sand surface (beach volleyball)
- `pool` - Swimming pool
- `court` - Generic court surface

## Common Amenities

- `parking` - Parking facilities
- `restrooms` - Restroom facilities
- `water_fountain` - Water fountains
- `lighting` - Night lighting
- `pro_shop` - Pro shop for equipment
- `cafe` - Cafe or refreshments
- `locker_rooms` - Locker room facilities
- `showers` - Shower facilities
- `seating` - Spectator seating
- `wifi` - WiFi connectivity

## Notes on Auth/Security

### JWT Authentication
- **Required for**: Creating, updating, deleting venues
- **Optional for**: Viewing venues

```http
Authorization: Bearer <jwt_token>
```

### Permissions
- **Venue Creator**: Can update and delete their venues
- **Admins**: Can verify venues and moderate content
- **Anyone**: Can view and search venues

### Venue Verification
- Verified badge indicates admin-approved venues
- Verified venues appear higher in search results
- Verification requires proof of ownership or authorization

### Rate Limiting
- Venue creation: **5 venues per day per user**
- Venue queries: **100 requests per 15 minutes**

## Real-time Requirements

### No WebSocket Events
Venue data is generally static and doesn't require real-time updates. However:

- Match creation at a venue triggers recalculation of availability
- Venue updates are reflected in search results within 1 minute
- Popular venues cache availability data for performance

## Integration with Matches

When creating a match, venues can be:
1. Selected from existing venues
2. Created on-the-fly (if authenticated)
3. Left empty for casual/pickup games

Venue availability is automatically checked when scheduling matches.

## Best Practices

### Frontend Implementation
1. Use map view for nearby venue discovery
2. Cache venue data for offline browsing
3. Show real-time availability when booking
4. Implement favorite venues feature
5. Allow users to add photos/reviews
6. Provide directions/navigation integration
7. Show weather conditions for outdoor venues
