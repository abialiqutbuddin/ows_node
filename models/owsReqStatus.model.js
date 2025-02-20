const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); 

const OwsReqStatus = sequelize.define("owsReqStatus", {
  reqId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    references: {
      model: "owsReqForm", // Table Name
      key: "reqId"
    },
    onDelete: "CASCADE"
  },
  statusId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "owsCodeFile",
      key: "codId"
    },
    onDelete: "CASCADE"
  },
  statusDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  updated_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "owsReqStatus",  // Table Name in DB
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

module.exports = OwsReqStatus;