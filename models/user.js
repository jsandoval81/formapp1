
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email        : String,
        password     : String,
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
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    identity         : {
        name            : {
            first       : String,
            last        : String,
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
        department   : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Strengths'}],
        company      : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Strengths'}],
        other        : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Strengths'}]
    },
    preferences      : {
        contact         : {
            method        : String,
            type          : [String]
        },
        officeHours     : {
            arrive        : String,
            depart        : String,
            notes         : String
        },
        meetings        : {
            type          : [String],
            bestDay       : String,
            bestTime      : String,
            amount        : String
        }
    }

});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);