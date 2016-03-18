var User = require('../models/user');

exports.register = {
	get: function(req, res) {
		if (req.user) {
			return res.redirect('/');
		}
		res.render('user/register', { title: 'Register User' });
	},
	post: function(req, res, next) {
		req.assert('email', 'Please provide a valid email address.').isEmail();
		req.assert('password', 'Please enter a password of at least 8 characters.').len(8);
		req.assert('confirmPassword', 'Your passwords must match.').equals(req.body.password);

		var errors = req.validationErrors();

		if (errors) {
			req.flash('errors', errors);
			return res.redirect('/user/register');
		}

		var user = new User({
			email: req.body.email,
			password: req.body.password
		});

		User.findOne({ email: req.body.email }, function(err, existingUser) {
			if (existingUser) {
				req.flash('errors', { msg: 'A user with that email address already exists.  Please try another email address.'});
				return res.redirect('/user/register');
			}

			user.save(function(err) {
				if (err) {
					return next(new Error('There was an error creating the user in the database.  Please try again.'));
				}

				req.flash('success', { msg: 'User account successfully created.' });
				res.redirect('/');
			});
		});
	}
};