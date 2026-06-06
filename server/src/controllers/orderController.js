const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Order, OrderItem, Product, Customer, Invoice, Transaction, InventoryLog, Notification, User } = require('../models/associations');
const { generateOrderNumber, generateInvoiceNumber, generateTransactionRef } = require('../utils/generators');
const { generateInvoicePDF } = require('../services/pdfService');

exports.getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, customer_id, from_date, to_date, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (customer_id) where.customer_id = customer_id;
    if (from_date || to_date) {
      where.created_at = {};
      if (from_date) where.created_at[Op.gte] = new Date(from_date);
      if (to_date) where.created_at[Op.lte] = new Date(to_date + 'T23:59:59');
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }] },
        { model: Invoice, as: 'invoice' },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, items, discount_type, discount_value = 0, tax_rate = 0, payment_method, notes, amount_paid = 0 } = req.body;

    // Validate stock
    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      if (!product || !product.is_active) throw { status: 400, message: `Product ${item.product_id} not found` };
      if (product.quantity < item.quantity) throw { status: 400, message: `Insufficient stock for ${product.name}` };
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      const total = product.selling_price * item.quantity;
      subtotal += total;
      orderItems.push({ product_id: item.product_id, product_name: product.name, quantity: item.quantity, unit_price: product.selling_price, cost_price: product.cost_price, total });
    }

    const discount_amount = discount_type === 'percentage' ? (subtotal * discount_value) / 100 : parseFloat(discount_value);
    const taxable = subtotal - discount_amount;
    const tax_amount = (taxable * parseFloat(tax_rate)) / 100;
    const total_amount = taxable + tax_amount;
    const balance_due = total_amount - parseFloat(amount_paid);

    const order_number = await generateOrderNumber();
    const order = await Order.create({
      order_number, customer_id, created_by: req.user.id,
      subtotal, discount_type, discount_value, discount_amount, tax_rate, tax_amount,
      total_amount, amount_paid, balance_due, payment_method, notes,
      status: balance_due <= 0 ? 'paid' : 'pending',
    }, { transaction: t });

    // Create order items & deduct stock
    for (const item of orderItems) {
      const oi = await OrderItem.create({ ...item, order_id: order.id }, { transaction: t });
      const product = await Product.findByPk(item.product_id, { transaction: t });
      const qty_before = product.quantity;
      await product.update({ quantity: qty_before - item.quantity }, { transaction: t });
      await InventoryLog.create({
        product_id: item.product_id, type: 'sale', quantity_change: -item.quantity,
        quantity_before: qty_before, quantity_after: qty_before - item.quantity,
        reference_id: order.id, recorded_by: req.user.id,
      }, { transaction: t });
    }

    // Generate invoice
    const invoice_number = await generateInvoiceNumber();
    const invoice = await Invoice.create({
      invoice_number, order_id: order.id, customer_id, issued_by: req.user.id,
      subtotal, discount_amount, tax_amount, total_amount, amount_paid, balance_due,
      status: balance_due <= 0 ? 'paid' : 'draft',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }, { transaction: t });

    // Record transaction
    if (amount_paid > 0) {
      await Transaction.create({
        reference: await generateTransactionRef(), type: 'sale',
        order_id: order.id, customer_id, amount: amount_paid,
        payment_method, description: `Payment for order ${order_number}`,
        recorded_by: req.user.id,
      }, { transaction: t });
    }

    // Update customer balance
    if (balance_due > 0) {
      await Customer.increment('outstanding_balance', { by: balance_due, where: { id: customer_id }, transaction: t });
    }

    await t.commit();

    const fullOrder = await Order.findByPk(order.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: OrderItem, as: 'items' },
        { model: Invoice, as: 'invoice' },
      ],
    });

    res.status(201).json({ success: true, data: fullOrder });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status === 'cancelled') return res.status(400).json({ success: false, message: 'Cannot update cancelled order' });

    await order.update({ status });
    if (order.invoice) await Invoice.update({ status: status === 'paid' ? 'paid' : undefined }, { where: { order_id: order.id } });

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.cancelOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'cancelled') return res.status(400).json({ success: false, message: 'Order already cancelled' });

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      const qty_before = product.quantity;
      await product.update({ quantity: qty_before + item.quantity }, { transaction: t });
      await InventoryLog.create({
        product_id: item.product_id, type: 'return', quantity_change: item.quantity,
        quantity_before: qty_before, quantity_after: qty_before + item.quantity,
        reference_id: order.id, notes: 'Order cancelled', recorded_by: req.user.id,
      }, { transaction: t });
    }

    await order.update({ status: 'cancelled' }, { transaction: t });
    await Invoice.update({ status: 'cancelled' }, { where: { order_id: order.id }, transaction: t });

    if (order.balance_due > 0) {
      await Customer.decrement('outstanding_balance', { by: order.balance_due, where: { id: order.customer_id }, transaction: t });
    }

    await t.commit();
    res.json({ success: true, message: 'Order cancelled and stock restored' });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};
