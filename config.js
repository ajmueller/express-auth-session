module.exports = {
	db: {
		uri: process.env.MONGODB_URI,
		aclCollectionPrefix: process.env.ACL_COLLECTION_PREFIX
	},
	email: {
		apiKey: process.env.SENDGRID_API_KEY
	},
	login: {
		maxAttempts: process.env.MAX_LOGIN_ATTEMPTS,
		lockoutHours: process.env.LOGIN_ATTEMPTS_LOCKOUT_HOURS * 60 * 60 * 1000,
		minimumPasswordLength: process.env.MINIMUM_PASSWORD_LENGTH,
		passwordResetTimeLimitInHours: process.env.PASSWORD_RESET_TIME_LIMIT_IN_HOURS
	},
	server: {
		timezone: process.env.TZ
	},
	session: {
		secret: process.env.SESSION_SECRET
	}
};