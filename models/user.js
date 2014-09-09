"use strict";

var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

//== Define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email        : String,
        username     : String,
        password     : String
    },
    linkedin         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    identity         : {
        name            : {
            first       : String,
            last        : String,
            email       : String,
            aka         : String
        },
        team            : {
            company     : String,
            department  : String
        },
        role         : String,
        description  : String
    },
    strengths        : {
        department   : [String],
        company      : [String],
        other        : [String]
    },
    preferences      : {
        contact         : {
            help            : [String],
            announcements   : [String],
            brainstorm      : [String],
            avoid           : [String]
        },
        officeHours     : {
            arrive        : String,
            depart        : String,
            notes         : String
        },
        meetings        : {
            bestDay       : String,
            bestTime      : String,
            amount        : String,
            notes         : String
        }
    }

});

//=============
//== Methods ==
//=============
//== Generate a hash
userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
//== Check if password is valid
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.local.password);
};
//== Create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);