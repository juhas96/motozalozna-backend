const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Loan = sequelize.define('loan', {
    loan_until: {
        type: Sequelize.DATE
    },
    loan_price: {
        type: Sequelize.DECIMAL
    },
    loan_length: {
        type: Sequelize.STRING
    },
    interest_paid: {
        type: Sequelize.BOOLEAN
    },
    car_bodywork_type: {
        type: Sequelize.STRING
    },
    car_fuel_type: {
        type: Sequelize.STRING
    },
    car_axle_type: {
        type: Sequelize.STRING
    },
    car_gearbox_type: {
        type: Sequelize.STRING
    },
    car_power: {
        type: Sequelize.INTEGER
    },
    car_years_old: {
        type: Sequelize.INTEGER
    },
    car_ecv: {
        type: Sequelize.STRING
    },
    car_km: {
        type: Sequelize.INTEGER
    },
    car_damaged_varnish: {
        type: Sequelize.BOOLEAN
    },
    car_damaged_bodywork: {
        type: Sequelize.BOOLEAN
    },
    car_damaged_axle: {
        type: Sequelize.BOOLEAN
    },
    car_damaged_interior: {
        type: Sequelize.BOOLEAN
    },
    car_damaged_tires: {
        type: Sequelize.BOOLEAN
    },
    car_damaged_window: {
        type: Sequelize.BOOLEAN
    },
    car_price: {
        type: Sequelize.DECIMAL
    },
    interest: {
        type: Sequelize.DECIMAL
    }
});

module.exports = Loan;