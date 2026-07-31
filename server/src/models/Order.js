const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  order_number: { type: DataTypes.STRING(30), unique: true },
  customer_id: { type: DataTypes.CHAR(36), allowNull: false },
  created_by: { type: DataTypes.CHAR(36) },
  status: { type: DataTypes.ENUM('pending', 'confirmed', 'paid', 'delivered', 'cancelled'), defaultValue: 'pending' },
  subtotal: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  discount_type: { type: DataTypes.ENUM('percentage', 'fixed'), defaultValue: 'fixed' },
  discount_value: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  discount_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  tax_rate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  tax_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  total_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  amount_paid: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  balance_due: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  payment_method: { type: DataTypes.ENUM('cash', 'bank_transfer', 'card', 'credit', 'cheque') },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'orders' });

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  order_id: { type: DataTypes.CHAR(36), allowNull: false },
  product_id: { type: DataTypes.CHAR(36), allowNull: false },
  product_name: { type: DataTypes.STRING(200) },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unit_price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  cost_price: { type: DataTypes.DECIMAL(15, 2) },
  total: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
}, { tableName: 'order_items' });

module.exports = { Order, OrderItem };
