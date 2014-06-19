var passport = require('passport');
var User = require('../models/user');
var Strengths = require('../models/strengths');

module.exports = {
    //==============================
    //== PROFILE VIEW CONTROLLERS ==
    //==============================
    index: function(req, res) {
            res.render('profile-index', { title: 'Profiles' });
    },

    //====================================
    //== PROFILE MANAGEMENT CONTROLLERS ==
    //====================================
    profileStart: function(req, res) {
            res.render('profile-start', { title: 'Profiles' });
    },
    profileHomeScreen: function(req, res) {
        res.render('profile-home', { title: 'Profiles', user: req.user });
    },

    profileStrengthsScreen: function(req, res) {
        res.render('profile-strengths', { title: 'Profiles', user: req.user });
    },

    profilePreferencesScreen: function(req, res) {
        res.render('profile-preferences', { title: 'Profiles', user: req.user });
    },


    //=======================
    //== LOGIN CONTROLLERS ==
    //=======================
    profilelogins: function(req, res) {
        res.render('profile-home-logins', { title: 'Profiles', user: req.user });
    },
    //== Local Login
    localLoginScreen: function(req, res) {
            res.render('profile-login', { title: 'Profiles', message: req.flash('loginMessage') });
    },
    localLoginTry: passport.authenticate('local-login', {
            successRedirect : '/formapp1/profiles/home',
            failureRedirect : '/formapp1/profiles', 
            failureFlash : true 
    }),
    //== Local Signup
    localSignupScreen: function(req, res) {
            res.render('profile-signup', { title: 'Profiles', message: req.flash('signupMessage') });
    },
    localSignupTry: passport.authenticate('local-signup', {
            successRedirect : '/formapp1/profiles/home', 
            failureRedirect : '/formapp1/profiles/signup', 
            failureFlash : true 
    }),
    //== Local Link
    localLinkScreen: function(req, res) {
            res.render('profile-link', { title: 'Profiles', message: req.flash('loginMessage') });
    },
    localLinkTry: passport.authenticate('local-signup', {
            successRedirect : '/formapp1/profiles/logins', 
            failureRedirect : '/formapp1/profiles/link/local', 
            failureFlash : true 
    }),
    //== Local Unlink
    unlinkLocal: function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/formapp1/profiles/logins');
        });
    },
    //== Facebook Login
    sendFacebookAuth: passport.authenticate('facebook', { 
            scope : 'email' 
    }),
    receiveFacebookAuth: passport.authenticate('facebook', {
            successRedirect : '/formapp1/profiles/home',
            failureRedirect : '/formapp1/profiles/start'
    }),
    //== Facebook Link
    sendFacebookLink: passport.authorize('facebook',
            { scope : 'email'
    }),
    receiveFacebookLink: passport.authorize('facebook', {
            successRedirect : '/formapp1/profiles/logins',
            failureRedirect : '/formapp1/profiles/home'
    }),
    //== Facebook Unlink
    unlinkFacebook: function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/formapp1/profiles/logins');
        });
    },
    //== Google Login
    sendGoogleAuth: passport.authenticate('google', {
            scope : 'email'
    }),
    receiveGoogleAuth: passport.authenticate('google', {
            successRedirect : '/formapp1/profiles/home',
            failureRedirect : '/formapp1/profiles/start'
    }),
    //== Google Link
    sendGoogleLink: passport.authorize('google', { 
            scope : ['profile', 'email'] 
    }),
    receiveGoogleLink:  passport.authorize('google', {
            successRedirect : '/formapp1/profiles/logins',
            failureRedirect : '/formapp1/profiles/logins'
    }),
    //== Google Unlink
    unlinkGoogle: function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/formapp1/profiles/logins');
        });
    },
    //== Global Logout
    logOut: function(req, res) {
        req.logout();
        res.redirect('/formapp1');
    }

    /*getById: function(req, res) {
        models.Contact.find({ _id: req.params.id }, function(err, contact) {
            if (err) {
                res.json({error: 'Contact not found.'});
            } else {
                res.json(contact);
            }
        });
    },
    add: function(req, res) {
        var newContact = new models.Contact(req.body);
        newContact.gravatar = md5(newContact.email);
        newContact.save(function(err, contact) {
            if (err) {
                res.json({error: 'Error adding contact.'});
            } else {
                res.json(contact);
            }
        });
    },
    update: function(req, res) {
        console.log(req.body);
        models.Contact.update({ _id: req.body.id }, req.body, function(err, updated) {
            if (err) {
                res.json({error: 'Contact not found.'});
            } else {
                res.json(updated);
            }
        })
    },
    delete: function(req, res) {
        models.Contact.findOne({ _id: req.params.id }, function(err, contact) {
            if (err) {
                res.json({error: 'Contact not found.'});
            } else {
                contact.remove(function(err, contact){
                    res.json(200, {status: 'Success'});
                })
            }
        });
    }*/
};
