
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var preferencesSchema = mongoose.Schema({

	   

});

// create the model for preferences and expose it to our app
module.exports = mongoose.model('Preferences', preferencesSchema);