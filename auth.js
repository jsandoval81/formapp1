
module.exports = {

    'facebookAuth' : {
        'clientID'      : '783874701645107', // your App ID
        'clientSecret'  : '47873931f099db740bbb6b4fbf9133b6', // your App Secret
        'callbackURL'   : 'http://localhost:3100/formapp1/profiles/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'       : 'your-consumer-key-here',
        'consumerSecret'    : 'your-client-secret-here',
        'callbackURL'       : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : '841180780455-qent67j4814p0jlesuj8opknj0n2qdk5.apps.googleusercontent.com',
        'clientSecret'  : 'qCIJHC2p9122TnA0FzQGsazh',
        'callbackURL'   : 'http://127.0.0.1:3100/formapp1/profiles/auth/google/callback'
    }

};