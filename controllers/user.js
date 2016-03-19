var User = require('../models/user');
var utility = require('../lib/utility');
var passport = require('passport');

exports.login = {
	get: function(req, res) {
		if (req.user) {
			return res.redirect('/');
		}

		res.render('user/login', { title: 'User Login' });
	},
	post: function(req, res, next) {
		req.assert('email', 'Please provide a valid email address.').isEmail();
		req.assert('password', 'Password cannot be blank.').notEmpty();

		var errors = req.validationErrors();

		if (errors) {
			req.flash('errors', errors);
			return res.redirect('/user/login');
		}

		passport.authenticate('local', function(err, user, info) {
			if (err) {
				return next(err);
			}

			if (!user) {
				req.flash('errors', info);
				return res.redirect('/user/login');
			}

			req.logIn(user, function(err) {
				if (err) {
					return next(err);
				}

				req.flash('info', { msg: 'You have successfully logged in.' });
				res.redirect('/');
			});
		})(req, res, next);
	}
};

exports.logout = {
	get: function(req, res) {
		req.logout();
		req.flash('info', { msg: 'You have successfully logged out.' });
		res.redirect('/');
	}
};

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
				req.flash('errors', { msg: 'A user with that email address already exists.  Please try another email address.' });
				return res.redirect('/user/register');
			}

			user.save(function(err) {
				if (err) {
					console.log(err);
					req.flash('errors', { msg: 'There was an error creating the user in the database.  Please try again.' });
					return res.redirect('/user/register');
				}

				utility.sendEmail(req.body.email, 'ajmueller6@gmail.com', 'Email Verification Required', '<p>Before you can log in, you must verify your email address:</p><a href="' + utility.constructUrl(req, '/user/verify/' + verificationToken) + '">Verify your email address</a>', 'html', function(err, json) {
					if (err) {
						console.log(err);
						req.flash('errors', { msg: 'There was an error sending your verification email.  Please try again.' });
						return res.redirect('/');
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
				console.log(err);
				req.flash('errors', { msg: 'There was an error verifying your email address.' });
				return res.redirect('/');
			}

			req.flash('success', { msg: 'Your email address has been verified.  You may now log in.' });
			res.redirect('/user/login');
		});
	}
};

exports.verifyResend = {
	resendEmail: function(req, res, email) {
		var verificationToken = utility.createRandomToken(req.body.email);

		User.findOneAndUpdate({ email: email }, { verificationToken: verificationToken }, function(err, user) {
			if (err) {
				console.log(err);
				req.flash('errors', { msg: 'There was an error retrieving user information from the database.  Please try again.' });
				return res.redirect('/user/verify-resend');
			}

			if (!user) {
				req.flash('errors', { msg: 'No user with that email address exists.  Please try another email address.' });
				return res.redirect('/user/verify-resend');
			}

			if (user.isVerified) {
				req.flash('info', { msg: 'Your email address has already been verified.  Please log in.' });
				return res.redirect('/user/login');
			}

			utility.sendEmail(email, 'ajmueller6@gmail.com', 'Email Verification Required', '<p>You have requested a new verification email.  Before you can log in, you must verify your email address:</p><a href="' + utility.constructUrl(req, '/user/verify/' + verificationToken) + '">Verify your email address</a>', 'html', function(err, json) {
					if (err) {
						console.log(err);
						req.flash('errors', { msg: 'There was an error sending your verification email.  Please try again.' });
						return res.redirect('/user/verify-resend');
					}

					req.flash('info', { msg: 'Check your inbox for the new verification email.'});
					res.redirect('/user/login');
				});
		});
	},
	get: function(req, res) {
		if (req.user) {
			return res.redirect('/');
		}

		if (req.params.email) {
			exports.verifyResend.resendEmail(req, res, req.params.email);
		}
		else {
			res.render('user/verify-resend', { title: 'Re-Send Verification Email' });
		}
	},
	post: function(req, res) {
		req.assert('email', 'Please provide a valid email address.').isEmail();

		var errors = req.validationErrors();

		if (errors) {
			req.flash('errors', errors);
			return res.redirect('/user/login');
		}

		exports.verifyResend.resendEmail(req, res, req.body.email);
	}
};