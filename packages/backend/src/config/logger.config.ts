import { WinstonModuleOptions } from "nest-winston";
import * as winston from "winston";

/**
 * Get log format configuration based on environment
 * Returns JSON format for production and pretty-print for development
 * @returns Winston format configuration
 */
const getLogFormat = () => {
  const formats = [
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
  ];

  if (process.env.NODE_ENV === "production") {
    // JSON format for production (easier for log aggregation)
    formats.push(winston.format.json());
  } else {
    // Pretty print for development
    formats.push(
      winston.format.colorize(),
      winston.format.printf(
        ({ timestamp, level, message, context, trace, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
          return `${timestamp} [${context || "Application"}] ${level}: ${message} ${metaStr}${trace ? `\n${trace}` : ""}`;
        },
      ),
    );
  }

  return winston.format.combine(...formats);
};

// Configure winston logger
export const winstonConfig: WinstonModuleOptions = {
  transports: [
    // Console transport for all logs
    new winston.transports.Console({
      format: getLogFormat(),
      level: process.env.LOG_LEVEL || "info",
    }),

    // File transport for errors (only in production)
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: "logs/combined.log",
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: "logs/exceptions.log",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: "logs/rejections.log",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
};
