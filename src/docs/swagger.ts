import swaggerJSDoc, { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Sportification API',
    version: '1.0.0',
    description: `
      Modular monolith backend for the Sportification platform.

      ## Highlights
      - **Authentication** · JWT access + refresh tokens with optional MFA
      - **Event-Driven Modules** · Matches, Tournaments, Teams, Chat, Notifications
      - **Real-Time** · Socket.IO for match feeds, chat, and system alerts
      - **Analytics & Insights** · Built-in observability and AI-assisted recommendations

      ## Usage
      - Include \`Authorization: Bearer <access_token>\` on protected endpoints.
      - Rate limits: 100 req / 15 min (general) unless overridden per route.
      - Response envelope:
        \`\`\`json
        {
          "success": true,
          "message": "string",
          "data": {},
          "errors": [],
          "meta": {}
        }
        \`\`\`
    `.trim(),
    contact: {
      name: 'Sportification Backend Team',
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
      description: 'Local development',
    },
    {
      url: 'https://api.sportification.app/api/v1',
      description: 'Production',
    },
  ],
  tags: [
    { name: 'System', description: 'Health checks and service metadata' },
    { name: 'Authentication', description: 'IAM and session management' },
    { name: 'Users', description: 'Profiles, preferences, relationships' },
    { name: 'Matches', description: 'Match lifecycle, roster, and status' },
    { name: 'Tournaments', description: 'Bracket management and scheduling' },
    { name: 'Teams', description: 'Team creation and membership' },
    { name: 'Venues', description: 'Venue directory and availability' },
    { name: 'Chat', description: 'Real-time messaging and rooms' },
    { name: 'Notifications', description: 'Delivery rules and history' },
    { name: 'Analytics', description: 'Reports, stats, and insights' },
    { name: 'Security', description: 'Audit logs and API key governance' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token issued by the IAM module',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Service-to-service authentication token',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object', description: 'Payload varies per endpoint' },
          errors: { type: 'array', items: { type: 'string' }, example: [] },
          meta: {
            type: 'object',
            properties: {
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer', example: 1 },
                  limit: { type: 'integer', example: 20 },
                  total: { type: 'integer', example: 100 },
                  pages: { type: 'integer', example: 5 },
                },
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Bad request' },
          data: { type: 'object', nullable: true, example: null },
          errors: {
            type: 'array',
            items: { type: 'string' },
            example: ['Invalid payload', 'Missing field: sport'],
          },
          meta: { type: 'object', example: {} },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
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
            schema: { $ref: '#/components/schemas/ErrorResponse' },
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
            schema: { $ref: '#/components/schemas/ErrorResponse' },
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
            schema: { $ref: '#/components/schemas/ErrorResponse' },
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
      Conflict: {
        description: 'Conflict - Resource already exists or state mismatch',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Conflict occurred',
              data: null,
              errors: ['Resource already exists'],
              meta: {},
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
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
            schema: { $ref: '#/components/schemas/ErrorResponse' },
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
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/app.ts',
    './src/modules/**/api/routes/*.ts',
    './src/modules/**/api/controllers/*.ts',
    './src/shared/routes/*.ts',
  ],
};

export const specs = swaggerJSDoc(options);
export default specs;
