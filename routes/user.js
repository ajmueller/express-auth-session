var express = require('express');
var router = express.Router();
var userController = require('../controllers/user');
var utility = require('../lib/utility');

router.get('/register', userController.register.get);
router.post('/register', userController.register.post);
router.get('/verify/:verificationToken', userController.verify.get);

module.exports = router;