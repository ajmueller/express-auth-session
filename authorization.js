var acl = require('acl');
var mongoose = require('mongoose');
var config = require('./config');

exports.init = function() {
	acl = new acl(new acl.mongodbBackend(mongoose.connection.db, config.db.aclCollectionPrefix));
};