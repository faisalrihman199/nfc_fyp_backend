const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true, // Validate that the value is a valid email format
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "customer", 
        validate: {
            isIn: [["customer", "admin", "manager"]], 
        },
    },
}, {
    timestamps: true, 
});

module.exports = User;
