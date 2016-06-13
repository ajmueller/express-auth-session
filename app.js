require('dotenv').config();

var express = require('express');
var sslRedirect = require('heroku-ssl-redirect');
var flash = require('express-flash');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var validator = require('express-validator');
var bodyParser = require('body-parser');
var passport = require('passport');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);
var config = require('./config');

var authentication = require('./authentication');

var app = express();

app.use(sslRedirect());

mongoose.connect(config.db.uri);
mongoose.connection.on('connected', function(test) {
	require('./authorization').init();
});
mongoose.connection.on('error', function() {
	console.log('There is an issue with your MongoDB connection.  Please make sure MongoDB is running.');
	process.exit(1);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session({
	resave: true,
	saveUninitialized: true,
	secret: config.session.secret,
	store: new MongoStore({ url: config.db.uri, autoReconnect: true })
}));

// passport needs to come after session initialization
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

// pass the user object to all responses
app.use(function(req, res, next) {
	res.locals.user = req.user;
	next();
});

var routes = require('./routes/index');
var user = require('./routes/user');
var admin = require('./routes/admin');

app.use('/', routes);
app.use('/user', user);
app.use('/admin', admin);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;