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
                            return res.redirect('/');
                        } else {
                            return res.redirect('/login');
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