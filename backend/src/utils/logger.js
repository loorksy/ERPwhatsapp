const fs = require('fs');
const path = require('path');
const winston = require('winston');
const env = require('../config/env');

if (!fs.existsSync(env.logDir)) {
  fs.mkdirSync(env.logDir, { recursive: true });
}

const errorLog = path.join(env.logDir, 'error.log');
const combinedLog = path.join(env.logDir, 'combined.log');
const accessLog = path.join(env.logDir, 'access.log');

const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: errorLog, level: 'error' }),
    new winston.transports.File({ filename: combinedLog }),
  ],
});

if (env.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level}] ${message}`)
      ),
    })
  );
}

const accessStream = fs.createWriteStream(accessLog, { flags: 'a' });

logger.stream = {
  write: (message) => {
    accessStream.write(message);
  },
};

module.exports = logger;
