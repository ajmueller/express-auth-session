exports.list = {
	get: function(req, res, next) {
		res.render('admin/list', { title: 'Admin List' });
	}
};