const User = require("../models/user.model");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// require('dotenv').config();
const crypto = require('crypto');
const async = require('async');
const utils = require('../utils/utils');

const setToken = (res, refreshToken) =>
    res.cookie('token', refreshToken, {
        secure: true,
        sameSite: true,
        httpOnly: true,
    });

const clearToken = res =>
    res.clearCookie('token', {
        secure: true,
        sameSite: true,
        httpOnly: true,
    });


exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(token == null) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        next();
    });
}

function generateAccessToken(userEmail) {
    return jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET)
}

exports.forgotPassword = (req, res) => {
    async.waterfall([
        (done) => {
            crypto.randomBytes(20, (err, buf) => {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        (token, done) => {
            User.findOne({where: {email: req.body.email}})
                .then(singleUser => {
                    if (!singleUser) {
                        console.log('USER NOT FOUND');
                    }
                    let values = {
                        resetPasswordToken: token,
                        resetPasswordExpires: Date.now() + 3600000 // 1 hour
                    }
                    singleUser.update(values)
                        .then(updatedRecord => {
                            done(null, token, updatedRecord);
                        })
                })
                .catch(err => {
                    console.log(err);
                    done(err,null,null);
                });
        },
        (token, user, done) => {
            utils.sendResetEmail(user.email, 'Zmena hesla - Motozalozna.sk', token, req.headers.host);
            res.status(200).send({
                message: 'Email for change password was sended'
            })
        }
    ])
}

exports.resetPassword = (req, res) => {
    async.waterfall([
        (done) => {
            User.findOne({where: {resetPasswordToken: req.params.token.split('token=')[1]}})
                .then(singleUser => {
                    console.log()
                    if (singleUser) {
                        if (req.body.password == req.body.confirm) {
                            let values = {
                                password: bcrypt.hashSync(req.body.password, 10),
                                resetPasswordToken: undefined,
                                resetPasswordExpires: undefined
                            }
                            singleUser.update(values)
                                .then(updatedRecord => {
                                    done(null, updatedRecord);
                                })
                                .catch(err => {
                                    done(err, null);
                                })
                        }
                    } else {
                        res.status(403).send({
                            message: 'Password reset token is invalid or has expired.'
                        });
                    }
                })
        },
        (user, done) => {
            utils.sendConfirmResetEmail(user.email, 'Vaše heslo bolo zmenené - Motozalozna.sk');
            res.status(200).send('Password successfully changed');
        }
    ])
}

exports.login = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log(email)
    const accessToken = generateAccessToken(email)
    // const refreshToken = jwt.sign(email, process.env.REFRESH_TOKEN_SECRET);

    User.findAll({where: {email: email}})
        .then(user => {
            if (user.length > 0) {
                bcrypt.compare(password, user[0].password)
                    .then(result => {
                        if (result) {
                            setToken(res, accessToken);
                            res.json({token: accessToken, userId: user[0].id})
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

exports.logout = (req, res) => {
    clearToken(res);
    res.sendStatus(204);
}