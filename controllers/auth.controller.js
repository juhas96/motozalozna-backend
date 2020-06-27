const User = require("../models/user.model");
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
    return jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30m'});
}

exports.login = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const accessToken = generateAccessToken(email);
    // const refreshToken = jwt.sign(email, process.env.REFRESH_TOKEN_SECRET);

    User.findAll({where: {email: email}})
        .then(user => {
            if (user.length > 0) {
                bcrypt.compare(password, user[0].password)
                    .then(result => {
                        if (result) {
                            setToken(res, refreshToken);
                            res.json({accessToken: accessToken})
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