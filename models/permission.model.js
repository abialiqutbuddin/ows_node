const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import the database connection
const Module = require("./module.model");  // Import `modules`
const Feature = require("./feature.model"); // Import `features`

const Permission = sequelize.define("Permission", {
    its_id: {
        type: DataTypes.STRING(8),
        allowNull: false,
        primaryKey: true
    },
    module_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Module,
            key: "id"
        },
        onDelete: "CASCADE"
    },
    feature_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Feature,
            key: "id"
        },
        onDelete: "CASCADE"
    }
}, {
    tableName: "permissions",
    timestamps: false
});

// Define associations (Foreign Keys)
Module.hasMany(Permission, { foreignKey: "module_id", onDelete: "CASCADE" });
Feature.hasMany(Permission, { foreignKey: "feature_id", onDelete: "CASCADE" });
Permission.belongsTo(Module, { foreignKey: "module_id", onDelete: "CASCADE" });
Permission.belongsTo(Feature, { foreignKey: "feature_id", onDelete: "CASCADE" });

module.exports = Permission;