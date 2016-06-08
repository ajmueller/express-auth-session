var acl = require('acl');
var mongoose = require('mongoose');
var config = require('./config');

module.exports = {
	init: function() {
		var aclInstance = module.exports.getAcl();

		aclInstance.addRoleParents('user', ['admin', 'superAdmin']);
		aclInstance.addRoleParents('admin', ['superAdmin']);

		aclInstance.allow([
			{
				roles: ['admin'],
				allows: [
					{
						resources: '/user/list',
						permissions: 'get'
					}
				]
			}
		]);
	},

	getAcl: function() {
		return new acl(new acl.mongodbBackend(mongoose.connection.db, config.db.aclCollectionPrefix), { debug: function(string) { console.log(string); } });
	}
};