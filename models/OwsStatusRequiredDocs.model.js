const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OwsStatusRequiredDocs = sequelize.define('owsStatusRequiredDocs', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  statusHistoryId: { type: DataTypes.INTEGER, allowNull: false },
  documentName: { type: DataTypes.STRING(255), allowNull: false }
}, {
  tableName: 'owsStatusRequiredDocs',
  timestamps: false
});

module.exports = OwsStatusRequiredDocs;