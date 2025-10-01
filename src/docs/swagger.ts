import swaggerJSDoc, { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Sports Companion API',
    version: '1.0.0',
    description: `
      A comprehensive backend API for the Sports Companion Application.
      
      ## Features
      - **JWT Authentication** - Secure token-based authentication with MFA support
      - **OAuth 2.0 / SSO** - Google, GitHub, and Facebook integration
      - **API Key Authentication** - Service-to-service authentication
      - **Multi-Factor Authentication** - TOTP-based 2FA with backup codes
      - **Real-time Socket.IO** - Live messaging and updates
      - **Tournament Management** - Advanced bracket system
      - **Match Management** - Complete match lifecycle
      - **User Profiles** - Social features and achievements
      - **Advanced Analytics** - Comprehensive insights and business intelligence
      - **Performance Monitoring** - Real-time APM and system health tracking
      - **Security & Audit Logging** - Comprehensive security monitoring
      - **Predictive Analytics** - AI-driven insights and recommendations
      - **Comprehensive Logging** - Security and performance monitoring
      
      ## Authentication
      Most endpoints require authentication via JWT token in the Authorization header:
      \`Authorization: Bearer <your_jwt_token>\`
      
      ## Rate Limiting
      API requests are rate limited to prevent abuse. Current limits:
      - 100 requests per 15 minutes per IP
      - Additional limits may apply to specific endpoints
      
      ## Error Handling
      All API responses follow a consistent format:
      \`\`\`json
      {
        "success": boolean,
        "message": "string",
        "data": object | null,
        "errors": string[],
        "meta": object
      }
      \`\`\`
    `.trim(),
    contact: {
      name: 'Sports Companion Team',
      email: 'support@sportification.app',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://api.sportification.app/v1',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'System',
      description: 'System health and API information endpoints',
    },
    {
      name: 'Authentication',
      description: 'User authentication and profile management',
    },
    {
      name: 'Users',
      description: 'User management and social features',
    },
    {
      name: 'Matches',
      description: 'Match creation, management, and participation',
    },
    {
      name: 'Tournaments',
      description: 'Tournament management and bracket system',
    },
    {
      name: 'Venues',
      description: 'Venue management and location services',
    },
    {
      name: 'Notifications',
      description: 'User notifications and preferences',
    },
    {
      name: 'API Keys',
      description: 'API key management for service-to-service authentication',
    },
    {
      name: 'Security',
      description: 'Security dashboard, audit logs, and monitoring',
    },
    {
      name: 'Analytics',
      description: 'Comprehensive analytics, performance metrics, and business intelligence',
    },
    {
      name: 'Insights',
      description: 'Advanced insights, predictions, and actionable recommendations',
    },
    {
      name: 'AI & Machine Learning',
      description:
        'AI-powered features including predictions, recommendations, and intelligent analysis',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token obtained from login endpoint',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully',
          },
          data: {
            type: 'object',
            description: 'Response data (varies by endpoint)',
          },
          errors: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: [],
          },
          meta: {
            type: 'object',
            properties: {
              pagination: {
                type: 'object',
                properties: {
                  page: {
                    type: 'integer',
                    example: 1,
                  },
                  limit: {
                    type: 'integer',
                    example: 20,
                  },
                  total: {
                    type: 'integer',
                    example: 100,
                  },
                  pages: {
                    type: 'integer',
                    example: 5,
                  },
                },
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'An error occurred',
          },
          data: {
            type: 'object',
            nullable: true,
            example: null,
          },
          errors: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['Validation error', 'Field is required'],
          },
          meta: {
            type: 'object',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '64f7b1c2d4e5f6789012345',
          },
          username: {
            type: 'string',
            example: 'johndoe',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com',
          },
          firstName: {
            type: 'string',
            example: 'John',
          },
          lastName: {
            type: 'string',
            example: 'Doe',
          },
          bio: {
            type: 'string',
            example: 'Tennis enthusiast and weekend warrior',
          },
          location: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
                example: 'New York',
              },
              country: {
                type: 'string',
                example: 'USA',
              },
            },
          },
          preferences: {
            type: 'object',
            properties: {
              sports: {
                type: 'array',
                items: {
                  type: 'string',
                },
                example: ['tennis', 'football'],
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
      },
      Match: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '64f7b1c2d4e5f6789012346',
          },
          type: {
            type: 'string',
            enum: ['public', 'private', 'tournament'],
            example: 'public',
          },
          sport: {
            type: 'string',
            example: 'football',
          },
          status: {
            type: 'string',
            enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
            example: 'scheduled',
          },
          creator: {
            $ref: '#/components/schemas/User',
          },
          participants: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/User',
            },
          },
          maxPlayers: {
            type: 'number',
            example: 10,
          },
          schedule: {
            type: 'object',
            properties: {
              date: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-15T18:00:00.000Z',
              },
              time: {
                type: 'string',
                example: '18:00',
              },
              timezone: {
                type: 'string',
                example: 'UTC',
              },
            },
          },
          venue: {
            $ref: '#/components/schemas/Venue',
          },
          description: {
            type: 'string',
            example: 'Friendly football match',
          },
          score: {
            type: 'object',
            properties: {
              team1: {
                type: 'number',
                example: 2,
              },
              team2: {
                type: 'number',
                example: 1,
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
      },
      Tournament: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '64f7b1c2d4e5f6789012347',
          },
          name: {
            type: 'string',
            example: 'Summer Championship 2024',
          },
          sport: {
            type: 'string',
            example: 'tennis',
          },
          type: {
            type: 'string',
            enum: ['single_elimination', 'double_elimination', 'round_robin', 'swiss'],
            example: 'single_elimination',
          },
          status: {
            type: 'string',
            enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
            example: 'upcoming',
          },
          creator: {
            $ref: '#/components/schemas/User',
          },
          participants: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/User',
            },
          },
          maxParticipants: {
            type: 'number',
            example: 32,
          },
          entryFee: {
            type: 'number',
            example: 25.0,
          },
          description: {
            type: 'string',
            example: 'Annual summer tennis championship',
          },
          schedule: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                format: 'date-time',
                example: '2024-06-01T09:00:00.000Z',
              },
              endDate: {
                type: 'string',
                format: 'date-time',
                example: '2024-06-07T18:00:00.000Z',
              },
            },
          },
          venue: {
            $ref: '#/components/schemas/Venue',
          },
          bracket: {
            type: 'object',
            description: 'Tournament bracket structure',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
      },
      Venue: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '64f7b1c2d4e5f6789012348',
          },
          name: {
            type: 'string',
            example: 'Central Park Tennis Courts',
          },
          description: {
            type: 'string',
            example: 'Premium outdoor tennis facility',
          },
          location: {
            type: 'object',
            properties: {
              lat: {
                type: 'number',
                example: 40.7829,
              },
              lng: {
                type: 'number',
                example: -73.9654,
              },
              address: {
                type: 'string',
                example: 'Central Park, New York, NY',
              },
            },
          },
          surfaceType: {
            type: 'string',
            example: 'hard_court',
          },
          amenities: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['parking', 'restrooms', 'lighting', 'water_fountain'],
          },
          capacity: {
            type: 'number',
            example: 50,
          },
          pricePerHour: {
            type: 'number',
            example: 25.0,
          },
          creator: {
            $ref: '#/components/schemas/User',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '64f7b1c2d4e5f6789012349',
          },
          recipient: {
            $ref: '#/components/schemas/User',
          },
          type: {
            type: 'string',
            enum: ['match_invite', 'tournament_update', 'friend_request', 'achievement', 'system'],
            example: 'match_invite',
          },
          title: {
            type: 'string',
            example: 'Match Invitation',
          },
          message: {
            type: 'string',
            example: "You've been invited to join a football match",
          },
          data: {
            type: 'object',
            description: 'Additional notification data',
          },
          read: {
            type: 'boolean',
            example: false,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Authentication required',
              data: null,
              errors: ['Missing or invalid authorization token'],
              meta: {},
            },
          },
        },
      },
      Forbidden: {
        description: 'Access forbidden',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Access forbidden',
              data: null,
              errors: ['Insufficient permissions'],
              meta: {},
            },
          },
        },
      },
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Bad request',
              data: null,
              errors: ['Invalid request data'],
              meta: {},
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Resource not found',
              data: null,
              errors: ['The requested resource was not found'],
              meta: {},
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Validation failed',
              data: null,
              errors: ['Field is required', 'Invalid email format'],
              meta: {},
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Internal server error',
              data: null,
              errors: ['An unexpected error occurred'],
              meta: {},
            },
          },
        },
      },
      Conflict: {
        description: 'Conflict - Resource already exists or operation conflicts with current state',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Conflict occurred',
              data: null,
              errors: ['Resource already exists', 'Operation conflicts with current state'],
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
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/app.ts'],
};

export const specs = swaggerJSDoc(options);
export default specs;
