const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
  const RequestItem = sequelize.define('RequestItem', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    requestId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(180), allowNull: false },
    targetPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
  });

  RequestItem.associate = (models) => {
    RequestItem.belongsTo(models.PurchaseRequest, { foreignKey: 'requestId', as: 'request' });
  };
module.exports = RequestItem;