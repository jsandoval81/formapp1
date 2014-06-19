var home = require('../controllers/home'),
    profiles = require('../controllers/profiles'),
    summary = require('../controllers/summary'),
    about = require('../controllers/about');

module.exports.initialize = function(app, passport) {

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

        //==================
        //== Summary View ==
        //==================
        app.get('/summary', summary.index);
        /*app.get('/formapp1/summary/:id', summary.getById);*/

        //================
        //== About View ==
        //================
        app.get('/about', about.index);

        //========================
        //== Profile Management ==
        //========================
        app.get('/profiles/start', profiles.profileStart);
        app.get('/profiles/home', isLoggedIn, profiles.profileHomeScreen);
        app.get('/profiles/logins', isLoggedIn, profiles.profilelogins);
        /*app.get('/profiles/:id', profiles.getById);*/
        /*app.post('/profiles', profiles.add);*/
        /*app.put('/profiles', profiles.update);*/
        /*app.delete('/profiles/:id', profiles.delete);*/

        //===========================
        //== Profile Autentication ==
        //===========================
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

        /** Logout **/
        app.get('/profiles/logout', profiles.logOut);
    
    //===============================================
    //== DEVELOPMENT ROUTES (using localhost:port) ==
    //===============================================
        //===============
        //== Home Page ==
        //===============
        app.get('/formapp1', home.index);

        //==================
        //== Profile View ==
        //==================
        app.get('/formapp1/profiles', profiles.index);

        //==================
        //== Summary View ==
        //==================
        app.get('/formapp1/summary', summary.index);
        /*app.get('/formapp1/summary/:id', summary.getById);*/

        //================
        //== About View ==
        //================
        app.get('/formapp1/about', about.index);

        //========================
        //== Profile Management ==
        //========================
        //== Login Select
        app.get('/formapp1/profiles/start', profiles.profileStart);
        //== Profile Dashboard Home
        app.get('/formapp1/profiles/home', isLoggedIn, profiles.profileHomeScreen);
        /*app.post('/formapp1/profiles/home', isLoggedIn, profiles.profileHomeTry);*/
        //== Profile Dashboard Strengths
        app.get('/formapp1/profiles/strengths', isLoggedIn, profiles.profileStrengthsScreen);
        /*app.post('/formapp1/profiles/strengths', isLoggedIn, profiles.profileStrengthsTry);*/
        //== Profile Dashobard Preferences
        app.get('/formapp1/profiles/preferences', isLoggedIn, profiles.profilePreferencesScreen);
        /*app.post('/formapp1/profiles/preferences', isLoggedIn, profiles.profilePreferencesTry);*/
        //== Profile Dashboard Logins
        app.get('/formapp1/profiles/logins', isLoggedIn, profiles.profilelogins);
        /*app.get('/formapp1/profiles/:id', profiles.getById);*/
        /*app.post('/formapp1/profiles', profiles.add);*/
        /*app.put('/formapp1/profiles', profiles.update);*/
        /*app.delete('/formapp1/profiles/:id', profiles.delete);*/

        //===========================
        //== Profile Autentication ==
        //===========================
        //== Local Login
        app.get('/formapp1/profiles/login', profiles.localLoginScreen);
        app.post('/formapp1/profiles/login', profiles.localLoginTry);
        //== Local Signup
        app.get('/formapp1/profiles/signup', profiles.localSignupScreen);
        app.post('/formapp1/profiles/signup', profiles.localSignupTry);
        //== Local Link
        app.get('/formapp1/profiles/link/local', profiles.localLinkScreen);
        app.post('/formapp1/profiles/link/local', profiles.localLinkTry);
        //== Local Unlink
        app.get('/formapp1/profiles/unlink/local', profiles.unlinkLocal);

        //== Facebook Login
        app.get('/formapp1/profiles/auth/facebook', profiles.sendFacebookAuth);
        app.get('/formapp1/profiles/auth/facebook/callback', profiles.receiveFacebookAuth);
        //== Facebook Link
        app.get('/formapp1/profiles/link/facebook', profiles.sendFacebookLink);
        app.get('/formapp1/profiles/link/facebook/callback', profiles.receiveFacebookLink);
        //== Facebook Unlink
        app.get('/formapp1/profiles/unlink/facebook', profiles.unlinkFacebook);

        //== Google Login
        app.get('/formapp1/profiles/auth/google', profiles.sendGoogleAuth);
        app.get('/formapp1/profiles/auth/google/callback', profiles.receiveGoogleAuth);
        //== Google Link
        app.get('/formapp1/profiles/link/google', profiles.sendGoogleLink);
        app.get('/formapp1/profiles/link/google/callback', profiles.receiveGoogleLink);
        //== Google Unlink
        app.get('/formapp1/profiles/unlink/google', profiles.unlinkGoogle);

        /** Logout **/
        app.get('/formapp1/profiles/logout', profiles.logOut);

};

//======================
//== Route Middleware ==
//======================
//== Make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the profile start page
    res.redirect('/formapp1/profiles/start');
}