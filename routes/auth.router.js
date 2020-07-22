const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller.js');


router.post('/login', auth.login);
router.delete('/logout', auth.logout);
router.post('/forgot-password', auth.forgotPassword);
router.post('/forgot-password/:token', auth.resetPassword);


module.exports = router;