import path from "path";
import winston from "winston";
import config from "../../config";

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
  winston.format.printf(({timestamp, level, message, ...meta}) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
  winston.format.errors({stack: true}),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport for development
if (config.app.env === "development") {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.logging.level,
    })
  );
}

// File transports for all environments
transports.push(
  // Error log file
  new winston.transports.File({
    filename: path.join(process.cwd(), "logs", "error.log"),
    level: "error",
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Combined log file
  new winston.transports.File({
    filename: path.join(process.cwd(), config.logging.filePath),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

// Create the logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: fileFormat,
  defaultMeta: {service: "sportification-api"},
  transports,
  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "exceptions.log"),
      format: fileFormat,
    }),
  ],
  // Handle rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "rejections.log"),
      format: fileFormat,
    }),
  ],
});

// Add console transport for production errors
if (config.app.env === "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
      level: "error",
    })
  );
}

export default logger;
