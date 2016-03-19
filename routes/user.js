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
router.get('/forgot-password', userController.forgotPassword.get);
router.post('/forgot-password', userController.forgotPassword.post);
router.get('/reset-password/:passwordResetToken', userController.resetPassword.get);
router.post('/reset-password/:passwordResetToken', userController.resetPassword.post);

module.exports = router;