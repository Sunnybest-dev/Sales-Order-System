const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models/associations');
const { sendEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_prod';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_prod';

const generateTokens = (userId) => ({
  accessToken: jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }),
  refreshToken: jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }),
});

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, is_active: true } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const { accessToken, refreshToken } = generateTokens(user.id);
    await user.update({ last_login: new Date(), refresh_token: refreshToken });
    res.json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (err) { next(err); }
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const user = await User.create({ name, email, password, role, phone });
    const { accessToken, refreshToken } = generateTokens(user.id);
    await user.update({ refresh_token: refreshToken });
    res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (err) { next(err); }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findOne({ where: { id: decoded.id, refresh_token: refreshToken, is_active: true } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    const tokens = generateTokens(user.id);
    await user.update({ refresh_token: tokens.refreshToken });
    res.json({ success: true, data: tokens });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Invalid token' });
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await req.user.update({ refresh_token: null });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) return res.json({ success: true, message: 'If email exists, reset link sent' });
    const token = crypto.randomBytes(32).toString('hex');
    await user.update({ password_reset_token: token, password_reset_expires: new Date(Date.now() + 3600000) });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail({ to: user.email, subject: 'Password Reset', html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>` });
    res.json({ success: true, message: 'Reset email sent' });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ where: { password_reset_token: token } });
    if (!user || new Date() > user.password_reset_expires) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    await user.update({ password, password_reset_token: null, password_reset_expires: null });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) { next(err); }
};

exports.getProfile = (req, res) => res.json({ success: true, data: req.user });

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    await req.user.update({ name, phone });
    res.json({ success: true, data: req.user });
  } catch (err) { next(err); }
};
