const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Database connection
const Form = require("./forms.model"); // Import Form model

const FormField = sequelize.define("FormField", {
    field_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    form_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Form,
            key: "form_id"
        },
        onDelete: "CASCADE"
    },
    label: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM("text", "number", "date", "dropdown", "checkbox", "radio", "textarea"),
        allowNull: false
    },
    dropdown_list: {
        type: DataTypes.JSON, // Stores an array of dropdown values
        allowNull: true,
        defaultValue: [] // Empty array by default
    }
}, {
    tableName: "form_fields",
    timestamps: true, // Adds created_at and updated_at
    createdAt: "created_at",
    updatedAt: "updated_at"
});

// ✅ Define Relationship
Form.hasMany(FormField, { foreignKey: "form_id", onDelete: "CASCADE" });
FormField.belongsTo(Form, { foreignKey: "form_id", onDelete: "CASCADE" });

module.exports = FormField;