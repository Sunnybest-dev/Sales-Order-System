const { Op } = require('sequelize');
const { Expense } = require('../models/associations');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, from_date, to_date, category } = req.query;
    const where = {};
    if (category) where.category = category;
    if (from_date || to_date) {
      where.date = {};
      if (from_date) where.date[Op.gte] = from_date;
      if (to_date) where.date[Op.lte] = to_date;
    }
    const { count, rows } = await Expense.findAndCountAll({
      where, limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['date', 'DESC']],
    });
    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const expense = await Expense.create({ ...req.body, recorded_by: req.user.id });
    res.status(201).json({ success: true, data: expense });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    await expense.update(req.body);
    res.json({ success: true, data: expense });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    await expense.destroy();
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) { next(err); }
};
