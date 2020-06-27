const User = require("../models/user.model");

exports.login = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    User.findAll({where: {email: email}})
        .then(user => {
            if (user.length > 0) {
                bcrypt.compareSync(password, user.password)
                    .then(result => {
                        if (result) {
                            return res.status(200).send({
                                message: 'Login success'
                            })
                        } else {
                            return res.status(500).send({
                                message: 'Cannot log in'
                            })
                        }
                    })
            } else {
                console.log('user not found');
            }
        })
        .catch(err => {
            console.log(err);
        })
}