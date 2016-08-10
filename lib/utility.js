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
	var request = sendgrid.emptyRequest({
	  method: 'POST',
	  path: '/v3/mail/send',
	  body: {
	    personalizations: [
	      {
	        to: [
	          {
	            email: to
	          }
	        ],
	        subject: subject
	      }
	    ],
	    from: {
	      email: from
	    },
	    content: [
	      {
	        type: contentType,
	        value: contents
	      }
	    ]
	  }
	});

sendgrid.API(request, function(err, response) {
	callback(err, response)
});
}
