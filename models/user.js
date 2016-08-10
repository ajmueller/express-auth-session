var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var async = require('async');
var config = require('../config');

var userSchema = new mongoose.Schema({
	email: { type: String, unique: true, required: true },
	password: { type: String, required: true },
	verificationToken: { type: String, unique: true, required: true },
	isVerified: { type: Boolean, required: true, default: false },
	passwordResetToken: { type: String, unique: true },
	passwordResetExpires: Date,
	loginAttempts: { type: Number, required: true, default: 0 },
	lockUntil: Date,
	role: { type: String, maxlength: 16 }
});

userSchema.virtual('isLocked').get(function() {
	return !!(this.lockUntil && this.lockUntil > Date.now());
});

// hash passwords
userSchema.pre('save', function(next) {
	var user = this;

	if (!user.isModified('password')) {
		return next();
	}

	bcrypt.genSalt(config.login.passwordHashRounds, function(err, salt) {
		if (err) {
			console.log(err);
			req.flash('errors', { msg: 'There was an error generating your password salt.' });
			return res.redirect('/');
		}

		bcrypt.hash(user.password, salt, function(err, hash) {
			if (err) {
				console.log(err);
				req.flash('errors', { msg: 'There was an error hashing your password.' });
				return res.redirect('/');
			}

			user.password = hash;
			next();
		});
	});
});

userSchema.methods.comparePassword = function(passwordToCompare, callback) {
	var user = this;

	async.waterfall([
		function(waterfallCb) {
			bcrypt.compare(passwordToCompare, user.password, function(err, isMatch) {
				if (err) {
					return waterfallCb(err);
				}

				waterfallCb(null, isMatch);
			});
		},
		function(isMatch, waterfallCb) {
			if (bcrypt.getRounds(user.password) !== config.login.passwordHashRounds) {
				user.password = passwordToCompare;

				user.save(function(err, user) {
					if (err) {
						return waterfallCb(err, isMatch);
					}

					waterfallCb(null, isMatch);
				});
			}
			else {
				waterfallCb(null, isMatch);
			}
		}
	], function(err, isMatch) {
		if (err) {
			return callback(err);
		}

		callback(null, isMatch);
	});
};

userSchema.methods.incrementLoginAttempts = function(callback) {
	var lockExpired = !!(this.lockUntil && this.lockUntil < Date.now());

	if (lockExpired) {
		return this.update({
			$set: { loginAttempts: 1 },
			$unset: { lockUntil: 1 }
		}, callback);
	}

	var updates = { $inc: { loginAttempts: 1 } };
	var needToLock = !!(this.loginAttempts + 1 >= config.login.maxAttempts && !this.isLocked);

	if (needToLock) {
		updates.$set = { lockUntil: Date.now() + config.login.lockoutHours };
	}

	return this.update(updates, callback);
};

module.exports = mongoose.model('User', userSchema);
