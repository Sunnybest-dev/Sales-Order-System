const { AuditLog, User } = require('../models/associations');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { count, rows } = await AuditLog.findAndCountAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};
