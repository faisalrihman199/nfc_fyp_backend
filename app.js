const express = require('express');
const app = express();
const routes = require('./routes');
const { sequelize } = require('./models');
var cors = require("cors")
// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Use routes

app.use(cors());
app.use('/api', routes);

// Database connection
sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});

module.exports = app; // Export the app instance
