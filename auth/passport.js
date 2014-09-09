"use strict";

//== Load Passport auth strategies
var LocalStrategy    = require('passport-local').Strategy;
var LinkedInStrategy = require('passport-linkedin').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;
//== Load User model
var UserModel        = require('../models/user');
//== Load auth variables
var configAuth       = require('./auth');

module.exports = function (passport) {
    //============================
    //== PASSPORT SESSION SETUP ==
    //============================
    //== Required for persistent login sessions
    //== Passport needs ability to serialize and unserialize users out of session

    //== Serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });
    //== De-serialize the user
    passport.deserializeUser(function (id, done) {
        UserModel.findById(id, function (err, user) {
            done(err, user);
        });
    });

    //==================
    //== LOCAL SIGNUP ==
    //==================
    //== We are using named strategies since we have one for login and one for signup
    //== If there was no name it would just be called 'local'
    passport.use('local-signup', new LocalStrategy({
        //== By default, local strategy uses username and password - we will override with email
        usernameField:    'email',
        passwordField:    'password',
        //== Allows us to pass back the entire request to the callback
        passReqToCallback: true
    },
        function (req, email, password, done) {
            //== User.findOne wont fire unless data is sent back
            process.nextTick(function () {
                //== Check if the user is already logged in
                if (!req.user) {
                    //== Find if the email already exists
                    UserModel.findOne({ 'local.email': email }, function (err, user) {
                        //== Handle errors
                        if (err) {
                            return done(err);
                        }
                        //== If user already exists
                        if (user) {
                            return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                        }
                        //== If user does not exist then create new user
                        var newUser            = new UserModel();
                        newUser.local.email    = email;
                        newUser.local.password = newUser.generateHash(password);

                        //== Save user to the DB
                        newUser.save(function (err) {
                            if (err) {
                                throw err;
                            }
                            return done(null, newUser);
                        });
                    });
                //== User is already logged in and we need to link accounts
                } else {
                    //== Set Local account information
                    var user            = req.user;
                    user.local.email    = email;
                    user.local.password = user.generateHash(password);

                    //== Save user to the DB
                    user.save(function (err) {
                        if (err) {
                            throw err;
                        }
                        return done(null, user);
                    });
                }
            });
        }
    ));

    //=================
    //== LOCAL LOGIN ==
    //=================
    //== We are using named strategies since we have one for login and one for signup
    //== If there was no name it would just be called 'local'
    passport.use('local-login', new LocalStrategy({
        //== By default, local strategy uses username and password - we will override with email
        usernameField : 'email',
        passwordField : 'password',
        //== Allows us to pass back the entire request to the callback
        passReqToCallback : true
    },
        function (req, email, password, done) {
            //== Find if the email already exists
            UserModel.findOne({ 'local.email':  email }, function (err, user) {
                //== Handle errors
                if (err) {
                    return done(err);
                }
                //== If user is not found
                if (!user) {
                    return done(null, false, req.flash('loginMessage', 'User not found.'));
                }
                //== If user is found, but password is wrong
                if (!user.validPassword(password)) {
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                }
                //== If everything checks out, return the user
                return done(null, user);
            });
        }
    ));

    //====================
    //== LINKEDIN LOGIN ==
    //====================
    passport.use(new LinkedInStrategy({
        //== Get the app ID and secret from auth.js
        consumerKey:       configAuth.linkedInAuth.consumerKey,
        consumerSecret:    configAuth.linkedInAuth.consumerSecret,
        callbackURL:       configAuth.linkedInAuth.callbackURL,
        profileFields:     ['id', 'first-name', 'last-name', 'email-address', 'headline'],
        //== Allows us to pass back the entire request to the callback (lets us check if a user is logged in or not)
        passReqToCallback: true
    },
        //== LinkedIn will send back the token and profile
        function (req, token, refreshToken, profile, done) {
            //== findOne() won't fire until we have all our data back from LinkedIn
            process.nextTick(function () {
                //== Check if the user is already logged in
                if (!req.user) {
                    //== Find the user in the database based on their LinkedIn ID
                    UserModel.findOne({ 'linkedin.id': profile.id }, function (err, user) {
                        //== Handle errors
                        if (err) {
                            return done(err);
                        }
                        //== If the user is found then log them in
                        if (user) {
                            //== If there is a user id already but no token (user was linked at one point and then removed)
                            //== just add our token and profile information
                            if (!user.linkedin.token) {
                                user.linkedin.token = token;
                                user.linkedin.name  = profile.displayName;
                                user.linkedin.email = profile.emails[0].value;

                                //== Save user to the DB
                                user.save(function (err) {
                                    if (err) {
                                        throw err;
                                    }
                                    return done(null, user);
                                });
                            }
                            //== Log the user in
                            return done(null, user);
                        }
                        //== If no user is found in DB then create new user
                        var newUser            = new UserModel();
                        newUser.linkedin.id    = profile.id;
                        newUser.linkedin.token = token;
                        newUser.linkedin.name  = profile.displayName;
                        newUser.linkedin.email = profile.emails[0].value;

                        //== Save user to the DB
                        newUser.save(function (err) {
                            if (err) {
                                throw err;
                            }
                            return done(null, newUser);
                        });
                    });
                //== User is already logged in and we need to link accounts
                } else {
                    //== Set LinkedIn account information
                    var user            = req.user;
                    user.linkedin.id    = profile.id;
                    user.linkedin.token = token;
                    user.linkedin.name  = profile.displayName;
                    user.linkedin.email = profile.emails[0].value;

                    //== Save user to the DB
                    user.save(function (err) {
                        if (err) {
                            throw err;
                        }
                        return done(null, user);
                    });
                }
            });
        }
    ));

    //==================
    //== GOOGLE LOGIN ==
    //==================
    passport.use(new GoogleStrategy({
        //== Get the app ID and secret from auth.js
        clientID:          configAuth.googleAuth.clientID,
        clientSecret:      configAuth.googleAuth.clientSecret,
        callbackURL:       configAuth.googleAuth.callbackURL,
        //== Allows us to pass back the entire request to the callback (lets us check if a user is logged in or not)
        passReqToCallback: true
    },
        function (req, token, refreshToken, profile, done) {
            //== findOne() won't fire until we have all our data back from Google
            process.nextTick(function () {
                //== Check if the user is already logged in
                if (!req.user) {
                    //== Find the user in the database based on their Google ID
                    UserModel.findOne({ 'google.id': profile.id }, function (err, user) {
                        //== Handle errors
                        if (err) {
                            return done(err);
                        }
                        //== If the user is found then log them in
                        if (user) {
                            //== If there is a user id already but no token (user was linked at one point and then removed)
                            //== just add our token and profile information
                            if (!user.google.token) {
                                user.google.token = token;
                                user.google.name  = profile.displayName;
                                user.google.email = profile.emails[0].value;

                                //== Save user to the DB
                                user.save(function (err) {
                                    if (err) {
                                        throw err;
                                    }
                                    return done(null, user);
                                });
                            }
                            //== Log the user in
                            return done(null, user);
                        }
                        //== If no user is found in DB then create new user
                        var newUser          = new UserModel();
                        newUser.google.id    = profile.id;
                        newUser.google.token = token;
                        newUser.google.name  = profile.displayName;
                        newUser.google.email = profile.emails[0].value;

                        //== Save user to the DB
                        newUser.save(function (err) {
                            if (err) {
                                throw err;
                            }
                            return done(null, newUser);
                        });
                    });
                //== User is already logged in and we need to link accounts
                } else {
                    //== Set Google account information
                    var user          = req.user;
                    user.google.id    = profile.id;
                    user.google.token = token;
                    user.google.name  = profile.displayName;
                    user.google.email = profile.emails[0].value;

                    //== Save user to the DB
                    user.save(function (err) {
                        if (err) {
                            throw err;
                        }
                        return done(null, user);
                    });
                }
            });
        }
    ));

    //====================
    //== FACEBOOK LOGIN ==
    //====================
    passport.use(new FacebookStrategy({
        //== Get the app ID and secret from auth.js
        clientID:          configAuth.facebookAuth.clientID,
        clientSecret:      configAuth.facebookAuth.clientSecret,
        callbackURL:       configAuth.facebookAuth.callbackURL,
        //== Allows us to pass back the entire request to the callback (lets us check if a user is logged in or not)
        passReqToCallback: true
    },
        function (req, token, refreshToken, profile, done) {
            //== findOne() won't fire until we have all our data back from Facebook
            process.nextTick(function () {
                //== Check if the user is already logged in
                if (!req.user) {
                    //== Find the user in the database based on their Facebook ID
                    UserModel.findOne({ 'facebook.id' : profile.id }, function (err, user) {
                        //== Handle errors
                        if (err) {
                            return done(err);
                        }
                        //== If the user is found then log them in
                        if (user) {
                            //== If there is a user id already but no token (user was linked at one point and then removed)
                            //== just add our token and profile information
                            if (!user.facebook.token) {
                                user.facebook.token = token;
                                user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                                user.facebook.email = profile.emails[0].value;

                                //== Save user to the DB
                                user.save(function (err) {
                                    if (err) {
                                        throw err;
                                    }
                                    return done(null, user);
                                });
                            }
                            //== Log the user in
                            return done(null, user);
                        }
                        //== If no user is found in DB then create new user
                        var newUser            = new UserModel();
                        newUser.facebook.id    = profile.id;
                        newUser.facebook.token = token;
                        newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                        newUser.facebook.email = profile.emails[0].value;

                        //== Save user to the DB
                        newUser.save(function (err) {
                            if (err) {
                                throw err;
                            }
                            return done(null, newUser);
                        });
                    });
                //== User is already logged in and we need to link accounts
                } else {
                    //== Set Facebook account information
                    var user            = req.user;
                    user.facebook.id    = profile.id;
                    user.facebook.token = token;
                    user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                    user.facebook.email = profile.emails[0].value;

                    //== Save user to the DB
                    user.save(function (err) {
                        if (err) {
                            throw err;
                        }
                        return done(null, user);
                    });
                }
            });
        }
    ));

};