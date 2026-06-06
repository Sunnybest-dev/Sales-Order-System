const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'categories' });

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  product_code: { type: DataTypes.STRING(30), unique: true },
  sku: { type: DataTypes.STRING(50), unique: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  category_id: { type: DataTypes.UUID, references: { model: 'categories', key: 'id' } },
  cost_price: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  selling_price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  min_stock_level: { type: DataTypes.INTEGER, defaultValue: 10 },
  supplier: { type: DataTypes.STRING(200) },
  unit: { type: DataTypes.STRING(20), defaultValue: 'piece' },
  image: { type: DataTypes.STRING(255) },
  barcode: { type: DataTypes.STRING(100) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'products' });

module.exports = { Category, Product };
