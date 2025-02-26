const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AiutRecord = sequelize.define("AiutRecord", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    org: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    mohalla: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    its: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    sf: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    student: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    father: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    school: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    parents_p: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    org_p: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    }
}, {
    tableName: "aiut_records",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
});

module.exports = AiutRecord;