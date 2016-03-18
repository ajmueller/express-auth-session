var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var userSchema = new mongoose.Schema({
	email: { type: String, unique: true, required: true },
	password: String,
	verificationToken: { type: String, unique: true, required: true },
	isVerified: { type: Boolean, required: true, default: false }
});

// hash passwords
userSchema.pre('save', function(next) {
	var user = this;

	if (!user.isModified('password')) {
		return next();
	}

	bcrypt.genSalt(10, function(err, salt) {
		if (err) {
			return next(new Error('There was an error generating your password salt.'));
		}

		bcrypt.hash(user.password, salt, function(err, hash) {
			if (err) {
				return next(new Error('There was an error hashing your password.'));
			}

			user.password = hash;
			next();
		});
	});
});

module.exports = mongoose.model('User', userSchema);