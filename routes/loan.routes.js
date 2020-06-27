// module.exports = app => {
//     const loans = require('../controllers/loan.controller.js');
//     var express = require('express');
//     const router = express.Router();

//     // Create and save Loan
//     // router.post('/', loans.create);

//     // Retrieve all Loans from database
//     router.get('/', loans.findAll);

//     // Find a single Loan with an ID
//     router.get('/:id', loans.findOne); 

//     // Find all Loans with UserId in request
//     router.get('/by_user', loans.findAllByUserId);

//     // Update a Loan by the ID in the request
//     router.put('/:id', loans.update);

//     // Delete a Loan by specified ID in the request
//     router.delete('/:id', loans.delete);

//     app.use('/api/loans', router);
// }

const express = require('express');
const router = express.Router();
const loans = require('../controllers/loan.controller.js');

router.get('/', loans.findAll);
router.get('/by_user', loans.findAllByUserId);

// Handle payments
router.get('/pay', loans.pay);

module.exports = router;