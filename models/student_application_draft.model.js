const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust path if needed

const StudentApplicationDraft = sequelize.define('student_application_draft', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // Housing Info
  assets_base64: DataTypes.TEXT('long'),
  house_title: DataTypes.STRING,
  area: DataTypes.STRING,
  neighborhood: DataTypes.STRING,
  personalBank: DataTypes.ENUM('Yes', 'No'),
  goesMadrasa: DataTypes.ENUM('Yes', 'No'),
  khidmat_current: DataTypes.STRING,
  khidmat_intent: DataTypes.STRING,

  // Financial
  self_earning: DataTypes.DECIMAL(10, 2),

  // Nutrition & Health
  taking_fmb: DataTypes.STRING,
  fmb_quantity_sufficient: DataTypes.STRING,
  height: DataTypes.DECIMAL(5, 2),
  weight: DataTypes.DECIMAL(5, 2),
  sports: DataTypes.ENUM('Yes', 'No'),
  sports_physical_activities_base64: DataTypes.TEXT('long'),

  // Work Info (Repeatables)
  fatherOccupationInfo_base64: DataTypes.TEXT('long'),
  motherOccupationInfo_base64: DataTypes.TEXT('long'),

  // Health Info
  physically_mentally_challenged: DataTypes.ENUM('Yes', 'No'),
  vaccination_status: DataTypes.ENUM('Yes', 'No'),
  chronic_illness: DataTypes.ENUM('Yes', 'No'),
  disease_details: DataTypes.TEXT,
  family_member_disability: DataTypes.ENUM('Yes', 'No'),
  disability_details: DataTypes.TEXT,

  // Financials
  family_member_working: DataTypes.ENUM('Yes', 'No'),
  working_details: DataTypes.TEXT,
  offers_sila_vajebaat: DataTypes.ENUM('Yes', 'No'),
  wajebaat_expenses: DataTypes.DECIMAL(10, 2),
  niyaz_expenses: DataTypes.DECIMAL(10, 2),
  sabeel_expenses: DataTypes.DECIMAL(10, 2),
  zyarat_expenses: DataTypes.DECIMAL(10, 2),
  ashara_expenses: DataTypes.DECIMAL(10, 2),
  qardanhasana: DataTypes.DECIMAL(10, 2),
  other_deeni_expenses: DataTypes.DECIMAL(10, 2),

  jewelry_assets: DataTypes.DECIMAL(10, 2),
  transport_assets: DataTypes.DECIMAL(10, 2),
  other_assets  : DataTypes.DECIMAL(10, 2),
  property_assets : DataTypes.DECIMAL(10, 2),

  // Expenses
  groceries_supplies: DataTypes.DECIMAL(10, 2),
  dineout_expense: DataTypes.DECIMAL(10, 2),
  essential_expense: DataTypes.DECIMAL(10, 2),

  doctor_expenses: DataTypes.DECIMAL(10, 2),
  dental_expenses: DataTypes.DECIMAL(10, 2),
  glass_expenses: DataTypes.DECIMAL(10, 2),
  meds_expenses: DataTypes.DECIMAL(10, 2),
  vacation_expenses: DataTypes.DECIMAL(10, 2),

  rent_expense: DataTypes.DECIMAL(10, 2),
  maintenance_expense: DataTypes.DECIMAL(10, 2),
  gas_expense: DataTypes.DECIMAL(10, 2),
  electricity_expense: DataTypes.DECIMAL(10, 2),
  mobile_expense: DataTypes.DECIMAL(10, 2),
  water_expense: DataTypes.DECIMAL(10, 2),
  cable_expense: DataTypes.DECIMAL(10, 2),
  internet_expense: DataTypes.DECIMAL(10, 2),
  clothing_expense: DataTypes.DECIMAL(10, 2),
  appliances_expense: DataTypes.DECIMAL(10, 2),
  other_expenses: DataTypes.DECIMAL(10, 2),
  fuel_conveyance_expenses: DataTypes.DECIMAL(10, 2),

  // Repeatables - Base64 Encoded
  education_expenses_base64: DataTypes.TEXT('long'),
  dependents_base64: DataTypes.TEXT('long'),
  travelling_expense_base64: DataTypes.TEXT('long'),
  business_assets_base64: DataTypes.TEXT('long'),
  qh_liability_base64: DataTypes.TEXT('long'),
  enayat_liability_base64: DataTypes.TEXT('long'),
  income_types_base64: DataTypes.TEXT('long'),

}, {
  timestamps: false,
  tableName: 'student_application_draft',
});

module.exports = StudentApplicationDraft;