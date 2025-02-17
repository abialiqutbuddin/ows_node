const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import database connection

const OwsCodeFile = sequelize.define("OwsCodeFile", {
  codId: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  codType: {
    type: DataTypes.STRING(5),
    allowNull: true
  },
  shortDesc: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  longDesc: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: "owsCodeFile",
  timestamps: false // No created_at and updated_at columns
});

module.exports = OwsCodeFile;