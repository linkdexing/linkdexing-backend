const winston = require("winston");

// Error handling
// creates a new Winston Logger
const logger = new winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: "./logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "./logs/access.log",
    }),
  ],
  exitOnError: false,
});
module.exports = logger;
