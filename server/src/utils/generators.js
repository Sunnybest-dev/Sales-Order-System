const { Order, Customer, Product, Invoice, Transaction } = require('../models/associations');

const pad = (n, len = 6) => String(n).padStart(len, '0');

exports.generateOrderNumber = async () => {
  const count = await Order.count();
  return `ORD-${new Date().getFullYear()}-${pad(count + 1)}`;
};

exports.generateInvoiceNumber = async () => {
  const count = await Invoice.count();
  return `INV-${new Date().getFullYear()}-${pad(count + 1)}`;
};

exports.generateCustomerCode = async () => {
  const count = await Customer.count();
  return `CUST-${pad(count + 1, 4)}`;
};

exports.generateProductCode = async () => {
  const count = await Product.count();
  return `PROD-${pad(count + 1, 4)}`;
};

exports.generateTransactionRef = async () => {
  const count = await Transaction.count();
  return `TXN-${Date.now()}-${pad(count + 1)}`;
};
