const { Op } = require('sequelize');
const { Invoice, Order, OrderItem, Customer, Product, User } = require('../models/associations');
const { generateInvoicePDF } = require('../services/pdfService');
const { sendEmail } = require('../services/emailService');

exports.getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, customer_id, from_date, to_date } = req.query;
    const where = {};
    if (status) where.status = status;
    if (customer_id) where.customer_id = customer_id;
    if (from_date || to_date) {
      where.created_at = {};
      if (from_date) where.created_at[Op.gte] = new Date(from_date);
      if (to_date) where.created_at[Op.lte] = new Date(to_date + 'T23:59:59');
    }

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] }],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Order, as: 'order', include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }] },
        { model: User, as: 'issued_by_user', foreignKey: 'issued_by', attributes: ['id', 'name'] },
      ],
    });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) { next(err); }
};

exports.downloadInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Order, as: 'order', include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }] },
      ],
    });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const pdfBuffer = await generateInvoicePDF(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

exports.emailInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Order, as: 'order', include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }] },
      ],
    });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (!invoice.customer.email) return res.status(400).json({ success: false, message: 'Customer has no email' });

    const pdfBuffer = await generateInvoicePDF(invoice);
    await sendEmail({
      to: invoice.customer.email,
      subject: `Invoice ${invoice.invoice_number} from ${process.env.COMPANY_NAME}`,
      html: `<p>Dear ${invoice.customer.name},</p><p>Please find your invoice attached.</p><p>Total: ${invoice.total_amount}</p>`,
      attachments: [{ filename: `invoice-${invoice.invoice_number}.pdf`, content: pdfBuffer }],
    });

    await invoice.update({ status: 'sent' });
    res.json({ success: true, message: 'Invoice sent successfully' });
  } catch (err) { next(err); }
};

exports.markAsPaid = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    await invoice.update({ status: 'paid', amount_paid: invoice.total_amount, balance_due: 0 });
    await Order.update({ status: 'paid', amount_paid: invoice.total_amount, balance_due: 0 }, { where: { id: invoice.order_id } });
    res.json({ success: true, data: invoice });
  } catch (err) { next(err); }
};
