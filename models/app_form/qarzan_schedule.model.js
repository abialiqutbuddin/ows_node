const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const QarzanSchedule = sequelize.define("QarzanSchedule", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    application_id: { type: DataTypes.INTEGER, allowNull: false },
    qarzan_date: { type: DataTypes.DATE, allowNull: false },
    qarzan_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false }
}, {
    tableName: "qarzan_schedules",
    timestamps: false
});

module.exports = QarzanSchedule;
