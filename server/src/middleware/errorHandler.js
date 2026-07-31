const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  if (err.name === 'SequelizeValidationError') return res.status(422).json({ success: false, message: err.errors[0].message });
  if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'Record already exists' });
  res.status(err.status || 500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
};

const notFound = (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });

module.exports = { errorHandler, notFound };
