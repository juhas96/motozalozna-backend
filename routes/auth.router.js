const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller.js');


router.post('/login', auth.login);
router.delete('/logout', auth.logout)

module.exports = router;