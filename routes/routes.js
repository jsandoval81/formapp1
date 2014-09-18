"use strict";

//== Load contollers
var home     = require('../controllers/home'),
    profiles = require('../controllers/profiles'),
    summary  = require('../controllers/summary'),
    about    = require('../controllers/about');
//== Load middleware utilities
var md5      = require('MD5');
//== Load helpers
var helpers  = require('../helpers/helpers');
//== Load Admin model
var Admin    = require('../models/admin');

//======================
//== Route Middleware ==
//======================
//== Make sure a user is logged in
function isLoggedIn(req, res, next) {

    if (req.isAuthenticated()) {
        //== If user is authenticated in the session then carry on 
        return next();
    }
    //== If is not autenticated then redirect them to the profile login page
    res.redirect('/ti/profiles/login');
}

//== Make sure a user is logged in as Administrator
function isLoggedInAdmin(req, res, next) {
    var adminEmailLength = 0,
        userEmail        = md5("this4now"),
        foundEmail       = false,
        isAdmin          = false,
        i                = 0;
    if (req.user) {
        //== Finding the email purposefully ignores the global helper function for "security by obscurity"
        if (req.user.linkedin.email)      { userEmail = req.user.linkedin.email; foundEmail = true; }
        else if (req.user.google.email)   { userEmail = req.user.google.email;   foundEmail = true; }
        else if (req.user.facebook.email) { userEmail = req.user.facebook.email; foundEmail = true; }
        else if (req.user.local.email)    { userEmail = req.user.local.email;    foundEmail = true; }
    }

    //== Make sure the user is at least logged in and we have an email
    if (req.isAuthenticated() && foundEmail) {
        Admin.findOne({ 'adminUser.admin': 'Y' }, function (err, admin) {
            //== Cache array length
            adminEmailLength = admin.adminUser.email.length;
            //== Check admin email list for user's email
            for (i = 0; i < adminEmailLength; i += 1) {
                if (userEmail === admin.adminUser.email[i]) {
                    isAdmin = true;
                    break;
                }
            }
            //== If user is authenticated in the session and an administrator then carry on 
            if (isAdmin) {
                return next();
            }
            //== If they aren't an admin but they are logged on then redirect them to the profile home
            res.redirect('/ti/profiles/home');
        });
    //== If they aren't even authenticated then redirect them to the login page
    } else {
        res.redirect('/ti/profiles/login');
    }
}

module.exports.initialize = function (app) {

//===================================================
//== PRODUCTION ROUTES (using NGINX reverse proxy) ==
//===================================================
    //===============
    //== Home Page ==
    //===============
    app.get('/', home.index);

    //==================
    //== Profile View ==
    //==================
    app.get('/profiles', profiles.index);
    app.post('/profiles/filter', profiles.indexFilter);
    app.post('/profiles/detail', profiles.indexDetail);

    //==================
    //== Summary View ==
    //==================
    app.get('/summary', summary.index);
    app.post('/summary/filter', summary.indexFilter);

    //================
    //== About View ==
    //================
    app.get('/about', about.index);
    app.get('/about/inspiration', about.inspiration);
    app.get('/about/howto', about.howto);
    app.get('/about/howto/:section', about.howto);
    app.get('/about/architecture', about.architecture);
    app.get('/about/future', about.future);

    //========================
    //== Profile Management ==
    //========================
    //== Profile Dashboard Home
    app.get('/profiles/home', isLoggedIn, profiles.profileHomeScreen);
    app.get('/profiles/home/update', isLoggedIn, profiles.profileHomeUpdateScreen);
    app.post('/profiles/home/update', isLoggedIn, profiles.profileHomeUpdateTry);
    //== Profile Dashboard Strengths
    app.get('/profiles/strengths', isLoggedIn, profiles.profileStrengthsScreen);
    app.put('/profiles/strengths', isLoggedIn, profiles.profileStrengthsTry);
    //== Profile Dashboard Preferences
    app.get('/profiles/preferences', isLoggedIn, profiles.profilePreferencesScreen);
    app.post('/profiles/preferences', isLoggedIn, profiles.profilePreferencesTry);
    app.put('/profiles/preferences', isLoggedIn, profiles.profilePreferencesTry);
    //== Profile Dashboard Logins
    app.get('/profiles/logins', isLoggedIn, profiles.profileLogins);
    //== Profile Administrator
    app.get('/profiles/administrator', isLoggedInAdmin, profiles.profileAdministratorScreen);
    app.post('/profiles/administrator', isLoggedInAdmin, profiles.profileAdministratorTry);
    app.put('/profiles/administrator', isLoggedInAdmin, profiles.profileAdministratorTry);
    app.post('/profiles/administrator/user', isLoggedInAdmin, profiles.profileAdministratorUser);

    //============================
    //== Profile Authentication ==
    //============================
    //== Local Login
    app.get('/profiles/login', profiles.localLoginScreen);
    app.post('/profiles/login', profiles.localLoginTry);
    //== Local Signup
    app.get('/profiles/signup', profiles.localSignupScreen);
    app.post('/profiles/signup', profiles.localSignupTry);
    //== Local Link
    app.get('/profiles/link/local', profiles.localLinkScreen);
    app.post('/profiles/link/local', profiles.localLinkTry);
    //== Local Unlink
    app.get('/profiles/unlink/local', profiles.unlinkLocal);

    //== LinkedIn Login
    app.get('/profiles/auth/linkedin', profiles.sendLinkedInAuth);
    app.get('/profiles/auth/linkedin/callback', profiles.receiveLinkedInAuth);
    //== LinkedIn Link
    app.get('/profiles/link/linkedin', profiles.sendLinkedInLink);
    app.get('/profiles/link/linkedin/callback', profiles.receiveLinkedInLink);
    //== LinkedIn Unlink
    app.get('/profiles/unlink/linkedin', profiles.unlinkLinkedIn);

    //== Facebook Login
    app.get('/profiles/auth/facebook', profiles.sendFacebookAuth);
    app.get('/profiles/auth/facebook/callback', profiles.receiveFacebookAuth);
    //== Facebook Link
    app.get('/profiles/link/facebook', profiles.sendFacebookLink);
    app.get('/profiles/link/facebook/callback', profiles.receiveFacebookLink);
    //== Facebook Unlink
    app.get('/profiles/unlink/facebook', profiles.unlinkFacebook);

    //== Google Login
    app.get('/profiles/auth/google', profiles.sendGoogleAuth);
    app.get('/profiles/auth/google/callback', profiles.receiveGoogleAuth);
    //== Google Link
    app.get('/profiles/link/google', profiles.sendGoogleLink);
    app.get('/profiles/link/google/callback', profiles.receiveGoogleLink);
    //== Google Unlink
    app.get('/profiles/unlink/google', profiles.unlinkGoogle);

    //== Logout
    app.get('/profiles/logout', profiles.logOut);

//===============================================
//== DEVELOPMENT ROUTES (using localhost:port) ==
//===============================================
    //===============
    //== Home Page ==
    //===============
    app.get('/ti', home.index);

    //==================
    //== Profile View ==
    //==================
    app.get('/ti/profiles', profiles.index);
    app.post('/ti/profiles/filter', profiles.indexFilter);
    app.post('/ti/profiles/detail', profiles.indexDetail);

    //==================
    //== Summary View ==
    //==================
    app.get('/ti/summary', summary.index);
    app.post('/ti/summary/filter', summary.indexFilter);

    //================
    //== About View ==
    //================
    app.get('/ti/about', about.index);
    app.get('/ti/about/inspiration', about.inspiration);
    app.get('/ti/about/howto', about.howto);
    app.get('/ti/about/howto/:section', about.howto);
    app.get('/ti/about/architecture', about.architecture);
    app.get('/ti/about/future', about.future);

    //========================
    //== Profile Management ==
    //========================
    //== Profile Dashboard Home
    app.get('/ti/profiles/home', isLoggedIn, profiles.profileHomeScreen);
    app.get('/ti/profiles/home/update', isLoggedIn, profiles.profileHomeUpdateScreen);
    app.post('/ti/profiles/home/update', isLoggedIn, profiles.profileHomeUpdateTry);
    //== Profile Dashboard Strengths
    app.get('/ti/profiles/strengths', isLoggedIn, profiles.profileStrengthsScreen);
    app.put('/ti/profiles/strengths', isLoggedIn, profiles.profileStrengthsTry);
    //== Profile Dashboard Preferences
    app.get('/ti/profiles/preferences', isLoggedIn, profiles.profilePreferencesScreen);
    app.post('/ti/profiles/preferences', isLoggedIn, profiles.profilePreferencesTry);
    app.put('/ti/profiles/preferences', isLoggedIn, profiles.profilePreferencesTry);
    //== Profile Dashboard Logins
    app.get('/ti/profiles/logins', isLoggedIn, profiles.profileLogins);
    //== Profile Administrator
    app.get('/ti/profiles/administrator', isLoggedInAdmin, profiles.profileAdministratorScreen);
    app.post('/ti/profiles/administrator', isLoggedInAdmin, profiles.profileAdministratorTry);
    app.put('/ti/profiles/administrator', isLoggedInAdmin, profiles.profileAdministratorTry);
    app.post('/ti/profiles/administrator/user', isLoggedInAdmin, profiles.profileAdministratorUser);

    //============================
    //== Profile Authentication ==
    //============================
    //== Local Login
    app.get('/ti/profiles/login', profiles.localLoginScreen);
    app.post('/ti/profiles/login', profiles.localLoginTry);
    //== Local Signup
    app.get('/ti/profiles/signup', profiles.localSignupScreen);
    app.post('/ti/profiles/signup', profiles.localSignupTry);
    //== Local Link
    app.get('/ti/profiles/link/local', profiles.localLinkScreen);
    app.post('/ti/profiles/link/local', profiles.localLinkTry);
    //== Local Unlink
    app.get('/ti/profiles/unlink/local', profiles.unlinkLocal);

    //== LinkedIn Login
    app.get('/ti/profiles/auth/linkedin', profiles.sendLinkedInAuth);
    app.get('/ti/profiles/auth/linkedin/callback', profiles.receiveLinkedInAuth);
    //== LinkedIn Link
    app.get('/ti/profiles/link/linkedin', profiles.sendLinkedInLink);
    app.get('/ti/profiles/link/linkedin/callback', profiles.receiveLinkedInLink);
    //== LinkedIn Unlink
    app.get('/ti/profiles/unlink/linkedin', profiles.unlinkLinkedIn);

    //== Facebook Login
    app.get('/ti/profiles/auth/facebook', profiles.sendFacebookAuth);
    app.get('/ti/profiles/auth/facebook/callback', profiles.receiveFacebookAuth);
    //== Facebook Link
    app.get('/ti/profiles/link/facebook', profiles.sendFacebookLink);
    app.get('/ti/profiles/link/facebook/callback', profiles.receiveFacebookLink);
    //== Facebook Unlink
    app.get('/ti/profiles/unlink/facebook', profiles.unlinkFacebook);

    //== Google Login
    app.get('/ti/profiles/auth/google', profiles.sendGoogleAuth);
    app.get('/ti/profiles/auth/google/callback', profiles.receiveGoogleAuth);
    //== Google Link
    app.get('/ti/profiles/link/google', profiles.sendGoogleLink);
    app.get('/ti/profiles/link/google/callback', profiles.receiveGoogleLink);
    //== Google Unlink
    app.get('/ti/profiles/unlink/google', profiles.unlinkGoogle);

    //== Logout
    app.get('/ti/profiles/logout', profiles.logOut);

};