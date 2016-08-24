var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	var title = 'Welcome';

	if (req.isAuthenticated()) {
		title += ' Back';
	}

	res.render('index', { title: title });
});

module.exports = router;
