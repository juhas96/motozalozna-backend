// const db = require('../models');
// const User = db.users;

// // // Create and save User
// // exports.create = (req, res) => {

// // };

// // Find All users
// exports.findAll = (req, res) => {
//     User.findAll()
//         .then(data => {
//             res.send(data);
//         })
//         .catch(err => {
//             res.status(500).send({
//                 message: err.message || 'Some error occurred while retrieving Users.'
//             });
//         });
// };

// // Find a single User with an ID
// exports.findOne = (req, res) => {
//     const id = req.params.id;

//     User.findByPk(id)
//         .then(data => {
//             res.send(data);
//         })
//         .catch(err => {
//             res.status(500).send({
//                 message: 'Error retrieving User with id=' + id
//             });
//         });
// };