const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); 
const Module = require("./module.model");  
const Feature = require("./feature.model"); 
const User = require("./user.model"); 


const Permission = sequelize.define("Permission", {
    permission_id:{ 
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    its_id: {
        type: DataTypes.STRING(8),
        allowNull: false,
        references: {
            model: User,
            key: "its_id"
        }
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

Module.hasMany(Permission, { foreignKey: "module_id", onDelete: "CASCADE" });
Feature.hasMany(Permission, { foreignKey: "feature_id", onDelete: "CASCADE" });
User.hasMany(Permission, {foreignKey: "its_id",onDelete: "CASCADE"});
Permission.belongsTo(Module, { foreignKey: "module_id", onDelete: "CASCADE" });
Permission.belongsTo(Feature, { foreignKey: "feature_id", onDelete: "CASCADE" });

module.exports = Permission;