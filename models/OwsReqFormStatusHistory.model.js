const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OwsReqFormStatusHistory = sequelize.define('owsReqFormStatusHistory', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  reqId: { type: DataTypes.INTEGER, allowNull: false },
  oldStatus: { type: DataTypes.STRING(100) },
  newStatus: { type: DataTypes.STRING(100), allowNull: false },
  changedByITS: { type: DataTypes.CHAR(8), allowNull: false },
  changedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  remarks: { type: DataTypes.TEXT }
}, {
  tableName: 'owsReqFormStatusHistory',
  timestamps: false
});

OwsReqFormStatusHistory.hasMany(OwsStatusRequiredDocs, {
  foreignKey: 'statusHistoryId',
  as: 'requiredDocuments'
});

module.exports = OwsReqFormStatusHistory;