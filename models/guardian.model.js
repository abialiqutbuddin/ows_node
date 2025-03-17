const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Guardian = sequelize.define("guardian", {
  guardianId: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  ITS: {
    type: DataTypes.CHAR(8),
    unique: true,
    allowNull: false
  },
  contact: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  relation: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
}, {
  tableName: "guardian",
  timestamps: false
});

module.exports = Guardian;