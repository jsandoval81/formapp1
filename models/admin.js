"use strict";

var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

//== Define the schema for our admin values
var adminSchema = mongoose.Schema({

    adminUser       : {
        email       : [String],
        admin       : String
    },
    adminPassword   : String,
    companies       : [{ display: String, deleted: String, data: [String] }],
    departments     : [{ display: String, deleted: String, data: [String] }],
    contactTypes    : [{ display: String, deleted: String, data: [String] }]

});

//= Create the model for admin and expose it to our app
module.exports = mongoose.model('Admin', adminSchema);