const Loan = require('../models/loan.model');
const loanMapper = require('../mapper/loan.mapper');

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

    Loan.findByPk(id)
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
