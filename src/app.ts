import {Server} from "http";
import RedisStore from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import {Server as SocketIOServer} from "socket.io";
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./docs/swagger";
import {analyticsModule} from "./modules/analytics";
import adminRoutes from "./modules/analytics/api/routes/admin";
import {chatModule} from "./modules/chat";
import {iamModule} from "./modules/iam";
import apiKeyRoutes from "./modules/iam/api/routes/apiKeys";
import mfaRoutes from "./modules/iam/api/routes/mfa";
import oauthRoutes from "./modules/iam/api/routes/oauth";
import securityRoutes from "./modules/iam/api/routes/security";
import {matchesModule} from "./modules/matches";
import {notificationsModule} from "./modules/notifications";
import {teamsModule} from "./modules/teams";
import {tournamentsModule} from "./modules/tournaments";
import {usersModule} from "./modules/users";
import {User} from "./modules/users/domain/models/User";
import {venuesModule} from "./modules/venues";
import config from "./shared/config";
import Database from "./shared/config/database";
import passport from "./shared/config/passport";
import {closeRateLimitStore} from "./shared/config/rateLimitStore";
import {createRedisClient, RedisClient} from "./shared/config/redis";
import logger from "./shared/infrastructure/logging";
import {JWTUtil} from "./shared/lib/auth";
import {errorHandler, notFoundHandler} from "./shared/middleware/errorHandler";
import {
  advancedRequestLogger,
  analyticsLogger,
  errorTracker,
  securityLogger,
} from "./shared/middleware/logging";
import {
  performanceMonitoring,
  requestCorrelation,
  setupAPM,
} from "./shared/middleware/performance";
import {
  compressionMiddleware,
  corsOptions,
  generalLimiter,
  helmetConfig,
  preventParameterPollution,
  requestLogger,
  sanitizeRequest,
  securityHeaders,
} from "./shared/middleware/security";
// import { aiModule } from './modules/ai'; // AI module not yet implemented

const MODULES = [
  iamModule,
  usersModule,
  matchesModule,
  tournamentsModule,
  teamsModule,
  chatModule,
  notificationsModule,
  venuesModule,
  analyticsModule,
  // aiModule, // AI module not yet implemented
];

/**
 * Application bootstrap class that configures Express, Socket.IO, middleware,
 * routes, Swagger docs, and the graceful startup / shutdown lifecycle.
 *
 * Responsibilities:
 * - Initialize middleware (security, logging, parsing, sessions)
 * - Register module routers and admin routes
 * - Initialize Socket.IO handlers for realtime features
 * - Start the HTTP server and initialize modules
 * - Handle graceful shutdown (DB, Redis, rate limit store)
 */
class App {
  public app: express.Application;
  public server: Server;
  public io: SocketIOServer;
  private readonly sessionRedisClient?: RedisClient;

  /**
   * Construct the App instance.
   * Creates the Express app, HTTP server and Socket.IO instance. Also
   * initializes a Redis client for sessions when not running tests.
   */
  constructor() {
    this.app = express();
    this.server = new Server(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: corsOptions,
      transports: ["websocket", "polling"],
    });

    if (config.app.env !== "test") {
      this.sessionRedisClient = createRedisClient({
        keyPrefix: "sportification:",
        lazyConnect: false,
      });
    }

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSocketIO();
  }

  /**
   * Configure global middleware for the Express application.
   * This includes security headers, CORS, compression, request logging,
   * body parsing, session configuration and Passport initialization.
   */
  private initializeMiddleware(): void {
    this.app.set("trust proxy", 1);
    this.app.use(requestCorrelation);
    this.app.use(performanceMonitoring);

    this.app.use(helmetConfig);
    this.app.use(cors(corsOptions));
    this.app.use(compressionMiddleware);
    this.app.use(preventParameterPollution);
    this.app.use(sanitizeRequest);
    this.app.use(securityHeaders);

    if (config.app.env !== "test") {
      this.app.use(advancedRequestLogger);
      this.app.use(securityLogger);
      this.app.use(analyticsLogger);
    } else {
      this.app.use(requestLogger);
    }

    this.app.use(generalLimiter);
    this.app.use(express.json({limit: "10mb"}));
    this.app.use(express.urlencoded({extended: true, limit: "10mb"}));

    const sessionOptions: session.SessionOptions = {
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      name: config.session.cookieName,
      cookie: {
        secure: config.session.secure,
        httpOnly: true,
        maxAge: config.session.ttl * 1000,
        sameSite: config.app.env === "production" ? "strict" : "lax",
        domain:
          config.app.env === "production"
            ? process.env.COOKIE_DOMAIN
            : undefined,
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
        logger.error("Failed to initialize Redis session store:", error);
      }
    } else if (config.app.env !== "test") {
      logger.warn(
        "Redis session store not initialized; falling back to in-memory sessions"
      );
    }

    this.app.use(session(sessionOptions));
    this.app.use(passport.initialize());
    this.app.use(passport.session());

    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     description: Check API health and get system information
     *     tags:
     *       - System
     *     responses:
     *       200:
     *         description: API is healthy
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "OK"
     *                 architecture:
     *                   type: string
     *                   example: "modular-monolith"
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *                 environment:
     *                   type: string
     *                   example: "development"
     *                 version:
     *                   type: string
     *                   example: "1.0.0"
     *                 uptime:
     *                   type: number
     *                   description: Process uptime in seconds
     *                 memory:
     *                   type: object
     *                   description: Memory usage statistics
     *                 nodejs:
     *                   type: string
     *                   example: "v18.17.0"
     *                 modules:
     *                   type: array
     *                   items:
     *                     type: string
     *                   example: ["iam", "users", "matches", "tournaments"]
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "ERROR"
     *                 message:
     *                   type: string
     *                   example: "Health check failed"
     */
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        architecture: "modular-monolith",
        timestamp: new Date().toISOString(),
        environment: config.app.env,
        version: config.app.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodejs: process.version,
        modules: MODULES.map(m => m.getName()),
      });
    });

    /**
     * @swagger
     * /api/v1:
     *   get:
     *     summary: API information
     *     description: Get API details, version, and available features
     *     tags:
     *       - System
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
     *                   example: "Sportification API"
     *                 version:
     *                   type: string
     *                   example: "1.0.0"
     *                 description:
     *                   type: string
     *                   example: "Sports Companion API - Connecting sports enthusiasts worldwide"
     *                 documentation:
     *                   type: string
     *                   example: "/api/v1/docs"
     *                 status:
     *                   type: string
     *                   example: "active"
     *                 features:
     *                   type: array
     *                   items:
     *                     type: string
     *                   example: ["User Management", "Match Organization", "Tournament Brackets"]
     *       500:
     *         description: Internal server error
     */
    this.app.get("/api/v1", (req, res) => {
      res.status(200).json({
        name: config.app.name,
        version: config.app.version,
        description:
          "Sports Companion API - Connecting sports enthusiasts worldwide",
        documentation: "/api/v1/docs",
        status: "active",
        features: [
          "JWT Authentication",
          "Real-time Socket.IO",
          "Tournament Brackets",
          "Match Management",
          "User Profiles",
          "Comprehensive Logging",
          "Security Middleware",
        ],
      });
    });

    // Swagger Documentation
    this.app.use(
      "/api/v1/docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpecs, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Sports Companion API Documentation",
      })
    );

    /**
     * @swagger
     * /api/v1/openapi.json:
     *   get:
     *     summary: OpenAPI Specification
     *     description: Get the OpenAPI specification in JSON format
     *     tags:
     *       - System
     *     responses:
     *       200:
     *         description: OpenAPI specification
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               description: OpenAPI 3.0 specification document
     *       500:
     *         description: Internal server error
     */
    this.app.get("/api/v1/openapi.json", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.json(swaggerSpecs);
    });

    /**
     * @swagger
     * /docs:
     *   get:
     *     summary: Documentation redirect
     *     description: Redirects to the Swagger UI documentation
     *     tags:
     *       - System
     *     responses:
     *       200:
     *         description: Success - redirects to /api/v1/docs
     *       302:
     *         description: Redirect to /api/v1/docs
     *       500:
     *         description: Internal server error
     */
    this.app.get("/docs", (req, res) => {
      res.redirect("/api/v1/docs");
    });
  }

  /**
   * Register module routers and top-level API/admin/security routes.
   * Each module is mounted at its configured base path.
   */
  private initializeRoutes(): void {
    const apiPrefix = config.app.apiPrefix;

    MODULES.forEach(module => {
      this.app.use(module.getBasePath(), module.getRouter());
      logger.info(
        `✓ Registered module: ${module.getName()} at ${module.getBasePath()}`
      );
    });

    this.app.use(`${apiPrefix}/api-keys`, apiKeyRoutes);
    this.app.use(`${apiPrefix}/mfa`, mfaRoutes);
    this.app.use(`${apiPrefix}/oauth`, oauthRoutes);
    this.app.use(`${apiPrefix}/security`, securityRoutes);
    this.app.use(`${apiPrefix}/admin`, adminRoutes);
  }

  /**
   * Register not-found and error handling middleware in the correct order.
   * The order is important: notFoundHandler -> errorTracker -> errorHandler.
   */
  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorTracker);
    this.app.use(errorHandler);
  }

  /**
   * Configure Socket.IO connection handlers used for realtime features.
   * Handlers include authentication, room join/leave, messaging and
   * match updates. Socket-level errors and disconnects are handled here.
   */
  private initializeSocketIO(): void {
    this.app.locals.io = this.io;

    this.io.on("connection", socket => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on("authenticate", async token => {
        try {
          if (!token) {
            socket.emit("auth-error", {message: "No token provided"});
            return;
          }

          // Future-proof: Use eventBus or service for user lookup
          const decoded = JWTUtil.verifyAccessToken(token);
          const user = await User.findById(decoded.userId).populate("profile");

          if (!user || !user.isActive) {
            socket.emit("auth-error", {message: "Invalid user"});
            return;
          }

          (socket as any).user = user;
          (socket as any).authenticated = true;
          void socket.join(`user:${user.id}`);
          socket.emit("authenticated", {
            user: {
              id: user.id,
              email: user.email,
              profile: user.profile,
            },
          });

          logger.info(
            `Socket authenticated: ${socket.id} for user ${user.email}`
          );
        } catch (error) {
          logger.error(`Socket authentication failed for ${socket.id}:`, error);
          socket.emit("auth-error", {message: "Authentication failed"});
        }
      });

      socket.on("join-room", roomId => {
        if (!(socket as any).authenticated) {
          socket.emit("error", {message: "Authentication required"});
          return;
        }
        void socket.join(roomId);
        logger.info(`Socket ${socket.id} joined room: ${roomId}`);
        socket.emit("joined-room", {roomId});
      });

      socket.on("leave-room", roomId => {
        if (!(socket as any).authenticated) {
          socket.emit("error", {message: "Authentication required"});
          return;
        }
        void socket.leave(roomId);
        logger.info(`Socket ${socket.id} left room: ${roomId}`);
        socket.emit("left-room", {roomId});
      });

      socket.on("send-message", async data => {
        try {
          if (!(socket as any).authenticated) {
            socket.emit("error", {message: "Authentication required"});
            return;
          }
          const {roomId, content, messageType = "text"} = data;
          const user = (socket as any).user;
          if (!roomId || !content) {
            socket.emit("error", {message: "Room ID and content are required"});
            return;
          }
          const message = {
            id: Date.now().toString(),
            sender: {id: user.id, profile: user.profile},
            content: content.trim(),
            messageType,
            timestamp: new Date(),
            roomId,
          };
          this.io.to(roomId).emit("new-message", message);
          logger.info(`Message sent by ${socket.id} in room ${roomId}:`, {
            content: message.content,
          });
        } catch (error) {
          logger.error(`Message sending failed for ${socket.id}:`, error);
          socket.emit("error", {message: "Failed to send message"});
        }
      });

      socket.on("match-update", async data => {
        try {
          if (!(socket as any).authenticated) {
            socket.emit("error", {message: "Authentication required"});
            return;
          }
          const {matchId, update, type} = data;
          const user = (socket as any).user;
          if (!matchId || !update) {
            socket.emit("error", {
              message: "Match ID and update data are required",
            });
            return;
          }
          const matchUpdate = {
            id: Date.now().toString(),
            matchId,
            type: type || "general",
            update,
            updatedBy: {id: user.id, profile: user.profile},
            timestamp: new Date(),
          };
          this.io.to(`match:${matchId}`).emit("match-updated", matchUpdate);
          this.io.to("match-updates").emit("match-updated", matchUpdate);
          logger.info(`Match update from ${socket.id} for match ${matchId}:`, {
            type,
            update,
          });
        } catch (error) {
          logger.error(`Match update failed for ${socket.id}:`, error);
          socket.emit("error", {message: "Failed to update match"});
        }
      });

      socket.on("disconnect", reason => {
        logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
      });

      socket.on("error", error => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Start the application: connect to the database, initialize modules and
   * start the HTTP server. Registers SIGINT/SIGTERM handlers for graceful
   * shutdown.
   */
  public async start(): Promise<void> {
    try {
      const database = Database.getInstance();
      await database.connect();

      logger.info("🔧 Initializing modular monolith...");
      await Promise.all(
        MODULES.map(async module => {
          await module.initialize();
          logger.info(`✓ Initialized module: ${module.getName()}`);
        })
      );

      this.server.listen(config.app.port, () => {
        logger.info(`🚀 ${config.app.name} is running!`);
        logger.info(`🏗️  Architecture: Modular Monolith`);
        logger.info(`📡 Server: http://localhost:${config.app.port}`);
        logger.info(`🌍 Environment: ${config.app.env}`);
        logger.info(`📊 Health: http://localhost:${config.app.port}/health`);
        logger.info(
          `📚 API: http://localhost:${config.app.port}${config.app.apiPrefix}`
        );
        logger.info(`📦 Modules: ${MODULES.map(m => m.getName()).join(", ")}`);
        if (config.app.env === "development") {
          logger.info(`🔍 MongoDB: ${config.database.uri}`);
        }
        setupAPM();
      });

      process.on("SIGTERM", () => this.gracefulShutdown("SIGTERM"));
      process.on("SIGINT", () => this.gracefulShutdown("SIGINT"));
    } catch (error) {
      logger.error("Failed to start application:", error);
      process.exit(1);
    }
  }

  /**
   * Gracefully shut down server and external connections.
   * Closes the HTTP server, disconnects the database, quits Redis client
   * and closes the rate limit store. Exits the process when complete.
   *
   * @param {string} signal - The signal name that triggered shutdown (e.g. SIGINT)
   */
  private gracefulShutdown(signal: string): void {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    this.server.close(async () => {
      try {
        const database = Database.getInstance();
        await database.disconnect();
        logger.info("Database connection closed");

        if (this.sessionRedisClient) {
          await this.sessionRedisClient.quit();
          logger.info("Redis session store connection closed");
        }

        const rateLimitStoreClosed = await closeRateLimitStore();
        if (rateLimitStoreClosed) {
          logger.info("Redis rate limit store connection closed");
        }

        logger.info("Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        logger.error("Error during graceful shutdown:", error);
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error(
        "Could not close connections in time, forcefully shutting down"
      );
      process.exit(1);
    }, 30000);
  }
}

export default App;
