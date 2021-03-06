const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const User = sequelize.define('user', {
    first_name: {
        type: Sequelize.STRING
    },
    last_name: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
    phone_number: {
        type: Sequelize.STRING
    },
    resetPasswordToken: {
        type: Sequelize.STRING
    },
    resetPasswordExpires: {
        type: Sequelize.DATE
    },
    isAdmin: {
        type: Sequelize.BOOLEAN
    }
}, {
});

module.exports = User;