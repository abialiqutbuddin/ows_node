const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OwsReqFormAssignmentHistory = sequelize.define('owsReqFormAssignmentHistory', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  reqId: { type: DataTypes.INTEGER, allowNull: false },
  assignedTo: { type: DataTypes.CHAR(8), allowNull: false },
  assignedBy: { type: DataTypes.CHAR(8), allowNull: false },
  assignedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  notes: { type: DataTypes.STRING(255) }
}, {
  tableName: 'owsReqFormAssignmentHistory',
  timestamps: false
});

module.exports = OwsReqFormAssignmentHistory;