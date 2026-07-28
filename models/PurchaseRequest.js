const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
const PurchaseRequest = sequelize.define('PurchaseRequest', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    clientId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    locationAddress: { type: DataTypes.STRING(255), allowNull: false },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    distanceKm: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    serviceCharge: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    itemsTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'purchased', 'fulfilled', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    adminComment: { type: DataTypes.TEXT, allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
    fulfilledAt: { type: DataTypes.DATE, allowNull: true },
  });

  PurchaseRequest.associate = (models) => {
    PurchaseRequest.belongsTo(models.User, { foreignKey: 'clientId', as: 'client' });
    PurchaseRequest.hasMany(models.RequestItem, { foreignKey: 'requestId', as: 'items', onDelete: 'CASCADE' });
    PurchaseRequest.hasMany(models.AuditLog, { foreignKey: 'requestId', as: 'auditLogs', onDelete: 'CASCADE' });
    PurchaseRequest.hasMany(models.Notification, { foreignKey: 'requestId', as: 'notifications', onDelete: 'CASCADE' });
  };

  module.exports = PurchaseRequest;