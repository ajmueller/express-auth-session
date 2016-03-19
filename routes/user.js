var express = require('express');
var router = express.Router();
var userController = require('../controllers/user');
var utility = require('../lib/utility');

router.get('/login', userController.login.get);
router.post('/login', userController.login.post);
router.get('/logout', userController.logout.get);
router.get('/register', userController.register.get);
router.post('/register', userController.register.post);
router.get('/verify/:verificationToken', userController.verify.get);
router.get('/verify-resend/:email?', userController.verifyResend.get);
router.post('/verify-resend', userController.verifyResend.post);

module.exports = router;