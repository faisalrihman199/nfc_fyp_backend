const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Tag extends Model {}

Tag.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    uid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Ensures the UID is unique
        validate: {
            notEmpty: true, // Ensures the UID is not empty
        },
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true,
        
    },
    information: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            // Ensure encrypted information is handled securely
            const encrypted = this.getDataValue('information');
            return encrypted ? decrypt(encrypted) : null; // Decrypt information if available
        },
        set(value) {
            if (value) {
                this.setDataValue('information', encrypt(value)); // Encrypt before saving
            }
        },
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active', // Default status is 'active'
        validate: {
            isIn: [['pending','waiting','active', 'inactive', 'expired']], // Restrict status to specific values
        },
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'customers', 
            key: 'id', 
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', 
    },
}, {
    sequelize,
    modelName: 'Tag',
    timestamps: true, // Adds createdAt and updatedAt fields
    paranoid: true, // Enables soft deletes with deletedAt field
});

module.exports = Tag;
