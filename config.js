module.exports = {
	db: {
		uri: process.env.MONGOLAB_URI
	},
	session: {
		secret: process.env.SESSION_SECRET
	}
};