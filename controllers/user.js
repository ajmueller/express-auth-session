var User = require('../models/user');
var utility = require('../lib/utility');

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

		var verificationToken = utility.createRandomToken(req.body.email);
		var user = new User({
			email: req.body.email,
			password: req.body.password,
			verificationToken: verificationToken,
			isVerified: false
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

				utility.sendEmail(req.body.email, 'ajmueller6@gmail.com', 'Email Verification Required', '<p>Before you can log in, you must verify your email address:</p><a href="' + req.protocol + '://' + req.get('host') + '/user/verify/' + verificationToken + '">Verify your email address</a>', 'html', function(err, json) {
					if (err) {
						return next(new Error('There was an error sending your verification email.  Please try again.'));
					}

					req.flash('info', { msg: 'Your account has been created, but you must verify your email before logging in.'});
					res.redirect('/');
				});
			});
		});
	}
};

exports.verify = {
	get: function(req, res) {
		if (req.user) {
			return res.redirect('/');
		}

		User.findOneAndUpdate({ verificationToken: req.params.verificationToken }, { isVerified: true }, function(err, user) {
			if (err) {
				return next(new Error('There was an error verifying your email address.'));
			}

			req.flash('success', { msg: 'Your email address has been verified.  You may now log in.' });
			res.redirect('/');
		});
	}
};