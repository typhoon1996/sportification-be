import App from "./app";
import logger from "./shared/infrastructure/logging";
import {validateAndExit} from "./shared/utils/validateEnv";
import config from "./shared/config";

// Display startup banner
console.log("\n🏃 Sportification Backend Starting...\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📦 Application: ${config.app.name}`);
console.log(`🔖 Version: ${config.app.version}`);
console.log(`🌍 Environment: ${config.app.env}`);
console.log(`📡 Port: ${config.app.port}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// Validate environment configuration
validateAndExit();

// Graceful shutdown handler
const shutdown = (error: unknown, type: string) => {
  logger.error(`${type}:`, error);
  process.exit(1);
};

// Handle uncaught exceptions
process.on("uncaughtException", error => {
  logger.error("💥 Uncaught Exception:", error);
  shutdown(error, "Uncaught Exception");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  shutdown(reason, "Unhandled Rejection");
});

// Start the application
(async () => {
  try {
    const app = new App();
    await app.start();
    logger.info("✅ Application started successfully");
  } catch (error) {
    shutdown(error, "Failed to start application");
  }
})();
