const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
];

// Only add file transports if logs directory is writable (local dev)
try {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  transports.push(new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }));
  transports.push(new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }));
} catch (_) {
  // File logging unavailable (e.g. read-only filesystem on Render)
}

const logger = winston.createLogger({
  level: 'debug',
  format: logFormat,
  transports,
});

module.exports = logger;
