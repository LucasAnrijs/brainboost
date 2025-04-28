const winston = require('winston');
const config = require('../../config/app');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
};

// Define level colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'cyan',
  verbose: 'blue',
  debug: 'magenta',
};

// Add colors to Winston
winston.addColors(colors);

// Define format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${
      info.splat ? `${info.splat}` : ''
    }${
      // Add metadata if available, but limit its size
      Object.keys(info).some(key => !['timestamp', 'level', 'message', 'splat'].includes(key))
        ? `\n${JSON.stringify(
            Object.fromEntries(
              Object.entries(info).filter(
                ([key]) => !['timestamp', 'level', 'message', 'splat'].includes(key)
              )
            ),
            (key, value) => {
              // Truncate large string values
              if (typeof value === 'string' && value.length > 500) {
                return value.substring(0, 500) + '... (truncated)';
              }
              return value;
            },
            2
          )}`
        : ''
    }`
  )
);

// Define format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Get log level from config or default to 'info'
const level = config.logging.level || 'info';

// Create a Winston logger instance
const logger = winston.createLogger({
  level,
  levels,
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
  // Handle unhandled exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development and test environments
if (config.server.env !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// HTTP request logger for Morgan
const httpLogger = {
  write: (message) => {
    // Remove newline character and log at http level
    logger.http(message.trim());
  },
};

module.exports = {
  logger,
  httpLogger,
};
