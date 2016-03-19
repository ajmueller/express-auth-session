var config = require('../config');
var crypto = require('crypto');
var sendgrid = require('sendgrid')(config.email.apiKey);

exports.constructUrl = function(req, path) {
	return req.protocol + '://' + req.get('host') + path;
};

exports.createRandomToken = function(string) {
	var seed = crypto.randomBytes(20);

	return crypto.createHash('sha1').update(seed + string).digest('hex');
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