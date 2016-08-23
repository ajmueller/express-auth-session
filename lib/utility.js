var config = require('../config');
var crypto = require('crypto');
var sendgrid = require('sendgrid')(config.email.apiKey);

exports.constructUrl = function(req, path) {
	return req.protocol + '://' + req.get('host') + path;
};

exports.createRandomToken = function() {
	return crypto.randomBytes(20).toString('hex');
};

exports.getUserId = function(req, res) {
	if (typeof req.user !== 'undefined') {
		return req.user.id;
	}

	return false;
};

exports.sendEmail = function(to, from, subject, contents, contentType, callback) {
	var email = {
			to: to,
			from: from,
			subject: subject,
		};

	email[contentType] = contents;

	sendgrid.send(email, function(err, json) {
		callback(err, json);
	});
};
