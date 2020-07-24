const Loan = require('../models/loan.model');
const loanMapper = require('../mapper/loan.mapper');
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
const stripe = require('stripe')(stripeSecretKey);
const Dinero = require('dinero.js');

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

    Loan.findAll({where: {userId: userId}}, {include: ['user']})
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
    let loanPrice = 0;
    let interestPrice = 0;
    let isPayed = false;

    stripe.charges.create({
        amount: price,
        source: 'tok_mastercard',
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
                    interestPrice = currentInterestPrice.getAmount();
                    Loan.update(
                        {interest: loan.interest},
                        {where: {id: loan.id}
                    })
                    .then(() => {
                            console.log('Successfully updated record with id: ' + loan.id);
                    })
                    .catch(err => {
                            console.log(err);
                    })
                } else if (userPayed.greaterThanOrEqual(currentInterestPrice)) {
                    // subtract userPayed by interest, rest subtract from loanPrice
                    userPayed = userPayed.subtract(currentInterestPrice);

                    currentInterestPrice = currentInterestPrice.subtract(Dinero({amount: currentInterestPrice.getAmount(), currency: 'EUR', precision: 2}));

                    currentLoanPrice = currentLoanPrice.subtract(userPayed);

                    // if currentLoanPrice == 0, loan is fully payed
                    if (currentLoanPrice.isZero()) {
                        loan.interest_paid = true;
                    }

                    // Save new loan object to DB, interest should equals to 0
                    loan.interest = 0;
                    loan.loan_price = currentLoanPrice.getAmount();
                    interestPrice = 0;
                    loanPrice = currentLoanPrice.getAmount()

                    Loan.update(
                        {interest: loan.interest, interest_paid: loan.interest_paid, loan_price: loan.loan_price},
                        {where: {id: loan.id}
                    })
                    .then(() => {
                            console.log('Successfully updated record with id: ' + loan.id);
                    })
                    .catch(err => {
                            console.log(err);
                    })

                    // TODO: consider to inform user with email
                    // TODO: return updated object
                }
            })
            .catch(err => {
                res.status(500).send({
                    message: err.message || 'Some error occurred while retrieving loan with ID: ' + loanId
                })
            })


        res.json(
            {
                message: 'Successfully charged',
                loanPrice: loanPrice,
                loanInterest: interestPrice,
                isPayed: isPayed
            }
        );
    })
    .catch(err => {
        res.status(500).send({
            message: err.message
        });
    })
};

// Update a Loan by the ID in the request
exports.update = (req, res) => {
    const id = req.headers.loan_id;
    Loan.findByPk(id)
        .then(loan => {
            Loan.update(req.body, {where: {id: loan.id}})
                .then(() => {
                    Loan.findByPk(id).then(result => {
                        res.status(200).send(result);
                    });
                })
                .catch(err => {
                    res.status(500).send({
                        message: err.message || 'Some error occurred while updating loan with ID: ' + id
                    })
                })
        })
        .catch(err => {
            res.status(404).send({
                message: err.message || 'Loan with ID: ' + id + ' was not found' 
            });
        })
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
