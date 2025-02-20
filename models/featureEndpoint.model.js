const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import DB connection
const Feature = require("./feature.model"); // Import Feature model

const FeatureEndpoint = sequelize.define("FeatureEndpoint", {
    endPointId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    feature_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Feature,
            key: "id"
        },
        onDelete: "CASCADE"
    },
    url_endpoint: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true 
    }
}, {
    tableName: "feature_endpoints",
    timestamps: false
});

// Define Foreign Key Association
Feature.hasMany(FeatureEndpoint, { foreignKey: "feature_id", onDelete: "CASCADE" });
FeatureEndpoint.belongsTo(Feature, { foreignKey: "feature_id", onDelete: "CASCADE" });

module.exports = FeatureEndpoint;