const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const EnayatSchedule = sequelize.define("EnayatSchedule", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  application_id: { type: DataTypes.INTEGER, allowNull: false },
  enayat_date: { type: DataTypes.DATE, allowNull: false },
  enayat_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false }
}, {
  tableName: "enayat_schedules",
  timestamps: false
});

module.exports = EnayatSchedule;
