const { Op } = require('sequelize');
const { Product, Category, InventoryLog, Notification, User, sequelize } = require('../models/associations');
const { generateProductCode } = require('../utils/generators');

exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category_id, low_stock } = req.query;
    const where = { is_active: true };
    if (search) where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { sku: { [Op.like]: `%${search}%` } },
      { product_code: { [Op.like]: `%${search}%` } },
    ];
    if (category_id) where.category_id = category_id;
    if (low_stock === 'true') where[Op.and] = [sequelize.where(sequelize.col('quantity'), { [Op.lte]: sequelize.col('min_stock_level') })];

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['name', 'ASC']],
    });

    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: InventoryLog, as: 'inventory_logs', limit: 20, order: [['created_at', 'DESC']] },
      ],
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product_code = await generateProductCode();
    const product = await Product.create({ ...req.body, product_code });
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await product.update(req.body);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await product.update({ is_active: false });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) { next(err); }
};

exports.adjustStock = async (req, res, next) => {
  try {
    const { quantity_change, type, notes } = req.body;
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const quantity_before = product.quantity;
    const quantity_after = quantity_before + quantity_change;
    if (quantity_after < 0) return res.status(400).json({ success: false, message: 'Insufficient stock' });

    await product.update({ quantity: quantity_after });
    await InventoryLog.create({
      product_id: product.id, type, quantity_change, quantity_before, quantity_after,
      notes, recorded_by: req.user.id,
    });

    // Low stock notification
    if (quantity_after <= product.min_stock_level) {
      const admins = await User.findAll({ where: { role: ['super_admin', 'manager'], is_active: true } });
      await Notification.bulkCreate(admins.map(u => ({
        user_id: u.id,
        title: 'Low Stock Alert',
        message: `${product.name} is running low (${quantity_after} remaining)`,
        type: 'warning',
        link: `/products/${product.id}`,
      })));
    }

    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { is_active: true, quantity: { [Op.lte]: sequelize.col('min_stock_level') } },
      include: [{ model: Category, as: 'category', attributes: ['name'] }],
    });
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
};

// Categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({ where: { is_active: true }, order: [['name', 'ASC']] });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
};
