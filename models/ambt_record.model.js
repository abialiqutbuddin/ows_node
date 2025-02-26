const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AmbtRecord = sequelize.define("AmbtRecord", {
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
    school: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    }
}, {
    tableName: "ambt_records",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
});

module.exports = AmbtRecord;