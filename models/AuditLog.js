const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
  const AuditLog = sequelize.define('AuditLog', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    requestId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    adminId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    action: { type: DataTypes.STRING(100), allowNull: false },
    fromStatus: { type: DataTypes.STRING(40), allowNull: true },
    toStatus: { type: DataTypes.STRING(40), allowNull: true },
    comment: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.PurchaseRequest, { foreignKey: 'requestId', as: 'request' });
    AuditLog.belongsTo(models.User, { foreignKey: 'adminId', as: 'admin' });
  };
module.exports = AuditLog;