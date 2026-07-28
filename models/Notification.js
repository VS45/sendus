const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    requestId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    message: { type: DataTypes.STRING(255), allowNull: false },
    readAt: { type: DataTypes.DATE, allowNull: true },
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Notification.belongsTo(models.PurchaseRequest, { foreignKey: 'requestId', as: 'request' });
  };

  module.exports = Notification;
