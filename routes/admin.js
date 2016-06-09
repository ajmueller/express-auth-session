var express = require('express');
var router = express.Router();
var adminController = require('../controllers/admin');
var userController = require('../controllers/user');
var acl = require('../authorization').getAcl();

// protected URLs
router.get('/list', acl.middleware(2, userController.getUserId), adminController.list.get);

module.exports = router;