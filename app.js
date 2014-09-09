"use strict";

var express      = require('express');
var session      = require('express-session');
var path         = require('path');
var favicon      = require('static-favicon');
var logger       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var mongoose     = require('mongoose');
var passport     = require('passport');
var flash        = require('connect-flash');
var routes       = require('./routes/routes');

//== Initialize Express
var app = express();
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

//== Initialize Passport
require('./auth/passport')(passport);
app.use(session({ secret: 'worstsecretever', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

//== Initialize view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//== Initialize routes
routes.initialize(app, passport);

//== Connect to the DB server
mongoose.connect('mongodb://localhost/ti');
mongoose.connection.on('open', function () {
    console.log("Connected to Mongoose...");
});

//== Catch 404
app.use(function (req, res, next) {
    var err    = new Error('Not Found');
    err.status = 404;
    next(err);
});

//== Development error handler (with stacktrace)
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            title:  'Whoops',
            message: err.message,
            error:   err
        });
    });
}

//== Production error handler (no stacktrace)
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        title:  'Whoops',
        message: err.message,
        error:   err
    });
});

module.exports = app;
