const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Database connection
const User = require("./user.model"); // Import User model
const Module = require("./module.model"); // Import Module model

const Form = sequelize.define("Form", {
    form_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.CHAR(8),
        allowNull: false,
        references: {
            model: User,
            key: "its_id"
        },
        onDelete: "CASCADE"
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
    form_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    tableName: "forms",
    timestamps: true, // Adds created_at and updated_at
    createdAt: "created_at",
    updatedAt: "updated_at"
});

// ✅ Define Relationships
User.hasMany(Form, { foreignKey: "user_id", onDelete: "CASCADE" });
Module.hasMany(Form, { foreignKey: "module_id", onDelete: "CASCADE" });
Form.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });
Form.belongsTo(Module, { foreignKey: "module_id", onDelete: "CASCADE" });

module.exports = Form;