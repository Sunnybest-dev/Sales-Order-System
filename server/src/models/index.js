const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  invoice_number: { type: DataTypes.STRING(30), unique: true },
  order_id: { type: DataTypes.UUID, references: { model: 'orders', key: 'id' } },
  customer_id: { type: DataTypes.UUID, references: { model: 'customers', key: 'id' } },
  issued_by: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } },
  status: { type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'), defaultValue: 'draft' },
  subtotal: { type: DataTypes.DECIMAL(15, 2) },
  discount_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  tax_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  total_amount: { type: DataTypes.DECIMAL(15, 2) },
  amount_paid: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  balance_due: { type: DataTypes.DECIMAL(15, 2) },
  due_date: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT },
  pdf_path: { type: DataTypes.STRING(255) },
}, { tableName: 'invoices' });

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  reference: { type: DataTypes.STRING(50), unique: true },
  type: { type: DataTypes.ENUM('sale', 'payment', 'refund', 'expense', 'adjustment') },
  order_id: { type: DataTypes.UUID, references: { model: 'orders', key: 'id' } },
  customer_id: { type: DataTypes.UUID, references: { model: 'customers', key: 'id' } },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  payment_method: { type: DataTypes.ENUM('cash', 'bank_transfer', 'card', 'credit', 'cheque') },
  description: { type: DataTypes.TEXT },
  recorded_by: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } },
}, { tableName: 'transactions' });

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  category: { type: DataTypes.STRING(100) },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  description: { type: DataTypes.TEXT },
  recorded_by: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } },
  receipt: { type: DataTypes.STRING(255) },
}, { tableName: 'expenses' });

const InventoryLog = sequelize.define('InventoryLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  product_id: { type: DataTypes.UUID, references: { model: 'products', key: 'id' } },
  type: { type: DataTypes.ENUM('sale', 'restock', 'adjustment', 'return', 'damage') },
  quantity_change: { type: DataTypes.INTEGER, allowNull: false },
  quantity_before: { type: DataTypes.INTEGER },
  quantity_after: { type: DataTypes.INTEGER },
  reference_id: { type: DataTypes.UUID },
  notes: { type: DataTypes.TEXT },
  recorded_by: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } },
}, { tableName: 'inventory_logs' });

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } },
  title: { type: DataTypes.STRING(200), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('info', 'warning', 'success', 'error'), defaultValue: 'info' },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  link: { type: DataTypes.STRING(255) },
}, { tableName: 'notifications' });

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } },
  action: { type: DataTypes.STRING(100), allowNull: false },
  entity: { type: DataTypes.STRING(50) },
  entity_id: { type: DataTypes.UUID },
  old_values: { type: DataTypes.JSON },
  new_values: { type: DataTypes.JSON },
  ip_address: { type: DataTypes.STRING(45) },
  user_agent: { type: DataTypes.TEXT },
}, { tableName: 'audit_logs' });

module.exports = { Invoice, Transaction, Expense, InventoryLog, Notification, AuditLog };
