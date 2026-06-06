const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customer_code: { type: DataTypes.STRING(20), unique: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(150), validate: { isEmail: true } },
  phone: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.TEXT },
  city: { type: DataTypes.STRING(100) },
  state: { type: DataTypes.STRING(100) },
  country: { type: DataTypes.STRING(100), defaultValue: 'Nigeria' },
  credit_limit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  outstanding_balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'customers' });

module.exports = Customer;
