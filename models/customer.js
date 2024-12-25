const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Customer extends Model {}

Customer.init({
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true, // Ensures the field is not empty
        },
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Ensures no duplicate phone numbers
        validate: {
            is: /^[\d\s\-+()]*$/, // Allows numbers, spaces, and some common phone symbols
        },
    },
    address: {
        type: DataTypes.TEXT, // Use TEXT for longer addresses
        allowNull: true, // Address is optional
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active', // Default status is 'active'
        validate: {
            isIn: [['active', 'inactive', 'banned']], // Restrict status to specific values
        },
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // Name of the referenced table
            key: 'id', // Primary key in the referenced table
        },
        onUpdate: 'CASCADE', // Updates foreign key on referenced table changes
        onDelete: 'CASCADE', // Deletes associated customer if the user is deleted
    },
}, {
    sequelize,
    modelName: 'Customer',
    timestamps: true, // Adds createdAt and updatedAt fields
    paranoid: true, // Enables soft deletes with deletedAt field
});

module.exports = Customer;
