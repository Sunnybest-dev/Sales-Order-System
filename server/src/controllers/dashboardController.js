const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const { Order, OrderItem, Product, Customer, Transaction, Expense, Invoice } = require('../models/associations');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      totalRevenue, monthRevenue, todayRevenue,
      totalOrders, pendingOrders, totalCustomers,
      totalProducts, lowStockCount,
      recentOrders, topProducts,
      monthlyRevenue,
    ] = await Promise.all([
      Order.sum('total_amount', { where: { status: { [Op.in]: ['paid', 'delivered'] } } }),
      Order.sum('total_amount', { where: { status: { [Op.in]: ['paid', 'delivered'] }, created_at: { [Op.gte]: startOfMonth } } }),
      Order.sum('total_amount', { where: { status: { [Op.in]: ['paid', 'delivered'] }, created_at: { [Op.gte]: startOfDay } } }),
      Order.count({ where: { status: { [Op.ne]: 'cancelled' } } }),
      Order.count({ where: { status: 'pending' } }),
      Customer.count({ where: { is_active: true } }),
      Product.count({ where: { is_active: true } }),
      Product.count({ where: { is_active: true, quantity: { [Op.lte]: col('min_stock_level') } } }),
      Order.findAll({
        limit: 10, order: [['created_at', 'DESC']],
        include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
        attributes: ['id', 'order_number', 'total_amount', 'status', 'created_at'],
      }),
      OrderItem.findAll({
        attributes: ['product_id', 'product_name', [fn('SUM', col('quantity')), 'total_sold'], [fn('SUM', col('total')), 'total_revenue']],
        group: ['product_id', 'product_name'],
        order: [[literal('total_sold'), 'DESC']],
        limit: 5,
      }),
      Order.findAll({
        attributes: [
          [fn('MONTH', col('created_at')), 'month'],
          [fn('YEAR', col('created_at')), 'year'],
          [fn('SUM', col('total_amount')), 'revenue'],
          [fn('COUNT', col('id')), 'orders'],
        ],
        where: { created_at: { [Op.gte]: startOfYear }, status: { [Op.in]: ['paid', 'delivered'] } },
        group: [fn('MONTH', col('created_at')), fn('YEAR', col('created_at'))],
        order: [[literal('year'), 'ASC'], [literal('month'), 'ASC']],
      }),
    ]);

    const totalExpenses = await Expense.sum('amount', { where: { date: { [Op.gte]: startOfMonth } } });
    const profit = (monthRevenue || 0) - (totalExpenses || 0);

    res.json({
      success: true,
      data: {
        kpis: {
          totalRevenue: totalRevenue || 0,
          monthRevenue: monthRevenue || 0,
          todayRevenue: todayRevenue || 0,
          totalOrders, pendingOrders, totalCustomers, totalProducts, lowStockCount,
          monthProfit: profit,
        },
        recentOrders,
        topProducts,
        monthlyRevenue,
      },
    });
  } catch (err) { next(err); }
};

exports.getSalesReport = async (req, res, next) => {
  try {
    const { from_date, to_date, group_by = 'day' } = req.query;
    const where = { status: { [Op.in]: ['paid', 'delivered'] } };
    if (from_date) where.created_at = { [Op.gte]: new Date(from_date) };
    if (to_date) where.created_at = { ...(where.created_at || {}), [Op.lte]: new Date(to_date + 'T23:59:59') };

    const groupFn = group_by === 'month' ? fn('MONTH', col('created_at')) : fn('DATE', col('created_at'));
    const data = await Order.findAll({
      attributes: [
        [groupFn, 'period'],
        [fn('SUM', col('total_amount')), 'revenue'],
        [fn('COUNT', col('id')), 'orders'],
        [fn('SUM', col('discount_amount')), 'discounts'],
        [fn('SUM', col('tax_amount')), 'taxes'],
      ],
      where,
      group: [groupFn],
      order: [[groupFn, 'ASC']],
    });

    const summary = await Order.findOne({
      attributes: [
        [fn('SUM', col('total_amount')), 'total_revenue'],
        [fn('COUNT', col('id')), 'total_orders'],
        [fn('AVG', col('total_amount')), 'avg_order_value'],
      ],
      where,
    });

    res.json({ success: true, data: { chart: data, summary } });
  } catch (err) { next(err); }
};

exports.getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'sku', 'quantity', 'min_stock_level', 'cost_price', 'selling_price'],
      include: [{ model: require('../models/Product').Category, as: 'category', attributes: ['name'] }],
      order: [['quantity', 'ASC']],
    });

    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.cost_price), 0);
    const lowStock = products.filter(p => p.quantity <= p.min_stock_level);

    res.json({ success: true, data: { products, totalValue, lowStockCount: lowStock.length, lowStockProducts: lowStock } });
  } catch (err) { next(err); }
};

exports.getProfitLossReport = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    const dateWhere = {};
    if (from_date) dateWhere[Op.gte] = new Date(from_date);
    if (to_date) dateWhere[Op.lte] = new Date(to_date + 'T23:59:59');

    const [revenue, cogs, expenses] = await Promise.all([
      Order.sum('total_amount', { where: { status: { [Op.in]: ['paid', 'delivered'] }, ...(Object.keys(dateWhere).length && { created_at: dateWhere }) } }),
      OrderItem.findAll({
        attributes: [[fn('SUM', literal('quantity * cost_price')), 'cogs']],
        include: [{ model: Order, as: 'order', where: { status: { [Op.in]: ['paid', 'delivered'] }, ...(Object.keys(dateWhere).length && { created_at: dateWhere }) }, attributes: [] }],
      }),
      Expense.sum('amount', { where: Object.keys(dateWhere).length ? { date: dateWhere } : {} }),
    ]);

    const totalRevenue = revenue || 0;
    const totalCOGS = parseFloat(cogs[0]?.dataValues?.cogs || 0);
    const totalExpenses = expenses || 0;
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      success: true,
      data: { totalRevenue, totalCOGS, grossProfit, totalExpenses, netProfit, grossMargin: totalRevenue ? ((grossProfit / totalRevenue) * 100).toFixed(2) : 0 },
    });
  } catch (err) { next(err); }
};
