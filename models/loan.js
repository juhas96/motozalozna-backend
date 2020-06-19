const Sequelize = require('sequelize');
const db = require('../config/database');

const loan = db.define('loans', {
    loan_until: {
        type: Sequelize.DATE
    },
    loan_price: {
        type: Sequelize.NUMBER
    },
    interest_paid: {
        type: Sequelize.BOOLEAN
    },

});

module.exports = loan;
