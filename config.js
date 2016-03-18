module.exports = {
	db: {
		uri: process.env.MONGOLAB_URI
	},
	email: {
		apiKey: process.env.SENDGRID_API_KEY
	},
	session: {
		secret: process.env.SESSION_SECRET
	}
};