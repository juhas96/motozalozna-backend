const Loan = require('../models/loan.model');
const loanMapper = require('../mapper/loan.mapper');
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
const stripe = require('stripe')(stripeSecretKey);
const Dinero = require('dinero.js');

// Create and save Loan
// Create endpoint is not needed
// exports.create = (req, res) => {

// };

// Retrieve all Loans from database
exports.findAll = (req, res) => {
    Loan.findAll({
        include: ['user']
    }).then(data => {
        res.send(data);
    }).catch(err => {
        res.status(500).send({
            message:
                err.message || 'Some error occurred while retrieving Loans.'
        });
    });
    
};

// Find a single Loan with an ID
exports.findOne = (req, res) => {
    const id = req.params.id;

    Loan.findByPk(id, {include: ['user']})
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: 'Error retrieving Loan with id=' + id
            });
        });
};

// Find all Loans with UserId in request
exports.findAllByUserId = (req, res) => {
    const userId = req.headers.user_id;
    console.log(req.headers);

    Loan.findAll({where: {userId: userId}})
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || 'Some error occurred while retrieving Loans'
            });
        });
};

exports.pay = (req, res) => {
    const price = req.body.price;
    const loanId = req.body.loanId;

    stripe.charges.create({
        amount: price,
        source: req.body.stripeTokenId,
        currency: 'eur'
    })
    .then( () => {
        Loan.findByPk(loanId)
            .then(loan => {
                let currentLoanPrice = Dinero({amount: loan.loan_price, currency: 'EUR', precision: 2});
                let currentInterestPrice = Dinero({amount: loan.interest, currency: 'EUR', precision: 2});
                let userPayed = Dinero({amount: price, currency: 'EUR', precision: 2});

                // 1.step -> deduct interest
                // 2.step -> deduct loan price

                if (userPayed.lessThan(currentInterestPrice)) {
                    currentInterestPrice = currentInterestPrice.subtract(userPayed);
                    loan.interest = currentInterestPrice.getAmount();
                    // Save new interest to DB
                } else if (userPayed.greaterThanOrEqual(currentInterestPrice)) {
                    // subtract userPayed by interest, rest subtract from loanPrice
                    userPayed = userPayed.subtract(currentInterestPrice);

                    currentInterestPrice = currentInterestPrice.subtract(Dinero({amount: currentInterestPrice.getAmount(), currency: 'EUR', precision: 2}));
                    // Save new interest to DB, should equals to 0

                    currentLoanPrice = currentLoanPrice.subtract(userPayed);

                    // Save new currentLoanPrice to DB, test if is >= 0

                    if (currentLoanPrice.isZero()) {
                        loan.interest_paid = true;
                    }

                    loan.interest = 0;
                    loan.loan_price = currentLoanPrice.getAmount();
                }


            })
            .catch(err => {
                res.status(500).send({
                    message: err.message || 'Some error occurred while retrieving loan with ID: ' + loanId
                })
            })


        res.json({message: 'Successfully charged'});
    })
    .catch(err => {
        res.status(500).send({
            message: err.message
        });
    })
};

// Update a Loan by the ID in the request
exports.update = (req, res) => {

}

// Delete a Loan by specified ID in the request
exports.delete = (req, res) => {
    const id = req.params.id;

    Loan.destroy({
        where: {id: id}
    }).then(num => {
        if (num == 1) {
            res.send({
                message: 'Loan was successfully deleted.'
            });
        } else {
            res.send({
                message: `Cannot delete Loan with id=${id}. Maybe Loan was not found.`
            });
        }
    }).catch(err => {
        res.status(500).send({
            message: 'Could not delete Loan with id=' + id
        });
    });
};
