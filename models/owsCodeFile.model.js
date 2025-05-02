const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import database connection

const OwsCodeFile = sequelize.define("owsCodeFile", {
  codId: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  codType: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  codGroup: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  GrpSer: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  shortDesc: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  longDesc: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: "owsCodeFile",
  timestamps: false,
});

module.exports = OwsCodeFile;