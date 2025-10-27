import swaggerJSDoc, {SwaggerDefinition} from "swagger-jsdoc";

/**
 * @constant swaggerDefinition
 * @description Comprehensive OpenAPI 3.0 specification for the Sportification backend.
 * Defines API metadata, server environments, tag taxonomy, reusable schemas,
 * shared response envelopes, authentication schemes, and global error templates.
 * Use this document to drive Swagger UI, client generation, and automated contract tests.
 *
 * Architecture: Modular Monolith with Event-Driven Communication
 * - Each module is a bounded context (IAM, Users, Matches, Tournaments, Teams, Venues, Chat, Notifications, Analytics)
 * - Inter-module communication via EventBus (pub/sub pattern)
 * - Clean Architecture layers: API → Domain → Data → Events
 * - Future-ready for microservices extraction via Strangler Fig pattern
 */
const swaggerDescription = [
  "**Modular Monolith Backend for the Sportification Platform**",
  "",
  "## Architecture Overview",
  "Built using **Clean Architecture** and **Domain-Driven Design (DDD)** principles.",
  "Each module is a self-contained bounded context, ready for future microservices extraction.",
  "",
  "## Key Features",
  "- 🔐 **Authentication & Authorization** · JWT access + refresh tokens with optional MFA",
  "- 📢 **Event-Driven Architecture** · Pub/Sub communication via EventBus (zero direct module coupling)",
  "- ⚡ **Real-Time Communication** · Socket.IO for match updates, chat, and notifications",
  "- 📊 **Analytics & AI** · Built-in observability, performance metrics, and ML-assisted recommendations",
  "- 🛡️ **Security** · Rate limiting, API keys, audit logs, and IP restrictions",
  "- 🏟️ **Core Features** · Matches, Tournaments, Teams, Venues, Bookings, Chat",
  "",
  "## Modules",
  "- **IAM** (Authentication) - No dependencies",
  "- **Users** (Profiles) - Depends on: IAM",
  "- **Matches** - Depends on: Users, Venues",
  "- **Tournaments** - Depends on: Matches, Users",
  "- **Teams** - Depends on: Users",
  "- **Venues** (incl. Bookings) - No dependencies",
  "- **Chat** - Depends on: Users, Matches, Tournaments, Teams",
  "- **Notifications** - Cross-cutting (subscribes to all events)",
  "- **Analytics** - Cross-cutting (subscribes to all events)",
  "",
  "## Usage Guidelines",
  "- **Authentication**: Include `Authorization: Bearer <access_token>` on protected endpoints",
  "- **Rate Limits**:",
  "  - General: 100 req / 15 min",
  "  - Auth endpoints: 20 req / 15 min",
  "  - File uploads: 10 req / 15 min",
  "- **Pagination**: Default page size: 10, Max: 100",
  "- **Response Envelope**:",
  "```json",
  "{",
  '  "success": true,',
  '  "message": "Operation completed successfully",',
  '  "data": {},',
  '  "errors": [],',
  '  "meta": {',
  '    "pagination": {',
  '      "page": 1,',
  '      "limit": 10,',
  '      "total": 100,',
  '      "pages": 10',
  "    }",
  "  }",
  "}",
  "```",
  "",
  "## Status Codes",
  "- **200** OK - Success (GET, PATCH)",
  "- **201** Created - Resource created (POST)",
  "- **204** No Content - Success, no response body (DELETE)",
  "- **400** Bad Request - Validation error",
  "- **401** Unauthorized - Authentication required/failed",
  "- **403** Forbidden - Insufficient permissions",
  "- **404** Not Found - Resource doesn't exist",
  "- **409** Conflict - Business rule violation",
  "- **429** Too Many Requests - Rate limit exceeded",
  "- **500** Internal Server Error - Unhandled server error",
  "- **503** Service Unavailable - External service down",
  "",
  "## Event-Driven Communication",
  "Modules communicate via EventBus using the pattern: `{module}.{entity}.{action}`",
  "Example events: `iam.user.registered`, `matches.match.created`, `users.friend.added`",
].join("\n");

const swaggerDefinition: SwaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Sportification API",
    version: "1.0.0",
    description: swaggerDescription,
    contact: {
      name: "Sportification Backend Team",
      email: "support@sportification.app",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "/",
      description: "Current server (relative URL - works with any environment)",
    },
    {
      url: "http://localhost:3000",
      description: "Local development (HTTP)",
    },
    {
      url: "https://api.sportification.app",
      description: "Production (HTTPS)",
    },
  ],
  tags: [
    {name: "System", description: "Health checks and service metadata"},
    {name: "Authentication", description: "IAM and session management"},
    {name: "MFA", description: "Two-factor authentication management"},
    {name: "OAuth", description: "Social login with Google, Facebook, GitHub"},
    {name: "Users", description: "Profiles, preferences, relationships"},
    {name: "Matches", description: "Match lifecycle, roster, and status"},
    {name: "Tournaments", description: "Bracket management and scheduling"},
    {name: "Teams", description: "Team creation and membership"},
    {name: "Venues", description: "Venue directory and availability"},
    {name: "Chat", description: "Real-time messaging and rooms"},
    {name: "Notifications", description: "Delivery rules and history"},
    {name: "Analytics", description: "Reports, stats, and insights"},
    {name: "Security", description: "Audit logs and API key governance"},
    {name: "Monitoring", description: "Metrics and performance monitoring"},
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token issued by the IAM module",
      },
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "Service-to-service authentication token",
      },
    },
    schemas: {
      // ==================== Common Response Schemas ====================
      SuccessResponse: {
        type: "object",
        properties: {
          success: {type: "boolean", example: true},
          message: {
            type: "string",
            example: "Operation completed successfully",
          },
          data: {type: "object", description: "Payload varies per endpoint"},
          errors: {type: "array", items: {type: "string"}, example: []},
          meta: {
            type: "object",
            properties: {
              pagination: {
                type: "object",
                properties: {
                  page: {type: "integer", example: 1},
                  limit: {type: "integer", example: 20},
                  total: {type: "integer", example: 100},
                  pages: {type: "integer", example: 5},
                },
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: {type: "boolean", example: false},
          message: {type: "string", example: "Bad request"},
          data: {type: "object", nullable: true, example: null},
          errors: {
            type: "array",
            items: {type: "string"},
            example: ["Invalid payload", "Missing field: sport"],
          },
          meta: {type: "object", example: {}},
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            example: 1,
            description: "Current page number",
          },
          limit: {type: "integer", example: 20, description: "Items per page"},
          total: {
            type: "integer",
            example: 100,
            description: "Total number of items",
          },
          pages: {
            type: "integer",
            example: 5,
            description: "Total number of pages",
          },
        },
      },

      // ==================== User Schemas ====================
      User: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          email: {type: "string", format: "email", example: "user@example.com"},
          username: {type: "string", example: "johndoe"},
          profile: {
            type: "object",
            properties: {
              firstName: {type: "string", example: "John"},
              lastName: {type: "string", example: "Doe"},
              avatar: {
                type: "string",
                format: "uri",
                example: "https://example.com/avatar.jpg",
              },
              bio: {type: "string", example: "Passionate sports enthusiast"},
              location: {type: "string", example: "New York, NY"},
              dateOfBirth: {
                type: "string",
                format: "date",
                example: "1990-01-15",
              },
            },
          },
          sports: {
            type: "array",
            items: {type: "string"},
            example: ["football", "basketball", "tennis"],
          },
          role: {
            type: "string",
            enum: ["user", "admin", "moderator"],
            example: "user",
          },
          isEmailVerified: {type: "boolean", example: true},
          isActive: {type: "boolean", example: true},
          friends: {
            type: "array",
            items: {type: "string"},
            example: ["507f1f77bcf86cd799439012"],
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-01-01T00:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T00:00:00Z",
          },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          firstName: {type: "string", example: "John"},
          lastName: {type: "string", example: "Doe"},
          avatar: {
            type: "string",
            format: "uri",
            example: "https://example.com/avatar.jpg",
          },
          bio: {type: "string", example: "Passionate sports enthusiast"},
          location: {type: "string", example: "New York, NY"},
          dateOfBirth: {type: "string", format: "date", example: "1990-01-15"},
        },
      },

      // ==================== Authentication Schemas ====================
      AuthTokens: {
        type: "object",
        properties: {
          accessToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          refreshToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          expiresIn: {
            type: "string",
            example: "7d",
            description: "Access token expiration",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {type: "string", format: "email", example: "user@example.com"},
          password: {
            type: "string",
            format: "password",
            example: "SecurePassword123!",
          },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password", "username"],
        properties: {
          email: {type: "string", format: "email", example: "user@example.com"},
          password: {
            type: "string",
            format: "password",
            example: "SecurePassword123!",
          },
          username: {type: "string", example: "johndoe"},
          profile: {$ref: "#/components/schemas/UserProfile"},
        },
      },

      // ==================== Match Schemas ====================
      Match: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          sport: {type: "string", example: "football"},
          schedule: {
            type: "object",
            properties: {
              date: {type: "string", format: "date", example: "2025-10-20"},
              time: {type: "string", example: "18:00"},
            },
          },
          venue: {type: "string", example: "507f1f77bcf86cd799439012"},
          maxParticipants: {type: "integer", example: 10},
          participants: {
            type: "array",
            items: {type: "string"},
            example: ["507f1f77bcf86cd799439013"],
          },
          status: {
            type: "string",
            enum: ["upcoming", "ongoing", "completed", "cancelled"],
            example: "upcoming",
          },
          score: {
            type: "object",
            properties: {
              team1: {type: "integer", example: 2},
              team2: {type: "integer", example: 1},
            },
          },
          createdBy: {type: "string", example: "507f1f77bcf86cd799439013"},
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-01T00:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T00:00:00Z",
          },
        },
      },
      CreateMatchRequest: {
        type: "object",
        required: ["sport", "schedule"],
        properties: {
          sport: {type: "string", example: "football"},
          schedule: {
            type: "object",
            required: ["date", "time"],
            properties: {
              date: {type: "string", format: "date", example: "2025-10-20"},
              time: {type: "string", example: "18:00"},
            },
          },
          venue: {type: "string", example: "507f1f77bcf86cd799439012"},
          maxParticipants: {type: "integer", minimum: 2, example: 10},
          description: {type: "string", example: "Friendly football match"},
        },
      },

      // ==================== Tournament Schemas ====================
      Tournament: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          name: {type: "string", example: "Summer Championship 2025"},
          description: {
            type: "string",
            example: "Annual summer football championship",
          },
          sport: {type: "string", example: "football"},
          maxParticipants: {type: "integer", example: 16},
          participants: {
            type: "array",
            items: {type: "string"},
            example: ["507f1f77bcf86cd799439012"],
          },
          startDate: {
            type: "string",
            format: "date-time",
            example: "2025-06-15T10:00:00Z",
          },
          status: {
            type: "string",
            enum: ["upcoming", "ongoing", "completed", "cancelled"],
            example: "upcoming",
          },
          bracket: {
            type: "object",
            description: "Tournament bracket structure",
          },
          venue: {type: "string", example: "507f1f77bcf86cd799439013"},
          prizePool: {type: "number", example: 5000},
          createdBy: {type: "string", example: "507f1f77bcf86cd799439014"},
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-05-01T00:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T00:00:00Z",
          },
        },
      },
      CreateTournamentRequest: {
        type: "object",
        required: ["name", "sport", "maxParticipants", "startDate"],
        properties: {
          name: {type: "string", example: "Summer Championship 2025"},
          description: {
            type: "string",
            example: "Annual summer football championship",
          },
          sport: {type: "string", example: "football"},
          maxParticipants: {type: "integer", minimum: 2, example: 16},
          startDate: {
            type: "string",
            format: "date-time",
            example: "2025-06-15T10:00:00Z",
          },
          venue: {type: "string", example: "507f1f77bcf86cd799439013"},
          prizePool: {type: "number", example: 5000},
        },
      },

      // ==================== Team Schemas ====================
      Team: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          name: {type: "string", example: "Thunder Strikers"},
          description: {type: "string", example: "Competitive football team"},
          sport: {type: "string", example: "football"},
          captain: {type: "string", example: "507f1f77bcf86cd799439012"},
          members: {
            type: "array",
            items: {type: "string"},
            example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
          },
          maxMembers: {type: "integer", example: 20},
          isPrivate: {type: "boolean", example: false},
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-01-01T00:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T00:00:00Z",
          },
        },
      },
      CreateTeamRequest: {
        type: "object",
        required: ["name", "sport"],
        properties: {
          name: {type: "string", example: "Thunder Strikers"},
          description: {type: "string", example: "Competitive football team"},
          sport: {type: "string", example: "football"},
          maxMembers: {type: "integer", minimum: 2, example: 20},
          isPrivate: {type: "boolean", example: false},
        },
      },

      // ==================== Venue Schemas ====================
      Venue: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          name: {type: "string", example: "City Sports Complex"},
          description: {
            type: "string",
            example: "Modern indoor/outdoor sports facility",
          },
          location: {
            type: "object",
            properties: {
              type: {type: "string", enum: ["Point"], example: "Point"},
              coordinates: {
                type: "array",
                items: {type: "number"},
                example: [-73.935242, 40.73061],
              },
              address: {
                type: "string",
                example: "123 Main St, New York, NY 10001",
              },
            },
          },
          sports: {
            type: "array",
            items: {type: "string"},
            example: ["football", "basketball", "tennis"],
          },
          facilities: {
            type: "array",
            items: {type: "string"},
            example: ["parking", "lockers", "showers"],
          },
          pricing: {
            type: "object",
            properties: {
              hourly: {type: "number", example: 50},
              daily: {type: "number", example: 300},
            },
          },
          availability: {
            type: "object",
            properties: {
              monday: {
                type: "array",
                items: {type: "string"},
                example: ["09:00-21:00"],
              },
              tuesday: {
                type: "array",
                items: {type: "string"},
                example: ["09:00-21:00"],
              },
            },
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-01-01T00:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T00:00:00Z",
          },
        },
      },
      CreateVenueRequest: {
        type: "object",
        required: ["name", "location", "sports"],
        properties: {
          name: {type: "string", example: "City Sports Complex"},
          description: {
            type: "string",
            example: "Modern indoor/outdoor sports facility",
          },
          location: {
            type: "object",
            required: ["type", "coordinates"],
            properties: {
              type: {type: "string", enum: ["Point"], example: "Point"},
              coordinates: {
                type: "array",
                items: {type: "number"},
                example: [-73.935242, 40.73061],
              },
              address: {
                type: "string",
                example: "123 Main St, New York, NY 10001",
              },
            },
          },
          sports: {
            type: "array",
            items: {type: "string"},
            example: ["football", "basketball", "tennis"],
          },
          facilities: {
            type: "array",
            items: {type: "string"},
            example: ["parking", "lockers", "showers"],
          },
          pricing: {
            type: "object",
            properties: {
              hourly: {type: "number", example: 50},
              daily: {type: "number", example: 300},
            },
          },
        },
      },

      // ==================== Booking Schemas ====================
      Booking: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          venue: {type: "string", example: "507f1f77bcf86cd799439012"},
          user: {type: "string", example: "507f1f77bcf86cd799439013"},
          startTime: {
            type: "string",
            format: "date-time",
            example: "2025-10-20T14:00:00Z",
          },
          endTime: {
            type: "string",
            format: "date-time",
            example: "2025-10-20T16:00:00Z",
          },
          status: {
            type: "string",
            enum: [
              "pending",
              "confirmed",
              "checked-in",
              "completed",
              "cancelled",
              "no-show",
            ],
            example: "confirmed",
          },
          purpose: {type: "string", example: "Team practice"},
          notes: {type: "string", example: "Need extra equipment"},
          payment: {
            type: "object",
            properties: {
              amount: {type: "number", example: 100},
              status: {
                type: "string",
                enum: ["pending", "paid", "refunded"],
                example: "paid",
              },
              method: {
                type: "string",
                enum: ["cash", "card", "online"],
                example: "card",
              },
              transactionId: {type: "string", example: "txn_123456"},
            },
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-01T00:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T00:00:00Z",
          },
        },
      },
      CreateBookingRequest: {
        type: "object",
        required: ["venueId", "startTime", "endTime"],
        properties: {
          venueId: {type: "string", example: "507f1f77bcf86cd799439012"},
          startTime: {
            type: "string",
            format: "date-time",
            example: "2025-10-20T14:00:00Z",
          },
          endTime: {
            type: "string",
            format: "date-time",
            example: "2025-10-20T16:00:00Z",
          },
          purpose: {type: "string", example: "Team practice"},
          notes: {type: "string", example: "Need extra equipment"},
        },
      },

      // ==================== Chat Schemas ====================
      Chat: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          type: {type: "string", enum: ["direct", "group"], example: "direct"},
          name: {type: "string", example: "Team Chat", nullable: true},
          participants: {
            type: "array",
            items: {type: "string"},
            example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
          },
          lastMessage: {
            type: "object",
            properties: {
              content: {type: "string", example: "Hello team!"},
              sender: {type: "string", example: "507f1f77bcf86cd799439012"},
              timestamp: {
                type: "string",
                format: "date-time",
                example: "2025-10-15T12:00:00Z",
              },
            },
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-01T00:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T00:00:00Z",
          },
        },
      },
      Message: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          chat: {type: "string", example: "507f1f77bcf86cd799439012"},
          sender: {type: "string", example: "507f1f77bcf86cd799439013"},
          content: {type: "string", example: "Hello team!"},
          type: {
            type: "string",
            enum: ["text", "image", "file"],
            example: "text",
          },
          isRead: {type: "boolean", example: false},
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T12:00:00Z",
          },
        },
      },
      CreateChatRequest: {
        type: "object",
        required: ["participants"],
        properties: {
          participants: {
            type: "array",
            items: {type: "string"},
            example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
          },
          type: {type: "string", enum: ["direct", "group"], example: "direct"},
          name: {type: "string", example: "Team Chat"},
        },
      },
      SendMessageRequest: {
        type: "object",
        required: ["content"],
        properties: {
          content: {type: "string", example: "Hello team!"},
          type: {
            type: "string",
            enum: ["text", "image", "file"],
            default: "text",
          },
        },
      },

      // ==================== Notification Schemas ====================
      Notification: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          user: {type: "string", example: "507f1f77bcf86cd799439012"},
          type: {
            type: "string",
            enum: ["match", "tournament", "team", "friend", "system"],
            example: "match",
          },
          title: {type: "string", example: "New match invitation"},
          message: {
            type: "string",
            example: "You have been invited to join a football match",
          },
          data: {
            type: "object",
            description: "Additional notification data",
            example: {matchId: "507f1f77bcf86cd799439013"},
          },
          isRead: {type: "boolean", example: false},
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T12:00:00Z",
          },
        },
      },

      // ==================== API Key Schemas ====================
      ApiKey: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          name: {type: "string", example: "Production API Key", maxLength: 100},
          userId: {type: "string", example: "507f1f77bcf86cd799439012"},
          permissions: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "read:users",
                "write:users",
                "read:matches",
                "write:matches",
                "read:tournaments",
                "write:tournaments",
                "read:venues",
                "write:venues",
                "admin:all",
              ],
            },
            example: ["read:matches", "write:matches"],
          },
          isActive: {type: "boolean", example: true},
          lastUsedAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T12:00:00Z",
          },
          rateLimit: {
            type: "object",
            properties: {
              maxRequests: {
                type: "integer",
                minimum: 1,
                maximum: 10000,
                example: 1000,
              },
              windowMs: {
                type: "integer",
                minimum: 60000,
                maximum: 86400000,
                example: 3600000,
              },
            },
          },
          allowedIPs: {
            type: "array",
            items: {type: "string", format: "ipv4"},
            example: ["192.168.1.100", "10.0.0.50"],
          },
          expiresAt: {
            type: "string",
            format: "date-time",
            example: "2026-10-15T00:00:00Z",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-01-01T00:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T00:00:00Z",
          },
        },
      },
      CreateApiKeyRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: {type: "string", example: "Production API Key", maxLength: 100},
          permissions: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "read:users",
                "write:users",
                "read:matches",
                "write:matches",
                "read:tournaments",
                "write:tournaments",
                "read:venues",
                "write:venues",
                "admin:all",
              ],
            },
            example: ["read:matches", "write:matches"],
          },
          rateLimit: {
            type: "object",
            properties: {
              maxRequests: {type: "integer", example: 1000},
              windowMs: {type: "integer", example: 3600000},
            },
          },
          allowedIPs: {
            type: "array",
            items: {type: "string"},
            example: ["192.168.1.100"],
          },
          expiresAt: {
            type: "string",
            format: "date-time",
            example: "2026-10-15T00:00:00Z",
          },
        },
      },
      ApiKeyResponse: {
        type: "object",
        properties: {
          apiKey: {$ref: "#/components/schemas/ApiKey"},
          key: {
            type: "string",
            example:
              "sk_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            description: "Plain-text API key (shown only once at creation)",
          },
        },
      },

      // ==================== Audit Log Schemas ====================
      AuditLog: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          userId: {type: "string", example: "507f1f77bcf86cd799439012"},
          action: {
            type: "string",
            enum: [
              "login",
              "logout",
              "login_failed",
              "account_locked",
              "password_reset_requested",
              "password_reset_completed",
              "password_changed",
              "email_verified",
              "mfa_enabled",
              "mfa_disabled",
              "mfa_login_success",
              "mfa_login_failed",
              "mfa_backup_code_used",
              "oauth_login",
              "oauth_account_linked",
              "oauth_account_unlinked",
              "api_key_created",
              "api_key_used",
              "api_key_regenerated",
              "api_key_deleted",
              "api_key_rate_limited",
              "api_key_expired",
              "security_settings_updated",
              "ip_restriction_violation",
              "suspicious_activity",
              "data_export_requested",
              "account_deleted",
              "user_impersonated",
              "admin_action",
              "permission_granted",
              "permission_revoked",
            ],
            example: "login",
          },
          resource: {
            type: "string",
            enum: [
              "user",
              "auth",
              "mfa",
              "oauth",
              "api_key",
              "security",
              "admin",
              "match",
              "tournament",
              "venue",
              "notification",
              "chat",
            ],
            example: "auth",
          },
          resourceId: {type: "string", example: "507f1f77bcf86cd799439013"},
          details: {
            type: "object",
            description: "Additional details about the action",
            example: {browser: "Chrome", os: "Windows"},
          },
          ipAddress: {type: "string", format: "ipv4", example: "192.168.1.100"},
          userAgent: {
            type: "string",
            example:
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          status: {
            type: "string",
            enum: ["success", "failure", "warning"],
            example: "success",
          },
          severity: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            example: "low",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T12:00:00Z",
          },
          sessionId: {type: "string", example: "sess_1234567890abcdef"},
          apiKeyId: {type: "string", example: "507f1f77bcf86cd799439014"},
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T12:00:00Z",
          },
        },
      },

      // ==================== Analytics Schemas ====================
      UserActivity: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          userId: {type: "string", example: "507f1f77bcf86cd799439012"},
          sessionId: {type: "string", example: "sess_1234567890abcdef"},
          activity: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: [
                  "page_view",
                  "match_join",
                  "tournament_create",
                  "message_send",
                  "profile_update",
                  "search",
                  "api_call",
                ],
                example: "match_join",
              },
              resource: {type: "string", example: "match"},
              resourceId: {type: "string", example: "507f1f77bcf86cd799439013"},
              metadata: {
                type: "object",
                description: "Additional activity metadata",
              },
            },
          },
          duration: {
            type: "integer",
            description: "Activity duration in milliseconds",
            example: 5000,
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T12:00:00Z",
          },
          location: {
            type: "object",
            properties: {
              country: {type: "string", example: "United States"},
              region: {type: "string", example: "California"},
              city: {type: "string", example: "San Francisco"},
              coordinates: {
                type: "array",
                items: {type: "number"},
                example: [-122.4194, 37.7749],
              },
            },
          },
          device: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["desktop", "mobile", "tablet"],
                example: "desktop",
              },
              os: {type: "string", example: "Windows"},
              browser: {type: "string", example: "Chrome"},
              userAgent: {type: "string", example: "Mozilla/5.0..."},
            },
          },
          performance: {
            type: "object",
            properties: {
              loadTime: {type: "integer", example: 1200},
              responseTime: {type: "integer", example: 300},
              errors: {type: "array", items: {type: "string"}, example: []},
            },
          },
        },
      },
      PerformanceMetrics: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          endpoint: {type: "string", example: "/api/v1/matches"},
          method: {
            type: "string",
            enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            example: "GET",
          },
          responseTime: {
            type: "integer",
            description: "Response time in milliseconds",
            example: 150,
          },
          statusCode: {type: "integer", example: 200},
          requestSize: {
            type: "integer",
            description: "Request size in bytes",
            example: 1024,
          },
          responseSize: {
            type: "integer",
            description: "Response size in bytes",
            example: 4096,
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T12:00:00Z",
          },
          userId: {type: "string", example: "507f1f77bcf86cd799439012"},
          requestErrors: {type: "array", items: {type: "string"}, example: []},
          dbQueries: {
            type: "object",
            properties: {
              count: {type: "integer", example: 3},
              totalTime: {type: "integer", example: 50},
              slowQueries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    query: {type: "string", example: "Match.find({})"},
                    time: {type: "integer", example: 25},
                  },
                },
              },
            },
          },
          correlationId: {type: "string", example: "req_1234567890abcdef"},
          cacheHits: {type: "integer", example: 5},
          cacheMisses: {type: "integer", example: 1},
        },
      },
      SystemHealth: {
        type: "object",
        properties: {
          _id: {type: "string", example: "507f1f77bcf86cd799439011"},
          component: {
            type: "string",
            enum: ["api", "database", "cache", "external_service", "queue"],
            example: "api",
          },
          status: {
            type: "string",
            enum: ["healthy", "degraded", "down"],
            example: "healthy",
          },
          responseTime: {type: "integer", example: 50},
          errorRate: {type: "number", format: "float", example: 0.01},
          throughput: {
            type: "integer",
            description: "Requests per second",
            example: 100,
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2025-10-15T12:00:00Z",
          },
          details: {
            type: "object",
            description: "Component-specific health details",
          },
          alerts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                level: {
                  type: "string",
                  enum: ["info", "warning", "error", "critical"],
                  example: "warning",
                },
                message: {
                  type: "string",
                  example: "High memory usage detected",
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                  example: "2025-10-15T12:00:00Z",
                },
              },
            },
          },
        },
      },

      // ==================== Update Schemas (Partial) ====================
      UpdateUserRequest: {
        type: "object",
        properties: {
          username: {type: "string", example: "johndoe_updated"},
          profile: {$ref: "#/components/schemas/UserProfile"},
          sports: {
            type: "array",
            items: {type: "string"},
            example: ["football", "basketball"],
          },
        },
      },
      UpdateMatchRequest: {
        type: "object",
        properties: {
          schedule: {
            type: "object",
            properties: {
              date: {type: "string", format: "date", example: "2025-10-25"},
              time: {type: "string", example: "19:00"},
            },
          },
          maxParticipants: {type: "integer", example: 12},
          status: {
            type: "string",
            enum: ["upcoming", "ongoing", "completed", "cancelled"],
            example: "ongoing",
          },
          score: {
            type: "object",
            properties: {
              team1: {type: "integer", example: 3},
              team2: {type: "integer", example: 2},
            },
          },
        },
      },
      UpdateTournamentRequest: {
        type: "object",
        properties: {
          name: {type: "string", example: "Summer Championship 2025 - Updated"},
          description: {
            type: "string",
            example: "Updated tournament description",
          },
          status: {
            type: "string",
            enum: ["upcoming", "ongoing", "completed", "cancelled"],
            example: "ongoing",
          },
          prizePool: {type: "number", example: 7500},
        },
      },
      UpdateBookingRequest: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: [
              "pending",
              "confirmed",
              "checked-in",
              "completed",
              "cancelled",
              "no-show",
            ],
            example: "confirmed",
          },
          notes: {type: "string", example: "Updated notes"},
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Authentication required",
        content: {
          "application/json": {
            schema: {$ref: "#/components/schemas/ErrorResponse"},
            example: {
              success: false,
              message: "Authentication required",
              data: null,
              errors: ["Missing or invalid authorization token"],
              meta: {},
            },
          },
        },
      },
      Forbidden: {
        description: "Access forbidden",
        content: {
          "application/json": {
            schema: {$ref: "#/components/schemas/ErrorResponse"},
            example: {
              success: false,
              message: "Access forbidden",
              data: null,
              errors: ["Insufficient permissions"],
              meta: {},
            },
          },
        },
      },
      BadRequest: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: {$ref: "#/components/schemas/ErrorResponse"},
            example: {
              success: false,
              message: "Bad request",
              data: null,
              errors: ["Invalid request data"],
              meta: {},
            },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: {$ref: "#/components/schemas/ErrorResponse"},
            example: {
              success: false,
              message: "Resource not found",
              data: null,
              errors: ["The requested resource was not found"],
              meta: {},
            },
          },
        },
      },
      Conflict: {
        description: "Conflict - Resource already exists or state mismatch",
        content: {
          "application/json": {
            schema: {$ref: "#/components/schemas/ErrorResponse"},
            example: {
              success: false,
              message: "Conflict occurred",
              data: null,
              errors: ["Resource already exists"],
              meta: {},
            },
          },
        },
      },
      ValidationError: {
        description: "Validation error",
        content: {
          "application/json": {
            schema: {$ref: "#/components/schemas/ErrorResponse"},
            example: {
              success: false,
              message: "Validation failed",
              data: null,
              errors: ["Field is required", "Invalid email format"],
              meta: {},
            },
          },
        },
      },
      InternalServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {$ref: "#/components/schemas/ErrorResponse"},
            example: {
              success: false,
              message: "Internal server error",
              data: null,
              errors: ["An unexpected error occurred"],
              meta: {},
            },
          },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [
    "./src/app.ts", // Main application routes
    "./src/modules/**/api/routes/*.ts", // Module route definitions
    "./src/modules/**/api/controllers/*.ts", // Controller implementations with JSDoc
    "./src/shared/routes/*.ts", // Shared/common routes
    "./src/shared/middleware/*.ts", // Middleware documentation
  ],
};

/**
 * Generated OpenAPI specification
 * Use this in your Express app with swagger-ui-express:
 *
 * @example
 * import swaggerUi from 'swagger-ui-express';
 * import { specs } from './docs/swagger';
 *
 * app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(specs));
 */
export const specs = swaggerJSDoc(options);

/**
 * Default export for convenience
 */
export default specs;
