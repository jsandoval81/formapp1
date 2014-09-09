"use strict";

var chai              = require("chai"),
    should            = require("chai").should(),
    expect            = require("chai").expect,
    mongoose          = require("mongoose"),
    AdminModel        = require('../models/admin'),
    UserModel         = require('../models/user'),
    profileController = require("../controllers/profiles");

chai.use(require("chai-things"));

//== Before tests run
before(function (done) {
    //== Connect to Mongoose
    mongoose.connect('mongodb://localhost/ti');
    mongoose.connection.on('open', function () {
        done();
    });
});
//== After tests run
after(function () {
    //== Disconnect from Mongoose
    mongoose.disconnect();
});

describe("Database Queries", function () {
    it("should return master value lists from the DB", function () {
        AdminModel.findOne({'adminUser.admin' : 'Y'}, function (err, admin) {
            //== Admin collection should return an object without error
            should.not.exist(err);
            should.exist(admin);
            admin.should.be.an("object");
            //== Admin collection should contain a valid Company list
            expect(admin.companies).to.have.length.above(0);
            admin.companies.should.all.have.property("_id");
            admin.companies.should.all.have.property("display");
            //== Admin collection should contain a valid Department list
            expect(admin.departments).to.have.length.above(0);
            admin.departments.should.all.have.property("_id");
            admin.departments.should.all.have.property("display");
            //== Admin collection should contain a valid Contact Type list
            expect(admin.contactTypes).to.have.length.above(0);
            admin.contactTypes.should.all.have.property("_id");
            admin.contactTypes.should.all.have.property("display");
        });
    });
    it("should return users from the DB", function () {
        UserModel.find(function (err, users) {
            //== User collection should return an object without error
            should.not.exist(err);
            should.exist(users);
            users.should.be.an("array");
            //== Users should all have the correct properties
            expect(users).to.have.length.above(0);
            users.should.all.have.property("_id");
            users.should.all.have.property("strengths");
            users.should.all.have.property("preferences");
        });
    });
});

describe("Profile Controller", function () {
    it("should have the expected methods", function () {
        //== Profile index page
        expect(profileController).to.have.property("index");
        expect(profileController).to.have.property("indexFilter");
        expect(profileController).to.have.property("indexDetail");
        //== Profile start page
        expect(profileController).to.have.property("profileStart");
        //== Profile Home page
        expect(profileController).to.have.property("profileHomeScreen");
        expect(profileController).to.have.property("profileHomeUpdateScreen");
        expect(profileController).to.have.property("profileHomeUpdateTry");
        //== Profile Home - Strengths page
        expect(profileController).to.have.property("profileStrengthsScreen");
        expect(profileController).to.have.property("profileStrengthsTry");
        //== Profile Home - Preferences page
        expect(profileController).to.have.property("profilePreferencesScreen");
        expect(profileController).to.have.property("profilePreferencesTry");
        //== Profile Home - Logins page
        expect(profileController).to.have.property("profileLogins");
        //== Profile Home - Administrator page
        expect(profileController).to.have.property("profileAdministratorScreen");
        expect(profileController).to.have.property("profileAdministratorUser");
        expect(profileController).to.have.property("profileAdministratorTry");
        //== Local Login Controllers
        expect(profileController).to.have.property("localLoginScreen");
        expect(profileController).to.have.property("localLoginTry");
        expect(profileController).to.have.property("localSignupScreen");
        expect(profileController).to.have.property("localSignupTry");
        expect(profileController).to.have.property("localLinkScreen");
        expect(profileController).to.have.property("localLinkTry");
        expect(profileController).to.have.property("unlinkLocal");
        //== LinkedIn Controllers
        expect(profileController).to.have.property("sendLinkedInAuth");
        expect(profileController).to.have.property("receiveLinkedInAuth");
        expect(profileController).to.have.property("sendLinkedInLink");
        expect(profileController).to.have.property("receiveLinkedInLink");
        expect(profileController).to.have.property("unlinkLinkedIn");
        //== Google Contollers
        expect(profileController).to.have.property("sendGoogleAuth");
        expect(profileController).to.have.property("receiveGoogleAuth");
        expect(profileController).to.have.property("sendGoogleLink");
        expect(profileController).to.have.property("receiveGoogleLink");
        expect(profileController).to.have.property("unlinkGoogle");
        //== Facebook Controllers
        expect(profileController).to.have.property("sendFacebookAuth");
        expect(profileController).to.have.property("receiveFacebookAuth");
        expect(profileController).to.have.property("sendFacebookLink");
        expect(profileController).to.have.property("receiveFacebookLink");
        expect(profileController).to.have.property("unlinkFacebook");
        //== Profile Logout
        expect(profileController).to.have.property("logOut");
    });
});


