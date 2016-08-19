var acl = require('acl');
var mongoose = require('mongoose');
var config = require('./config');

acl = new acl(new acl.mongodbBackend(mongoose.connection.db, config.db.aclCollectionPrefix), { debug: function(string) { console.log(string); } });

module.exports = {
	init: function() {
		acl.addRoleParents('superAdmin', 'admin');
		acl.addRoleParents('admin', 'user');

		acl.allow([
			{
				roles: ['admin'],
				allows: [
					{
						resources: '/user/list',
						permissions: 'get'
					}
				]
			},
			{
				roles: ['superAdmin'],
				allows: [
					{
						resources: '/admin/list',
						permissions: 'get'
					}
				]
			}
		]);
	},

	getAcl: function() {
		return acl;
	}
};
