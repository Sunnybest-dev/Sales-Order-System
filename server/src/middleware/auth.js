const jwt = require('jsonwebtoken');
const { User } = require('../models/associations');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_prod';

const authenticate = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Access token required' });
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) return res.status(401).json({ success: false, message: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  next();
};

module.exports = { authenticate, authorize };
