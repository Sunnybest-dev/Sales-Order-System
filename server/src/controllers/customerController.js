const { Op } = require('sequelize');
const { Customer, Order, Invoice, Transaction } = require('../models/associations');
const { generateCustomerCode } = require('../utils/generators');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, is_active } = req.query;
    const where = {};
    if (search) where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { customer_code: { [Op.like]: `%${search}%` } },
    ];
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const { count, rows } = await Customer.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        { model: Order, as: 'orders', limit: 10, order: [['created_at', 'DESC']] },
      ],
    });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const customer_code = await generateCustomerCode();
    const customer = await Customer.create({ ...req.body, customer_code });
    res.status(201).json({ success: true, data: customer });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    await customer.update(req.body);
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    await customer.update({ is_active: false });
    res.json({ success: true, message: 'Customer deactivated' });
  } catch (err) { next(err); }
};

exports.getTransactionHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { count, rows } = await Transaction.findAndCountAll({
      where: { customer_id: req.params.id },
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [totalOrders, totalSpent, invoices] = await Promise.all([
      Order.count({ where: { customer_id: id } }),
      Order.sum('total_amount', { where: { customer_id: id, status: 'paid' } }),
      Invoice.count({ where: { customer_id: id, status: 'overdue' } }),
    ]);
    res.json({ success: true, data: { totalOrders, totalSpent: totalSpent || 0, overdueInvoices: invoices } });
  } catch (err) { next(err); }
};
