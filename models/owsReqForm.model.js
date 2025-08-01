const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import database connection
const OwsReqMas = require("./owsReqMas.model"); // Import related table
const StudentApplication = require("./app_form/student_application.model").StudentApplication;
const DraftModel = require("./student_application_draft.model");
const OwsReqForm = sequelize.define("owsReqForm", {
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
  studentName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  draft_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'student_application_draft',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  application_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'student_application',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  reqByITS: {
    type: DataTypes.CHAR(8),
    allowNull: false
  },
  reqByName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  mohalla: {
    type: DataTypes.STRING(255),
    allowNull: true
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
    type: DataTypes.DECIMAL(10, 2),
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
    type: DataTypes.STRING(100),
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
  },
  cnic: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  fatherCnic: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  motherCnic: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  hasGuardian: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  applyDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  pdf_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  assignedTo: {
    type: DataTypes.STRING(8),
    allowNull: true
  },
  aiut_student_id: { type: DataTypes.CHAR(38), allowNull: true },

}, {
  tableName: "owsReqForm",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at"
});

OwsReqForm.belongsTo(OwsReqMas, { foreignKey: "ITS", onDelete: "CASCADE" });
OwsReqForm.belongsTo(StudentApplication, {
  foreignKey: "application_id",
  onDelete: "SET NULL"
});

OwsReqForm.belongsTo(DraftModel, {
  foreignKey: "draft_id",
  onDelete: "SET NULL"
});

module.exports = OwsReqForm;