const express = require('express');
const router = express.Router();
const loans = require('../controllers/loan.controller.js');

router.get('/', loans.findAll);
router.get('/by_user', loans.findAllByUserId);

// Handle payments
router.get('/pay', loans.pay);

module.exports = router;