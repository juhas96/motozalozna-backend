var express = require('express');
var router = express.Router();

// Database
const db = require('../config/database');

// Model
const loan = require('../models/loan');

// DB Test
db.authenticate()
    .then(() => console.log('Database connected'))
    .catch(err => console.log('Error: ' + err));

// TODO: Create models by EXTENDS MODEL
router.get('/loan/by_user/:id', (req, res) => {
    //req.params.id
});

// Get ALL loans
router.get('/', (req, res) => {
    loan.findAll()
        .then(loans => {
            console.log(loans);
            res.send(loans).status(200);
        })
        .catch(err => {
            console.log(err)
            res.sendStatus(500);
        });
});

module.exports = router;