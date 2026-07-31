const winston = require('winston');
const path = require('path');
const fs = require('fs');

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
];

try {
  const dir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  transports.push(new winston.transports.File({ filename: path.join(dir, 'error.log'), level: 'error' }));
  transports.push(new winston.transports.File({ filename: path.join(dir, 'combined.log') }));
} catch (_) {}

module.exports = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports,
});
