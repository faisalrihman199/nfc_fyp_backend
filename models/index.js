const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Import your models
const User = require('./user');
const Customer = require('./customer');
const Tag = require('./tag');

const models = {
    User,
    Customer,
    Tag
};

// Initialize models with paranoid enabled
Object.keys(models).forEach(modelName => {
    const model = models[modelName];
    model.init({
        ...model.rawAttributes
    }, {
        sequelize,
        paranoid: true, 
        modelName: modelName
    });

    if ('associate' in model) {
        model.associate(models);
    }
});

User.hasOne(Customer, { foreignKey: 'userId' });
Customer.belongsTo(User, { foreignKey: 'userId' });

Customer.hasMany(Tag, { foreignKey: 'customerId', as: 'tag' });
Tag.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

sequelize.sync({ alter: true }).then(() => {
    console.log("All models were synchronized successfully.");
}).catch(err => {
    console.error("An error occurred while creating the tables:", err);
});

module.exports = {
    ...models,
    sequelize
};
