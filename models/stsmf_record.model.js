const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const StsmfRecord = sequelize.define("StsmfRecord", {
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
    amount: {
        type: DataTypes.DECIMAL(15,2),
        allowNull: false
    }
}, {
    tableName: "stsmf_records",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
});

module.exports = StsmfRecord;