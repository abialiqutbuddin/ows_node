const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import database connection
const Module = require("./module.model");  // Import the `modules` model

const Feature = sequelize.define("Feature", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
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
    feature_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    tableName: "features",
    timestamps: false // No created_at or updated_at fields
});

// Define association (Foreign Key)
Module.hasMany(Feature, { foreignKey: "module_id", onDelete: "CASCADE" });
Feature.belongsTo(Module, { foreignKey: "module_id", onDelete: "CASCADE" });

module.exports = Feature;