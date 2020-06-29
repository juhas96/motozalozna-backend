const Loan = require('../models/loan.model');
const loanMapper = require('../mapper/loan.mapper');

exports.updateLoans = () => {
    Loan.findAll({where: {interest_paid: false}})
        .then(loans => {
            loans.map(loan => {
                if (loan.loan_until.getTime() > new Date().getTime()) {
                    // Count new interest from remaining loan_price
                    loan.interest += loanMapper.countInterest(loan.loan_price.toString(), loanMapper.countInterestPercentage(loan.loan_length.toString(), loan.established_law.toString()))

                    // Add weeks to loan_until
                    loan.loan_until = loanMapper.mapDateFromLoanLength(loan.loan_length);

                    // TODO save updated loans to DB
                }
            });
        })
        .catch(err => {
            console.log(err);
        })
}