var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var moment = require('moment-timezone');
var config = require('./config');

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});

passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {
	User.findOne({ email: email }, function(err, user) {
		if (!user) {
			return done(null, false, { msg: 'No user with the email ' + email + ' was found.' });
		}

		if (user.isLocked) {
			return user.incrementLoginAttempts(function(err) {
				if (err) {
					return done(err);
				}

				return done(null, false, { msg: 'You have exceeded the maximum number of login attempts.  Your account is locked until ' + moment(user.lockUntil).tz(config.server.timezone).format('LT z') + '.  You may attempt to log in again after that time.' });
			});
		}

		if (!user.isVerified) {
			return done(null, false, { msg: 'Your email has not been verified.  Check your inbox for a verification email.<p><a href="/user/verify-resend/' + email + '" class="btn waves-effect white black-text"><i class="material-icons left">email</i>Re-send verification email</a></p>' });
		}

		user.comparePassword(password, function(err, isMatch) {
			if (isMatch) {
				return done(null, user);
			}
			else {
				user.incrementLoginAttempts(function(err) {
					if (err) {
						return done(err);
					}

					return done(null, false, { msg: 'Invalid password.  Please try again.' });
				});
			}
		});
	});
}));

exports.isAuthenticated = function(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect('/login');
};