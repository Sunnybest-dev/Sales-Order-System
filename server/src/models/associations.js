const sequelize = require('../config/database');
const User = require('./User');
const Customer = require('./Customer');
const { Category, Product } = require('./Product');
const { Order, OrderItem } = require('./Order');
const { Invoice, Transaction, Expense, InventoryLog, Notification, AuditLog } = require('./index');

Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

Customer.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

User.hasMany(Order, { foreignKey: 'created_by', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'order_items' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Order.hasOne(Invoice, { foreignKey: 'order_id', as: 'invoice' });
Invoice.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Customer.hasMany(Invoice, { foreignKey: 'customer_id', as: 'invoices' });
Invoice.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

Customer.hasMany(Transaction, { foreignKey: 'customer_id', as: 'transactions' });
Transaction.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

Product.hasMany(InventoryLog, { foreignKey: 'product_id', as: 'inventory_logs' });
InventoryLog.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { sequelize, User, Customer, Category, Product, Order, OrderItem, Invoice, Transaction, Expense, InventoryLog, Notification, AuditLog };
