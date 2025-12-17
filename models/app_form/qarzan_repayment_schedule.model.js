const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const QarzanRepaymentSchedule = sequelize.define("QarzanRepaymentSchedule", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    application_id: { type: DataTypes.INTEGER, allowNull: false },
    repay_date: { type: DataTypes.DATE, allowNull: false },
    repay_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false }
}, {
    tableName: "qarzan_repayment_schedules",
    timestamps: false
});

module.exports = QarzanRepaymentSchedule;
