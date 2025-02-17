const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import database connection
const OwsReqMas = require("./owsReqMas.model"); // Import related table

const OwsReqForm = sequelize.define("OwsReqForm", {
  reqId: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  ITS: {
    type: DataTypes.CHAR(8),
    allowNull: false,
    references: {
      model: OwsReqMas,
      key: "ITS"
    },
    onDelete: "CASCADE"
  },
  reqByITS: {
    type: DataTypes.CHAR(8),
    allowNull: false
  },
  reqByName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  institution: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  class_degree: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  fieldOfStudy: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  subject_course: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  yearOfStart: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  grade: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: { isEmail: true }
  },
  contactNo: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  whatsappNo: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  purpose: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  fundAsking: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: true
  },
  classification: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  organization: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currentStatus: {
    type: DataTypes.STRING(10),
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
  tableName: "owsReqForm",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

// Define Foreign Key Relation
OwsReqForm.belongsTo(OwsReqMas, { foreignKey: "ITS", onDelete: "CASCADE" });

module.exports = OwsReqForm;