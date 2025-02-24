const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Database connection
const User = require("./user.model"); // Import User model
const FormField = require("./formField.model"); // Import FormField model
const owsReqForm = require("./owsReqForm.model"); // Import FormField model
const owsReqMas = require("./owsReqMas.model"); // Import FormField model


const FormFieldValue = sequelize.define("FormFieldValue", {
    value_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.CHAR(8),
        allowNull: false,
        references: {
            model: owsReqMas,
            key: "ITS"
        },
        onDelete: "CASCADE"
    },
    field_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: FormField,
            key: "field_id"
        },
        onDelete: "CASCADE"
    },
    req_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: owsReqForm,
            key: "reqId"
        },
        onDelete: "CASCADE"
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: "form_field_values",
    timestamps: true, 
    createdAt: "created_at",
    updatedAt: "updated_at"
});

// Define Relationships
owsReqMas.hasMany(FormFieldValue, { foreignKey: "user_id", onDelete: "CASCADE" });
FormField.hasMany(FormFieldValue, { foreignKey: "field_id", onDelete: "CASCADE" });
owsReqForm.hasMany(FormFieldValue, { foreignKey: "req_id", onDelete: "CASCADE" });

FormFieldValue.belongsTo(owsReqMas, { foreignKey: "user_id", onDelete: "CASCADE" });
FormFieldValue.belongsTo(FormField, { foreignKey: "field_id", onDelete: "CASCADE" });
FormFieldValue.belongsTo(owsReqForm, { foreignKey: "req_id", onDelete: "CASCADE" });

module.exports = FormFieldValue;