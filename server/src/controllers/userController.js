const { User } = require('../models/associations');

exports.getAll = async (req, res, next) => {
  try {
    const users = await User.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { name, phone, role, is_active } = req.body;
    await user.update({ name, phone, role, is_active });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.deactivate = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    await user.update({ is_active: false });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) { next(err); }
};
