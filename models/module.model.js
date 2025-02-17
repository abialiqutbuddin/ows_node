const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import the database connection

const Module = sequelize.define("Module", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    module_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    }
}, {
    tableName: "modules",
    timestamps: false // No created_at or updated_at fields
});

module.exports = Module;