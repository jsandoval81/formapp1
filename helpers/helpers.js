"use strict";

var md5 = require('MD5');

module.exports = {
    //======================================
    //== Find user's "main" email address ==
    //======================================
    findEmailAddress: function (user) {
        //== Set the default value
        var userEmail = '';
        //== Cascade through emails in a priority order
        if (user.linkedin.email) {
            userEmail = user.linkedin.email;
        } else if (user.google.email) {
            userEmail = user.google.email;
        } else if (user.facebook.email) {
            userEmail = user.facebook.email;
        } else if (user.local.email) {
            userEmail = user.local.email;
        }
        //== Return the email
        return userEmail;
    },
    //=================================
    //== Hash encrypt the user email ==
    //=================================
    hashEmailAddress: function (user) {
        //== Get user email
        var userEmail = module.exports.findEmailAddress(user),
            hashEmail = '';
        //== Hash the email address
        if (userEmail) {
            hashEmail = md5(userEmail);
        }
        //== Return hashed email
        return hashEmail;
    },
    //===========================
    //== Sort array of objects ==
    //===========================
    byObjectArray: function (field, reverse, primer, then) {
        var key = function (x) { return primer ? primer(x[field]) : x[field]; };
        return function (a, b) {
            var A = key(a),
                B = key(b);
            return (
                (A < B) ? -1 : (
                    (A > B) ? 1 : (
                        (typeof then === 'function') ? then(a, b) : 0
                    )
                )
            ) * [1, -1][+!!reverse];
        };
    }

};

