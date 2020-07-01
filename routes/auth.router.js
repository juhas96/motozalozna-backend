const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller.js');


router.post('/login', auth.login);
router.delete('/logout', auth.logout)
router.put('/forgot-password', auth.forgotPassword)

module.exports = router;