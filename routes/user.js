var express = require('express');
var router = express.Router();
var userController = require('../controllers/user');

router.get('/register', userController.register.get);
router.post('/register', userController.register.post);

module.exports = router;