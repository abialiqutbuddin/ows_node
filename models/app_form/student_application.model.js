const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const StudentApplication = sequelize.define("StudentApplication", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  khidmat_current: { type: DataTypes.STRING, allowNull: false },
  khidmat_intent: { type: DataTypes.STRING, allowNull: false },
  studied_kalemat_daim: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  memorized_names: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  offers_sila_vajebaat: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  attended_misaq_majlis: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  moharramaat_survey: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  shaadi_status: { type: DataTypes.STRING, allowNull: false },
  spouse_name: { type: DataTypes.STRING, allowNull: false },
  ashara_attendance: { type: DataTypes.STRING, allowNull: false },
  ziarat_raudat_tahera: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  namaz_daily: { type: DataTypes.STRING, allowNull: false },
  father_name: { type: DataTypes.STRING, allowNull: false },
  father_cnic: { type: DataTypes.STRING, allowNull: false },
  mother_name: { type: DataTypes.STRING, allowNull: false },
  mother_cnic: { type: DataTypes.STRING, allowNull: false },
  house_title: { type: DataTypes.STRING, allowNull: false },
  area: { type: DataTypes.STRING, allowNull: false },
  neighborhood: { type: DataTypes.STRING, allowNull: false },
  drinking_water: { type: DataTypes.STRING, allowNull: false },
  sanitation_bathroom: { type: DataTypes.STRING, allowNull: false },
  wallFlooring: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  leakage: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  personalBank: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  taking_fmb: { type: DataTypes.STRING, allowNull: false },
  fmb_quantity_sufficient: { type: DataTypes.STRING, allowNull: false },
  height: { type: DataTypes.DECIMAL(5,2), allowNull: false },
  weight: { type: DataTypes.DECIMAL(5,2), allowNull: false },
  physically_mentally_challenged: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  child_death_past_5yrs: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  child_death_cause: { type: DataTypes.STRING, allowNull: false },
  vaccination_status: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  chronic_illness: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  incomeType: { type: DataTypes.STRING, allowNull: false },
  familyMemberName: { type: DataTypes.STRING, allowNull: false },
  studentPartTimeIncome: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  family_member_working: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  working_details: { type: DataTypes.TEXT, allowNull: false },
  family_member_disability: { type: DataTypes.ENUM('Yes', 'No'), allowNull: false },
  disability_details: { type: DataTypes.TEXT, allowNull: false },
  wajebaat_expenses: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  niyaz_expenses: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  sabeel_expenses: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  zyarat_expenses: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  ashara_expenses: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  qardanhasana: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  other_deeni_expenses: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  groceries_supplies: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  dineout_expense: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  essential_expense: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  doctor_expenses: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  dental_expenses: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  glass_expenses: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  meds_expenses: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  vacation_expenses: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  rent_expense: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  maintenance_expense: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  gas_expense: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  electricity_expense: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  mobile_expense: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  water_expense: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  cable_expense: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  internet_expense: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  clothing_expense: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  appliances_expense: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  other_expenses: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  property_assets: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  jewelry_Assets: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  transport_assets: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  other_assets: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, {
  tableName: "student_application",
  timestamps: false
});

// Base64 Tables (all fields required)
const HouseAssets = sequelize.define("HouseAssets", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  application_id: { type: DataTypes.INTEGER, allowNull: false },
  asset_name: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: "house_assets",
  timestamps: false
});

const EducationExpenses = sequelize.define("EducationExpenses", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  application_id: { type: DataTypes.INTEGER, allowNull: false },
  eduName: { type: DataTypes.STRING, allowNull: false },
  eduAge: { type: DataTypes.INTEGER, allowNull: false },
  eduInsName: { type: DataTypes.STRING, allowNull: false },
  eduSemClass: { type: DataTypes.STRING, allowNull: false },
  eduFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, {
  tableName: "education_expenses",
  timestamps: false
});

const DependentsExpense = sequelize.define("DependentsExpense", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  application_id: { type: DataTypes.INTEGER, allowNull: false },
  dependentName: { type: DataTypes.STRING, allowNull: false },
  dependentAge: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: "dependents_expense",
  timestamps: false
});

const TravellingExpense = sequelize.define("TravellingExpense", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  application_id: { type: DataTypes.INTEGER, allowNull: false },
  travelPlace: { type: DataTypes.STRING, allowNull: false },
  travelYear: { type: DataTypes.INTEGER, allowNull: false },
  travelPurpose: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: "travelling_expense",
  timestamps: false
});

const BusinessAssets = sequelize.define("BusinessAssets", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  application_id: { type: DataTypes.INTEGER, allowNull: false },
  businessAssetAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  businessAssetDesc: { type: DataTypes.TEXT, allowNull: false }
}, {
  tableName: "business_assets",
  timestamps: false
});

const QhLiability = sequelize.define("QhLiability", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  application_id: { type: DataTypes.INTEGER, allowNull: false },
  qhLiabilityITS: { type: DataTypes.STRING, allowNull: false },
  qhLiabilityPurpose: { type: DataTypes.STRING, allowNull: false },
  qhLiabilityAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, {
  tableName: "qh_liability",
  timestamps: false
});

const EnayatLiability = sequelize.define("EnayatLiability", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  application_id: { type: DataTypes.INTEGER, allowNull: false },
  enayatLiabilityITS: { type: DataTypes.STRING, allowNull: false },
  enayatLiabilityPurpose: { type: DataTypes.STRING, allowNull: false },
  enayatLiabilityAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  enayatLiabilityDate: { type: DataTypes.DATE, allowNull: false }
}, {
  tableName: "enayat_liability",
  timestamps: false
});

module.exports = {
  StudentApplication,
  HouseAssets,
  EducationExpenses,
  DependentsExpense,
  TravellingExpense,
  BusinessAssets,
  QhLiability,
  EnayatLiability
};