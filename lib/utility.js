var crypto = require('crypto');

exports.createRandomToken = function(string) {
	var seed = crypto.randomBytes(20);

	return crypto.createHash('sha1').update(seed + string).digest('hex');
};