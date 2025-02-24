const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
    its_id: {
        type: DataTypes.CHAR(20),
        allowNull: false,
        primaryKey: true,
        unique: true
    },
    role: {
        type: DataTypes.ENUM("admin", "mini-admin", "user"),
        defaultValue: "user"
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    mohalla:{
        type: DataTypes.STRING(255),
        allowNull: false
    },
    umoor:{
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
});

module.exports = User;