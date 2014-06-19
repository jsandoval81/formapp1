var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');

var routes = require('./routes/routes');

var app = express();

/** View Engine Setup **/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

require('./passport')(passport);

/** Express Setup **/
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/** Passport Setup **/
app.use(session({ secret: 'worstsecretever' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

/** Connect to the DB server **/
mongoose.connect('mongodb://localhost/formapp1');
mongoose.connection.on('open', function() {
    console.log("Connected to Mongoose...");
});

/** Routes List **/
routes.initialize(app, passport);

/// catch 404 and forward to error handler

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            title: 'Whoops',
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
        title: 'Whoops',
        message: err.message,
        error: err
    });
});


module.exports = app;
