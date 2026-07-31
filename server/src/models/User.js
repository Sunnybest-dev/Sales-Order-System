const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('super_admin', 'manager', 'accountant', 'sales_staff'), defaultValue: 'sales_staff' },
  phone: { type: DataTypes.STRING(20) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  last_login: { type: DataTypes.DATE },
  password_reset_token: { type: DataTypes.STRING(255) },
  password_reset_expires: { type: DataTypes.DATE },
  refresh_token: { type: DataTypes.TEXT },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (u) => { u.password = await bcrypt.hash(u.password, 12); },
    beforeUpdate: async (u) => { if (u.changed('password')) u.password = await bcrypt.hash(u.password, 12); },
  },
});

User.prototype.comparePassword = function (pwd) { return bcrypt.compare(pwd, this.password); };
User.prototype.toJSON = function () {
  const v = { ...this.get() };
  delete v.password; delete v.refresh_token; delete v.password_reset_token;
  return v;
};

module.exports = User;
