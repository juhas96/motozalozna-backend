const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller.js');


router.get('/login', auth.login);

module.exports = router;