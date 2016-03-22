module.exports = {
	db: {
		uri: process.env.MONGOLAB_URI
	},
	email: {
		apiKey: process.env.SENDGRID_API_KEY
	},
	server: {
		timezone: process.env.TZ
	},
	session: {
		secret: process.env.SESSION_SECRET
	}
};