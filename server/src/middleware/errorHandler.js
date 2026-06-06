const { AuditLog } = require('../models/associations');
const logger = require('../config/logger');

const auditMiddleware = (action, entity) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    if (res.statusCode < 400 && req.user) {
      try {
        await AuditLog.create({
          user_id: req.user.id,
          action,
          entity,
          entity_id: req.params.id || data?.data?.id,
          new_values: req.body,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
        });
      } catch (err) {
        logger.error('Audit log error:', err);
      }
    }
    return originalJson(data);
  };
  next();
};

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ success: false, message: 'Record already exists' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

module.exports = { auditMiddleware, errorHandler, notFound };
