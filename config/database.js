const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME||'sendus',
  process.env.DB_USER||'root',
  process.env.DB_PASSWORD||'Bringfireh88$$',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: String(process.env.DB_LOGGING).toLowerCase() === 'true' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
