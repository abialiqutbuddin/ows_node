const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); 

const OwsReqMas = sequelize.define("owsReqMas", {
  reqMasId: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: true,
    autoIncrement: true,
    primaryKey: true
  },
  reqDt: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  ITS: {
    type: DataTypes.CHAR(8),
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  fullName: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  mohalla: {
    type: DataTypes.STRING(70),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: { isEmail: true }
  },
  mobile: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  whatsapp: {
    type: DataTypes.STRING(15),
    allowNull: true
  }
}, {
  tableName: "owsReqMas",
  timestamps: false 
});

module.exports = OwsReqMas;