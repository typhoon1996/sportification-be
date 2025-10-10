import { Server } from 'http';

import RedisStore from 'connect-redis';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';

import config from './shared/config';
import Database from './shared/config/database';
import passport from './shared/config/passport';
import { closeRateLimitStore } from './shared/config/rateLimitStore';
import { createRedisClient, RedisClient } from './shared/config/redis';
import swaggerSpecs from './docs/swagger';

// Middleware

import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler';
import {
  advancedRequestLogger,
  securityLogger,
  analyticsLogger,
  errorTracker,
} from './shared/middleware/logging';

// Module imports
import { iamModule } from './modules/iam';
import { usersModule } from './modules/users';
import { matchesModule } from './modules/matches';
import { tournamentsModule } from './modules/tournaments';
import { teamsModule } from './modules/teams';
import { chatModule } from './modules/chat';
import { notificationsModule } from './modules/notifications';
import { venuesModule } from './modules/venues';
import { analyticsModule } from './modules/analytics';
import { aiModule } from './modules/ai';

// Import routes from modules
import apiKeyRoutes from './modules/iam/api/routes/apiKeys';
import securityRoutes from './modules/iam/api/routes/security';
import adminRoutes from './modules/analytics/api/routes/admin';

// Performance monitoring
import {
  performanceMonitoring,
  requestCorrelation,
  setupAPM,
} from './shared/middleware/performance';
import {
  corsOptions,
  helmetConfig,
  compressionMiddleware,
  sanitizeRequest,
  preventParameterPollution,
  securityHeaders,
  requestLogger,
  generalLimiter,
} from './shared/middleware/security';
import { User } from './modules/users/domain/models/User';
// Legacy routes imports removed - now using modules
import { JWTUtil } from './shared/utils/jwt';
import logger from './shared/utils/logger';

class App {
  public app: express.Application;
  public server: Server;
  public io: SocketIOServer;
  private readonly sessionRedisClient?: RedisClient;

  constructor() {
    this.app = express();
    this.server = new Server(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: corsOptions,
      transports: ['websocket', 'polling'],
    });

    if (config.app.env !== 'test') {
      this.sessionRedisClient = createRedisClient({
        keyPrefix: 'sportification:',
        lazyConnect: false,
      });
    }

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSocketIO();
  }

  private initializeMiddleware(): void {
    // Trust proxy for rate limiting and IP detection
    this.app.set('trust proxy', 1);

    // Request correlation for distributed tracing
    this.app.use(requestCorrelation);

    // Performance monitoring
    this.app.use(performanceMonitoring);

    // Security middleware
    this.app.use(helmetConfig);
    this.app.use(cors(corsOptions));
    this.app.use(compressionMiddleware);
    this.app.use(preventParameterPollution);
    this.app.use(sanitizeRequest);
    this.app.use(securityHeaders);

    // Request logging
    if (config.app.env !== 'test') {
      this.app.use(advancedRequestLogger);
      this.app.use(securityLogger);
      this.app.use(analyticsLogger);
    } else {
      this.app.use(requestLogger); // Simple logging for tests
    }

    // Rate limiting
    this.app.use(generalLimiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Session middleware for OAuth
    const sessionOptions: session.SessionOptions = {
      secret: config.jwt.secret,
      resave: false,
      saveUninitialized: false,
      name: config.session.cookieName,
      cookie: {
        secure: config.app.env === 'production',
        httpOnly: true,
        maxAge: config.session.ttl * 1000,
        sameSite: 'lax',
      },
    };

    if (this.sessionRedisClient) {
      try {
        sessionOptions.store = new RedisStore({
          client: this.sessionRedisClient,
          prefix: config.session.prefix,
          ttl: config.session.ttl,
          disableTouch: false,
        });
      } catch (error) {
        logger.error('Failed to initialize Redis session store:', error);
      }
    } else if (config.app.env !== 'test') {
      logger.warn('Redis session store not initialized; falling back to in-memory sessions');
    }

    this.app.use(session(sessionOptions));

    // Passport middleware
    this.app.use(passport.initialize());
    this.app.use(passport.session());

    // Health check endpoint
    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     description: Check API server health and status
     *     tags: [System]
     *     responses:
     *       200:
     *         description: Server is healthy
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: OK
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *                   example: 2024-01-15T10:30:00.000Z
     *                 environment:
     *                   type: string
     *                   example: development
     *                 version:
     *                   type: string
     *                   example: 1.0.0
     *                 uptime:
     *                   type: number
     *                   example: 3600.5
     *                 memory:
     *                   type: object
     *                   properties:
     *                     rss:
     *                       type: number
     *                     heapTotal:
     *                       type: number
     *                     heapUsed:
     *                       type: number
     *                     external:
     *                       type: number
     *                 nodejs:
     *                   type: string
     *                   example: v20.19.5
     */
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        architecture: 'modular-monolith',
        timestamp: new Date().toISOString(),
        environment: config.app.env,
        version: config.app.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodejs: process.version,
        modules: [
          'iam',
          'users',
          'matches',
          'tournaments',
          'teams',
          'chat',
          'notifications',
          'venues',
          'analytics',
          'ai',
        ],
      });
    });

    // API info endpoint
    /**
     * @swagger
     * /api/v1:
     *   get:
     *     summary: API information endpoint
     *     description: Get basic information about the API
     *     tags: [System]
     *     responses:
     *       200:
     *         description: API information retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 name:
     *                   type: string
     *                   example: Sports Companion API
     *                 version:
     *                   type: string
     *                   example: 1.0.0
     *                 description:
     *                   type: string
     *                   example: Sports Companion API - Connecting sports enthusiasts worldwide
     *                 documentation:
     *                   type: string
     *                   example: /api/v1/docs
     *                 status:
     *                   type: string
     *                   example: active
     *                 features:
     *                   type: array
     *                   items:
     *                     type: string
     *                   example: ["JWT Authentication", "Real-time Socket.IO", "Tournament Brackets"]
     */
    this.app.get('/api/v1', (req, res) => {
      res.status(200).json({
        name: config.app.name,
        version: config.app.version,
        description: 'Sports Companion API - Connecting sports enthusiasts worldwide',
        documentation: '/api/v1/docs',
        status: 'active',
        features: [
          'JWT Authentication',
          'Real-time Socket.IO',
          'Tournament Brackets',
          'Match Management',
          'User Profiles',
          'Comprehensive Logging',
          'Security Middleware',
        ],
      });
    });

    // Swagger Documentation
    this.app.use(
      '/api/v1/docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpecs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Sports Companion API Documentation',
      })
    );

    // OpenAPI JSON spec endpoint
    this.app.get('/api/v1/openapi.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.json(swaggerSpecs);
    });

    // Redirect /docs to /api/v1/docs for convenience
    this.app.get('/docs', (req, res) => {
      res.redirect('/api/v1/docs');
    });
  }

  private initializeRoutes(): void {
    const apiPrefix = config.app.apiPrefix;

    // Modular Monolith - Register module routes
    const modules = [
      iamModule,
      usersModule,
      matchesModule,
      tournamentsModule,
      teamsModule,
      chatModule,
      notificationsModule,
      venuesModule,
      analyticsModule,
      aiModule,
    ];

    modules.forEach((module) => {
      this.app.use(module.getBasePath(), module.getRouter());
      logger.info(`✓ Registered module: ${module.getName()} at ${module.getBasePath()}`);
    });

    // Legacy routes (keeping temporarily)
    // API Key routes
    this.app.use(`${apiPrefix}/api-keys`, apiKeyRoutes);

    // Security routes
    this.app.use(`${apiPrefix}/security`, securityRoutes);

    // Admin routes (includes admin management)
    this.app.use(`${apiPrefix}/admin`, adminRoutes);
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Enhanced error tracker
    this.app.use(errorTracker);

    // Global error handler
    this.app.use(errorHandler);
  }

  private initializeSocketIO(): void {
    // Store Socket.IO instance in app locals for access in controllers
    this.app.locals.io = this.io;

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle user authentication via socket
      socket.on('authenticate', async (token) => {
        try {
          if (!token) {
            socket.emit('auth-error', { message: 'No token provided' });
            return;
          }

          // Verify the token
          const decoded = JWTUtil.verifyAccessToken(token);

          // Find the user
          const user = await User.findById(decoded.userId).populate('profile');

          if (!user || !user.isActive) {
            socket.emit('auth-error', { message: 'Invalid user' });
            return;
          }

          // Store user info in socket
          (socket as any).user = user;
          (socket as any).authenticated = true;

          // Join user's personal room
          socket.join(`user:${user.id}`);

          // Emit successful authentication
          socket.emit('authenticated', {
            user: {
              id: user.id,
              email: user.email,
              profile: user.profile,
            },
          });

          logger.info(`Socket authenticated: ${socket.id} for user ${user.email}`);
        } catch (error) {
          logger.error(`Socket authentication failed for ${socket.id}:`, error);
          socket.emit('auth-error', { message: 'Authentication failed' });
        }
      });

      // Handle joining rooms (matches, tournaments, chats)
      socket.on('join-room', (roomId) => {
        if (!(socket as any).authenticated) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        socket.join(roomId);
        logger.info(`Socket ${socket.id} joined room: ${roomId}`);
        socket.emit('joined-room', { roomId });
      });

      socket.on('leave-room', (roomId) => {
        if (!(socket as any).authenticated) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        socket.leave(roomId);
        logger.info(`Socket ${socket.id} left room: ${roomId}`);
        socket.emit('left-room', { roomId });
      });

      // Handle real-time messaging
      socket.on('send-message', async (data) => {
        try {
          if (!(socket as any).authenticated) {
            socket.emit('error', { message: 'Authentication required' });
            return;
          }

          const { roomId, content, messageType = 'text' } = data;
          const user = (socket as any).user;

          if (!roomId || !content) {
            socket.emit('error', {
              message: 'Room ID and content are required',
            });
            return;
          }

          // Create message object (would normally save to database)
          const message = {
            id: Date.now().toString(), // In real app, use proper ID generation
            sender: {
              id: user.id,
              profile: user.profile,
            },
            content: content.trim(),
            messageType,
            timestamp: new Date(),
            roomId,
          };

          // Emit to all users in the room
          this.io.to(roomId).emit('new-message', message);

          logger.info(`Message sent by ${socket.id} in room ${roomId}:`, {
            content: message.content,
          });
        } catch (error) {
          logger.error(`Message sending failed for ${socket.id}:`, error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle match updates
      socket.on('match-update', async (data) => {
        try {
          if (!(socket as any).authenticated) {
            socket.emit('error', { message: 'Authentication required' });
            return;
          }

          const { matchId, update, type } = data;
          const user = (socket as any).user;

          if (!matchId || !update) {
            socket.emit('error', {
              message: 'Match ID and update data are required',
            });
            return;
          }

          // Create update object (would normally validate and save to database)
          const matchUpdate = {
            id: Date.now().toString(),
            matchId,
            type: type || 'general', // 'score', 'status', 'general'
            update,
            updatedBy: {
              id: user.id,
              profile: user.profile,
            },
            timestamp: new Date(),
          };

          // Emit to match room and general match updates room
          this.io.to(`match:${matchId}`).emit('match-updated', matchUpdate);
          this.io.to('match-updates').emit('match-updated', matchUpdate);

          logger.info(`Match update from ${socket.id} for match ${matchId}:`, {
            type,
            update,
          });
        } catch (error) {
          logger.error(`Match update failed for ${socket.id}:`, error);
          socket.emit('error', { message: 'Failed to update match' });
        }
      });

      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
      });

      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      const database = Database.getInstance();
      await database.connect();

      // Initialize all modules
      logger.info('🔧 Initializing modular monolith...');
      const modules = [
        iamModule,
        usersModule,
        matchesModule,
        tournamentsModule,
        teamsModule,
        chatModule,
        notificationsModule,
        venuesModule,
        analyticsModule,
        aiModule,
      ];

      for (const module of modules) {
        await module.initialize();
        logger.info(`✓ Initialized module: ${module.getName()}`);
      }

      // Start server
      this.server.listen(config.app.port, () => {
        logger.info(`🚀 ${config.app.name} is running!`);
        logger.info(`🏗️  Architecture: Modular Monolith`);
        logger.info(`📡 Server: http://localhost:${config.app.port}`);
        logger.info(`🌍 Environment: ${config.app.env}`);
        logger.info(`📊 Health: http://localhost:${config.app.port}/health`);
        logger.info(`📚 API: http://localhost:${config.app.port}${config.app.apiPrefix}`);
        logger.info(`📦 Modules: ${modules.map((m) => m.getName()).join(', ')}`);

        if (config.app.env === 'development') {
          logger.info(`🔍 MongoDB: ${config.database.uri}`);
        }

        // Initialize Application Performance Monitoring
        setupAPM();
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  private gracefulShutdown(signal: string): void {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    this.server.close(async () => {
      logger.info('HTTP server closed');

      try {
        const database = Database.getInstance();
        await database.disconnect();
        logger.info('Database connection closed');

        if (this.sessionRedisClient) {
          await this.sessionRedisClient.quit();
          logger.info('Redis session store connection closed');
        }

        const rateLimitStoreClosed = await closeRateLimitStore();
        if (rateLimitStoreClosed) {
          logger.info('Redis rate limit store connection closed');
        }

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // Force close server after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  }
}

export default App;
