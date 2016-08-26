var User = require('../models/user');
var utility = require('../lib/utility');
var passport = require('passport');
var moment = require('moment-timezone');
var config = require('../config');

exports.changePassword = {
	get: function(req, res) {
		res.render('user/change-password', { title: 'Change Password', minimumPasswordLength: config.login.minimumPasswordLength, csrf: req.csrfToken() });
	},
	post: function(req, res, next) {
		req.assert('password', 'Please enter a password of at least ' + config.login.minimumPasswordLength + ' characters.').len(config.login.minimumPasswordLength);
		req.assert('confirmPassword', 'Your passwords must match.').equals(req.body.password);

		var errors = req.validationErrors();

		if (errors) {
			req.flash('errors', errors);
			return res.redirect('back');
		}

		User.findOne({ email: req.user.email }, function(err, user) {
			if (err) {
				console.log(err);
				req.flash('errors', { msg: 'There was an error retrieving your user data from the database.  Please try again.' });
				return res.redirect('back');
			}

			user.password = req.body.password;

			user.save(function(err) {
				if (err) {
					console.log(err);
					req.flash('errors', { msg: 'There was an error updating your password in the database.  Please try again.' });
					return res.redirect('back');
				}

				req.flash('success', { msg: 'Your password has been successfully updated.' });
				res.redirect('/');
			});
		});
	}
};

exports.forgotPassword = {
	get: function(req, res) {
		if (req.isAuthenticated()) {
			return res.redirect('/');
		}

		res.render('user/forgot-password', { title: 'Forgot Password', csrf: req.csrfToken() });
	},
	post: function(req, res, next) {
		req.assert('email', 'Please provide a valid email address.').isEmail();

		var errors = req.validationErrors();

		if (errors) {
			req.flash('errors', errors);
			return res.redirect('/user/forgot-password');
		}

		var passwordResetToken = utility.createRandomToken();
		var passwordResetExpires = moment().add(config.login.passwordResetTimeLimitInHours, 'hours').tz(config.server.timezone);

		User.findOneAndUpdate({ email: req.body.email }, { passwordResetToken: passwordResetToken, passwordResetExpires: passwordResetExpires }, function(err, user) {
			if (err) {
				console.log(err);
				req.flash('errors', { msg: 'There was an error setting your password reset token.  Please try again.' });
				return res.redirect('/user/forgot-password');
			}

			utility.sendEmail(req.body.email, config.email.sendFrom, 'Password Reset Requested', '<p>You are receiving this email because you requested a password reset.  You have until ' + passwordResetExpires.format('LT z') + ' to reset your password.  You may ignore this email and your password will remain unchanged.</p><a href="' + utility.constructUrl(req, '/user/reset-password/' + passwordResetToken) + '">Reset your password</a>', 'text/html', function(err, response) {
					if (err) {
						console.log(err);
						req.flash('errors', { msg: 'There was an error sending your password reset email.  Please try again.' });
						return res.redirect('/user/forgot-password');
					}

					req.flash('info', { msg: 'A password reset email has been sent to <em>' + req.body.email + '</em> with further instructions.' });
					res.redirect('/');
				});
		});
	}
};

exports.list = {
	get: function(req, res, next) {
		res.render('user/list', { title: 'User List' });
	}
};

exports.login = {
	get: function(req, res) {
		if (req.isAuthenticated()) {
			return res.redirect('/');
		}

		res.render('user/login', { title: 'User Login', csrf: req.csrfToken() });
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
		if (req.isAuthenticated()) {
			return res.redirect('/');
		}

		res.render('user/register', { title: 'Register User', minimumPasswordLength: config.login.minimumPasswordLength, csrf: req.csrfToken() });
	},
	post: function(req, res, next) {
		req.assert('email', 'Please provide a valid email address.').isEmail();
		req.assert('password', 'Please enter a password of at least ' + config.login.minimumPasswordLength + ' characters.').len(config.login.minimumPasswordLength);
		req.assert('confirmPassword', 'Your passwords must match.').equals(req.body.password);

		var errors = req.validationErrors();

		if (errors) {
			req.flash('errors', errors);
			return res.redirect('/user/register');
		}

		var verificationToken = utility.createRandomToken();
		var user = new User({
			email: req.body.email,
			password: req.body.password,
			verificationToken: verificationToken,
			role: req.body.role,
			isVerified: false
		});

		var acl = require('../authorization').getAcl();

		User.findOne({ email: req.body.email }, function(err, existingUser) {
			if (existingUser) {
				req.flash('errors', { msg: 'A user with that email address already exists.  Please try another email address.' });
				return res.redirect('/user/register');
			}

			user.save(function(err, newUser) {
				if (err) {
					console.log(err);
					req.flash('errors', { msg: 'There was an error creating the user in the database.  Please try again.' });
					return res.redirect('/user/register');
				}

				acl.addUserRoles(newUser._id.toString(), req.body.role, function(err) {
					if (err) {
						console.log(err);
						req.flash('errors', { msg: 'There was an error setting your roles in the database.  Please contact an administrator.' });
						return res.redirect('/');
					}

					utility.sendEmail(req.body.email, config.email.sendFrom, 'Email Verification Required', '<p>Before you can log in, you must verify your email address:</p><a href="' + utility.constructUrl(req, '/user/verify/' + verificationToken) + '">Verify your email address</a>', 'text/html', function(err, json) {
						if (err) {
							console.log(err);
							req.flash('errors', { msg: 'There was an error sending your verification email.  Please contact an administrator.' });
							return res.redirect('/');
						}

						req.flash('info', { msg: 'Your account has been created, but you must verify your email before logging in.'});
						res.redirect('/');
					});
				});
			});
		});
	}
};

exports.resetPassword = {
	get: function(req, res) {
		if (req.isAuthenticated()) {
			return res.redirect('/');
		}

		User
			.findOne({ passwordResetToken: req.params.passwordResetToken })
			.where('passwordResetExpires').gt(moment().tz(config.server.timezone))
			.exec(function(err, user) {
				if (err) {
					console.log(err);
					req.flash('errors', { msg: 'There was an error retrieving your user information from the database.' });
					return res.redirect('/user/forgot-password');
				}

				if (!user) {
					req.flash('errors', { msg: 'Your password reset token is invalid or it has expired.'});
					return res.redirect('/user/forgot-password');
				}

				res.render('user/reset-password', { title: 'Reset Password', minimumPasswordLength: config.login.minimumPasswordLength, csrf: req.csrfToken() });
			});
	},
	post: function(req, res, next) {
		req.assert('password', 'Please enter a password of at least ' + config.login.minimumPasswordLength + ' characters.').len(config.login.minimumPasswordLength);
		req.assert('confirmPassword', 'Your passwords must match.').equals(req.body.password);

		var errors = req.validationErrors();

		if (errors) {
			req.flash('errors', errors);
			return res.redirect('back');
		}

		User
			.findOne({ passwordResetToken: req.params.passwordResetToken })
			.where('passwordResetExpires').gt(moment().tz(config.server.timezone))
			.exec(function(err, user) {
				if (err) {
					console.log(err);
					req.flash('errors', { msg: 'There was an error retrieving your user information from the database.' });
					return res.redirect('back');
				}

				if (!user) {
					req.flash('errors', { msg: 'Your password reset token is invalid or it has expired.'});
					return res.redirect('/user/forgot-password');
				}

				user.password = req.body.password;
				user.passwordResetToken = undefined;
				user.passwordResetExpires = undefined;
				user.loginAttempts = 0;
				user.lockUntil = undefined;

				user.save(function(err) {
					if (err) {
						console.log(err);
						req.flash('errors', { msg: 'There was an error updating your password in the database.' });
						return res.redirect('back');
					}

					req.flash('success', { msg: 'Your password has been successfully updated.  You may now log in with your new password.' });
					res.redirect('/user/login');
				});
			});
	}
};

exports.verify = {
	get: function(req, res) {
		if (req.isAuthenticated()) {
			return res.redirect('/');
		}

		User.findOneAndUpdate({ verificationToken: req.params.verificationToken }, { isVerified: true }, function(err, user) {
			if (err) {
				console.log(err);
				req.flash('errors', { msg: 'There was an error verifying your email address.' });
				return res.redirect('/');
			}

			if (!user) {
				req.flash('errors', { msg: 'Your verification token is invalid.  Please enter your email address below to receive a new verification token.' });
				return res.redirect('/user/verify-resend');
			}

			req.flash('success', { msg: 'Your email address has been verified.  You may now log in.' });
			res.redirect('/user/login');
		});
	}
};

exports.verifyResend = {
	resendEmail: function(req, res, emailAddress) {
		var verificationToken = utility.createRandomToken();

		User.findOneAndUpdate({ email: emailAddress }, { verificationToken: verificationToken }, function(err, user) {
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

			utility.sendEmail(emailAddress, config.email.sendFrom, 'Email Verification Required', '<p>You have requested a new verification email.  Before you can log in, you must verify your email address:</p><a href="' + utility.constructUrl(req, '/user/verify/' + verificationToken) + '">Verify your email address</a>', 'text/html', function(err, json) {
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
		if (req.isAuthenticated()) {
			return res.redirect('/');
		}

		if (req.params.email) {
			exports.verifyResend.resendEmail(req, res, req.params.email);
		}
		else {
			res.render('user/verify-resend', { title: 'Re-Send Verification Email', csrf: req.csrfToken() });
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
