var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');

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

		if (!user.isVerified) {
			return done(null, false, { msg: 'Your email has not been verified.  You must verify your email address before you can log in.' });
		}

		user.comparePassword(password, function(err, isMatch) {
			if (isMatch) {
				return done(null, user);
			}
			else {
				return done(null, false, { msg: 'Invalid email or password.' });
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