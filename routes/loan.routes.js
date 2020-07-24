const express = require('express');
const router = express.Router();
const loans = require('../controllers/loan.controller.js');

router.get('/', loans.findAll);
router.get('/by_user', loans.findAllByUserId);
router.get('/:id', loans.findOne);
router.put('/', loans.update);
router.put('/update_price', loans.updateLoanPrice)

// Handle payments
router.post('/pay', loans.pay);

module.exports = router;