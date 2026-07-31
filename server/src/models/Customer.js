const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('Customer', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customer_code: { type: DataTypes.STRING(20), unique: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(150) },
  phone: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.TEXT },
  city: { type: DataTypes.STRING(100) },
  state: { type: DataTypes.STRING(100) },
  country: { type: DataTypes.STRING(100), defaultValue: 'Nigeria' },
  outstanding_balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'customers' });
