const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(191), allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('client', 'admin'), allowNull: false, defaultValue: 'client' },
    address: { type: DataTypes.STRING(255), allowNull: true },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  });

  User.associate = (models) => {
    User.hasMany(models.PurchaseRequest, { foreignKey: 'clientId', as: 'requests' });
    User.hasMany(models.AuditLog, { foreignKey: 'adminId', as: 'auditActions' });
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
  };

module.exports = User;