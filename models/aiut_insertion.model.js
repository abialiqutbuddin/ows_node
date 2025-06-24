// models.js
// Sequelize model definitions for production environment

const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize (adjust config as needed)
const sequelize = new Sequelize(
  'aiut',
  'aak',
  'Aak@110*',
  {
    host: '182.188.38.224',
    port: 3308,
    dialect: 'mysql',
    logging: false, // disable SQL logging
  }
);

// FinancialSurvey
const FinancialSurvey = sequelize.define(
  'FinancialSurvey',
  {
    financial_survey_id: {
      type: DataTypes.CHAR(38),
      primaryKey: true,
    },
    student_id: { type: DataTypes.STRING, allowNull: true },
    monthly_income: { type: DataTypes.DECIMAL(17, 2), defaultValue: 0.0 },
    earning_members: { type: DataTypes.INTEGER, allowNull: true },
    dependents: { type: DataTypes.INTEGER, allowNull: true },
    flat_area: { type: DataTypes.STRING, allowNull: true },
    employer_name: { type: DataTypes.STRING, allowNull: true },
    mohallah_member_name: { type: DataTypes.STRING, allowNull: true },
    mohallah_member_its_no: { type: DataTypes.STRING, allowNull: true },
    mohallah_member_date: { type: DataTypes.DATEONLY, allowNull: true },
    mohallah_member_comment: { type: DataTypes.TEXT, allowNull: true },
    document_name: { type: DataTypes.STRING, allowNull: true },
    document_file: { type: DataTypes.STRING, allowNull: true },
    fa_arzi_name: { type: DataTypes.STRING, allowNull: true },
    fa_arzi_file: { type: DataTypes.STRING, allowNull: true },
    committee_member_name: { type: DataTypes.STRING, allowNull: true },
    committee_member_its_no: { type: DataTypes.STRING, allowNull: true },
    committee_member_date: { type: DataTypes.DATEONLY, allowNull: true },
    committee_member_comment: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('Approve', 'Pending', 'Rejected', 'Request'),
      defaultValue: 'Pending',
    },
    student_status: { type: DataTypes.ENUM('New', 'Old'), allowNull: true },
    remove_from_fa: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: true },
    created_by_id: { type: DataTypes.INTEGER, allowNull: true },
    modified_at: { type: DataTypes.DATE, allowNull: true },
    modified_by_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'financial_survey',
    timestamps: false,
  }
);

// FinancialSurveyFee
const FinancialSurveyFee = sequelize.define(
  'FinancialSurveyFee',
  {
    financial_survey_fee_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    financial_survey_id: { type: DataTypes.CHAR(38), allowNull: false },
    student_fee_id: { type: DataTypes.CHAR(38), allowNull: false },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    fee_type_id: { type: DataTypes.INTEGER, allowNull: true },
    frequency: { type: DataTypes.INTEGER, allowNull: true },
    amount: { type: DataTypes.DECIMAL(17, 2), defaultValue: 0.0 },
    parents_share: { type: DataTypes.DECIMAL(17, 2), defaultValue: 0.0 },
    aiut_share: { type: DataTypes.DECIMAL(17, 2), defaultValue: 0.0 },
    ratio: { type: DataTypes.STRING, allowNull: true },
    due_date: { type: DataTypes.DATEONLY, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    created_by_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'financial_survey_fee',
    timestamps: false,
  }
);

// FinancialSurveyGoods
const FinancialSurveyGoods = sequelize.define(
  'FinancialSurveyGoods',
  {
    financial_survey_goods_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    financial_survey_id: { type: DataTypes.CHAR(38), allowNull: true },
    goods_id: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM('yes', 'no'),
      defaultValue: 'no',
    },
    comment: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    created_by_id: { type: DataTypes.INTEGER, allowNull: true },
    modified_at: { type: DataTypes.DATE, allowNull: true },
    modified_by_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'financial_survey_goods',
    timestamps: false,
  }
);

// FinancialYear
const FinancialYear = sequelize.define(
  'FinancialYear',
  {
    financial_year_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fy_code: { type: DataTypes.CHAR(4), allowNull: false },
    code: { type: DataTypes.CHAR(9), allowNull: true },
    title: { type: DataTypes.STRING, allowNull: true },
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    qtr1_start: { type: DataTypes.DATEONLY, allowNull: true },
    qtr1_end: { type: DataTypes.DATEONLY, allowNull: true },
    qtr2_start: { type: DataTypes.DATEONLY, allowNull: true },
    qtr2_end: { type: DataTypes.DATEONLY, allowNull: true },
    qtr3_start: { type: DataTypes.DATEONLY, allowNull: true },
    qtr3_end: { type: DataTypes.DATEONLY, allowNull: true },
    qtr4_start: { type: DataTypes.DATEONLY, allowNull: true },
    qtr4_end: { type: DataTypes.DATEONLY, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    created_by_id: { type: DataTypes.INTEGER, allowNull: true },
    modified_at: { type: DataTypes.DATE, allowNull: true },
    modified_by_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'financial_year',
    timestamps: false,
  }
);

// InstituteCategory
const InstituteCategory = sequelize.define(
  'InstituteCategory',
  {
    institute_category_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    institute_category: { type: DataTypes.STRING, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    created_by_id: { type: DataTypes.INTEGER, allowNull: true },
    modified_at: { type: DataTypes.DATE, allowNull: true },
    modified_by_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'institute_category',
    timestamps: false,
  }
);

// Mohallah
const Mohallah = sequelize.define(
  'Mohallah',
  {
    mohallah_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mohallah_code: { type: DataTypes.CHAR(4), allowNull: true },
    mohallah_name: { type: DataTypes.STRING, allowNull: true },
    amil_saheb: { type: DataTypes.STRING, allowNull: true },
    amil_saheb_contact_no: { type: DataTypes.STRING, allowNull: true },
    amil_saheb_email: { type: DataTypes.STRING, allowNull: true },
    mohallah_committee_head: { type: DataTypes.STRING, allowNull: true },
    mohallah_committee_head_contact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mohallah_committee_head_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mohallah_coordinator: { type: DataTypes.STRING, allowNull: true },
    mohallah_coordinator_contact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mohallah_coordinator_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    budget_head: { type: DataTypes.STRING, allowNull: false },
    budget_key: { type: DataTypes.INTEGER, allowNull: false },
    account_head: { type: DataTypes.STRING, allowNull: false },
    account_key: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: true },
    created_by_id: { type: DataTypes.INTEGER, allowNull: true },
    modified_at: { type: DataTypes.DATE, allowNull: true },
    modified_by_id: { type: DataTypes.INTEGER, allowNull: true },
    reportable: {
      type: DataTypes.ENUM('Yes', 'No'),
      allowNull: true,
    },
  },
  {
    tableName: 'mohallah',
    timestamps: false,
  }
);

// StudentInstitute
const StudentInstitute = sequelize.define(
  'StudentInstitute',
  {
    student_institute_id: {
      type: DataTypes.CHAR(38),
      primaryKey: true,
    },
    financial_year_id: { type: DataTypes.INTEGER, allowNull: false },
    student_id: { type: DataTypes.CHAR(38), allowNull: false },
    institute_category_id: { type: DataTypes.INTEGER, defaultValue: 0 },
    school_id: { type: DataTypes.INTEGER, defaultValue: 0 },
    class_id: { type: DataTypes.INTEGER, defaultValue: 0 },
    section_id: { type: DataTypes.INTEGER, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: true },
    created_by_id: { type: DataTypes.INTEGER, allowNull: true },
    modified_at: { type: DataTypes.DATE, allowNull: true },
    modified_by_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'student_institute',
    timestamps: false,
  }
);

// StudentFee
const StudentFee = sequelize.define(
  'StudentFee',
  {
    student_fee_id: {
      type: DataTypes.CHAR(38),
      primaryKey: true,
    },
    financial_year_id: { type: DataTypes.INTEGER, allowNull: true },
    student_id: { type: DataTypes.CHAR(38), allowNull: true },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    fee_type_id: { type: DataTypes.INTEGER, allowNull: true },
    due_date: { type: DataTypes.DATEONLY, allowNull: true },
    amount: { type: DataTypes.DECIMAL(17, 2), defaultValue: 0.0 },
    remarks: { type: DataTypes.STRING, allowNull: true },
    parents_share: { type: DataTypes.DECIMAL(17, 2), defaultValue: 0.0 },
    aiut_share: { type: DataTypes.DECIMAL(17, 2), defaultValue: 0.0 },
    ratio: { type: DataTypes.STRING, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    created_by_id: { type: DataTypes.INTEGER, allowNull: true },
    modified_at: { type: DataTypes.DATE, allowNull: true },
    modified_by_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'student_fee',
    timestamps: false,
  }
);

// FeeType
const FeeType = sequelize.define(
  'FeeType',
  {
    fee_type_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fee_type: { type: DataTypes.STRING, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    created_by_id: { type: DataTypes.INTEGER, allowNull: true },
    modified_at: { type: DataTypes.DATE, allowNull: true },
    modified_by_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'fee_type',
    timestamps: false,
  }
);

// Class
const Class = sequelize.define(
  'Class',
  {
    class_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    class_name: { type: DataTypes.STRING, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    created_by_id: { type: DataTypes.INTEGER, allowNull: true },
    modified_at: { type: DataTypes.DATE, allowNull: true },
    modified_by_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'class',
    timestamps: false,
  }
);

// School
const School = sequelize.define(
  'School',
  {
    school_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    institute_category_id: { type: DataTypes.INTEGER, allowNull: true },
    school_category: { type: DataTypes.STRING, allowNull: true },
    school_name: { type: DataTypes.STRING, allowNull: true },
    phone_no: { type: DataTypes.STRING, allowNull: true },
    contact_person_name: { type: DataTypes.STRING, allowNull: true },
    contact_person_designation: { type: DataTypes.STRING, allowNull: true },
    contact_person_mobile_no: { type: DataTypes.STRING, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    created_by_id: { type: DataTypes.INTEGER, allowNull: true },
    modified_at: { type: DataTypes.DATE, allowNull: true },
    modified_by_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'school',
    timestamps: false,
  }
);

// Section
const Section = sequelize.define(
  'Section',
  {
    section_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    class_id: { type: DataTypes.INTEGER, allowNull: true },
    section_name: { type: DataTypes.STRING, allowNull: true },    
    created_at: { type: DataTypes.DATE, allowNull: true },
    created_by_id: { type: DataTypes.INTEGER, allowNull: true },
    modified_at: { type: DataTypes.DATE, allowNull: true },
    modified_by_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'section',
    timestamps: false,
  }
);

const Goods = sequelize.define(
  'Goods',
  {
    goods_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    tableName: 'goods',
    timestamps: false
  }
);

// Associations
FinancialSurvey.hasMany(FinancialSurveyFee, { foreignKey: 'financial_survey_id' });
FinancialSurveyFee.belongsTo(FinancialSurvey, { foreignKey: 'financial_survey_id' });

FinancialSurvey.hasMany(FinancialSurveyGoods, { foreignKey: 'financial_survey_id' });
FinancialSurveyGoods.belongsTo(FinancialSurvey, { foreignKey: 'financial_survey_id' });

FinancialYear.hasMany(StudentInstitute, { foreignKey: 'financial_year_id' });
StudentInstitute.belongsTo(FinancialYear, { foreignKey: 'financial_year_id' });

InstituteCategory.hasMany(StudentInstitute, { foreignKey: 'institute_category_id' });
StudentInstitute.belongsTo(InstituteCategory, { foreignKey: 'institute_category_id' });

FinancialYear.hasMany(StudentFee, { foreignKey: 'financial_year_id' });
StudentFee.belongsTo(FinancialYear, { foreignKey: 'financial_year_id' });

FeeType.hasMany(StudentFee, { foreignKey: 'fee_type_id' });
StudentFee.belongsTo(FeeType, { foreignKey: 'fee_type_id' });

Class.hasMany(Section, { foreignKey: 'class_id' });
Section.belongsTo(Class, { foreignKey: 'class_id' });

// Export all models and Sequelize instance
module.exports = {
  sequelize,
  FinancialSurvey,
  FinancialSurveyFee,
  FinancialSurveyGoods,
  FinancialYear,
  InstituteCategory,
  Mohallah,
  StudentInstitute,
  StudentFee,
  FeeType,
  Class,
  School,
  Section,  
  Goods,
};