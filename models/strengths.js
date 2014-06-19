
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var strengthsSchema = mongoose.Schema({

    name        : String,
    addDate     : { type: Date, default: Date.now },
    addUser     : { type: mongoose.Schema.Types.ObjectId, ref: 'User'}

});

// create the model for strengths and expose it to our app
module.exports = mongoose.model('Strengths', strengthsSchema);