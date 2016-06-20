var express = require('express');
var router = express.Router();
var userController = require('../controllers/user');
var authentication = require('../authentication');
var acl = require('../authorization').getAcl();

router.get('/login', userController.login.get);
router.post('/login', userController.login.post);
router.get('/register', userController.register.get);
router.post('/register', userController.register.post);
router.get('/verify/:verificationToken', userController.verify.get);
router.get('/verify-resend/:email?', userController.verifyResend.get);
router.post('/verify-resend', userController.verifyResend.post);
router.get('/forgot-password', userController.forgotPassword.get);
router.post('/forgot-password', userController.forgotPassword.post);
router.get('/reset-password/:passwordResetToken', userController.resetPassword.get);
router.post('/reset-password/:passwordResetToken', userController.resetPassword.post);

// protected URLs
router.get('/change-password', authentication.isAuthenticated, userController.changePassword.get);
router.post('/change-password', authentication.isAuthenticated, userController.changePassword.post);
router.get('/logout', authentication.isAuthenticated, userController.logout.get);
router.get('/list', acl.middleware(2, userController.getUserId), userController.list.get);

module.exports = router;