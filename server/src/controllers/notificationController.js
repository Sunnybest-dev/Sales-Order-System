const { Notification } = require('../models/associations');

exports.getAll = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    const unread = notifications.filter(n => !n.is_read).length;
    res.json({ success: true, data: notifications, unread });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
};
