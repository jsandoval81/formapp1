'use strict';

var passport    = require('passport');
var mongoose    = require('mongoose');
var NodePromise = require('promise');
var md5         = require('MD5');
var helpers     = require('../helpers/helpers');
var UserModel   = require('../models/user');
var AdminModel  = require('../models/admin');

module.exports = {
    //================================
    //== PROFILE VIEWER CONTROLLERS ==
    //================================
    index: function (req, res) {
        //== Set default variables
        var filterSelections       = { 'companies': [], 'departments': [] },
            adminCompaniesLength   = 0,
            adminDepartmentsLength = 0,
            i                      = 0;
        //== Populate DB-driven attributes and render EJS template
        AdminModel.findOne({'adminUser.admin': 'Y'}, function (err, admin) {
            //== Cache the array lengths
            adminCompaniesLength   = admin.companies.length;
            adminDepartmentsLength = admin.departments.length;
            //== Create Company selection options
            for (i = 0; i < adminCompaniesLength; i += 1) {
                if (i === 0) {
                    filterSelections.companies.push({ "value": "", "display": " ", "selected": "no" });
                }
                if (admin.companies[i].deleted !== 'Y') {
                    if (req.user && req.user.identity.team.company && req.user.identity.team.company === admin.companies[i]._id.toString()) {
                        filterSelections.companies.push({ "value": admin.companies[i]._id, "display": admin.companies[i].display, "selected": "yes" });
                    } else {
                        filterSelections.companies.push({ "value": admin.companies[i]._id, "display": admin.companies[i].display, "selected": "no" });
                    }
                }
            }
            //== Sort Companies
            filterSelections.companies.sort(helpers.byObjectArray('display', false, function (x) { return x.toUpperCase(); }));
            //== Create Department selection options
            for (i = 0; i < adminDepartmentsLength; i += 1) {
                if (i === 0) {
                    filterSelections.departments.push({ "value": "", "display": " ", "selected": "no" });
                }
                if (admin.departments[i].deleted !== 'Y') {
                    if (req.user && req.user.identity.team.department && req.user.identity.team.department === admin.departments[i]._id.toString()) {
                        filterSelections.departments.push({ "value": admin.departments[i]._id, "display": admin.departments[i].display, "selected": "yes" });
                    } else {
                        filterSelections.departments.push({ "value": admin.departments[i]._id, "display": admin.departments[i].display, "selected": "no" });
                    }
                }
            }
            //== Sort Departments
            filterSelections.departments.sort(helpers.byObjectArray('display', false, function (x) { return x.toUpperCase(); }));
            //== Render the EJS template
            res.render('profile-index', {
                title: 'Profiles',
                filterSelections: filterSelections
            });
        });
    },

    indexFilter: function (req, res) {
        //== Set default variables
        var profileList                = [],
            contactTypes               = [],
            adminContactTypesLength    = 0,
            contactTypesLength         = 0,
            currentProfile             = {},
            profileDepartmentStrengths = 0,
            profileCompanyStrengths    = 0,
            hashEmail                  = '',
            helpContact                = '',
            i                          = 0,
            //== Get contact type display values from DB
            queryPromise   = new NodePromise(function (resolve, reject) {
                AdminModel.findOne({'adminUser.admin': 'Y'}, function (err, admin) {
                    //== Cache attay lengths
                    adminContactTypesLength = admin.contactTypes.length;
                    //== Populate local arrays
                    for (i = 0; i < adminContactTypesLength; i += 1) {
                        if (admin.contactTypes[i].deleted !== 'Y') {
                            contactTypes.push(admin.contactTypes[i]);
                        }
                    }
                    if (err) {
                        reject(err);
                    } else {
                        resolve(contactTypes);
                    }
                });
            });
        //== Fetch profiles from DB
        queryPromise.then(function (result) {
            UserModel.find({ $and : [ { "identity.team.company" : req.body.company },
                                 { "identity.team.department" : req.body.department } ] }, function (err, profiles) {
                //== Create HTML-ready profiles list object
                profiles.forEach(function (profile) {
                    currentProfile = {};
                    //== Find an email for Gravatar
                    hashEmail = helpers.hashEmailAddress(profile);
                    //== Populate the profile attributes
                    currentProfile.id           = profile._id;
                    currentProfile.hashEmail    = hashEmail;
                    currentProfile.name         = profile.identity.name.last + ', ' + profile.identity.name.first;
                    currentProfile.role         = profile.identity.role;
                    currentProfile.schedule     = profile.preferences.officeHours.arrive + ' to ' + profile.preferences.officeHours.depart;
                    currentProfile.scheduleNote = profile.preferences.officeHours.notes;
                    currentProfile.meetingDay   = profile.preferences.meetings.bestDay;
                    currentProfile.meetingTime  = profile.preferences.meetings.bestTime;
                    //== Find 1st help contact preference
                    helpContact = '';
                    contactTypesLength = contactTypes.length;
                    if (profile.preferences.contact.help[0]) {
                        for (i = 0; i < contactTypesLength; i += 1) {
                            if (contactTypes[i]._id.toString() === profile.preferences.contact.help[0]) {
                                helpContact = contactTypes[i].display;
                                break;
                            }
                        }
                        currentProfile.helpContact = helpContact;
                    }
                    //== Aggregate strengths
                    currentProfile.strengths   = '';
                    profileDepartmentStrengths = profile.strengths.department.length;
                    profileCompanyStrengths    = profile.strengths.company.length;
                    for (i = 0; i < profileDepartmentStrengths; i += 1) {
                        if (currentProfile.strengths === '') {
                            currentProfile.strengths += profile.strengths.department[i];
                        } else {
                            currentProfile.strengths += ', ' + profile.strengths.department[i];
                        }
                    }
                    for (i = 0; i < profileCompanyStrengths; i += 1) {
                        if (currentProfile.strengths === '') {
                            currentProfile.strengths += profile.strengths.company[i];
                        } else {
                            currentProfile.strengths += ', ' + profile.strengths.company[i];
                        }
                    }
                    //== Add profile to profile list
                    profileList.push(currentProfile);
                });
                //== Sort array on name
                profileList.sort(helpers.byObjectArray('name', false, function (x) { return x.toUpperCase(); }));
                //== Render the EJS template and send the profile list
                res.render('profile-list', {
                    title: 'Profiles',
                    profileList: profileList
                });
            });
        });
    },

    indexDetail: function (req, res) {
        //== Set default variables
        var adminContactTypesLength = 0,
            adminCompaniesLength    = 0,
            adminDepartmentsLength  = 0,
            contactTypes            = [],
            companies               = [],
            departments             = [],
            contactTypesLength      = 0,
            companiesLength         = 0,
            departmentsLength       = 0,
            hashEmail               = '',
            i                       = 0,
            j                       = 0,
            //== Get admin display values from DB
            queryPromise = new NodePromise(function (resolve, reject) {
                AdminModel.findOne({'adminUser.admin': 'Y'}, function (err, admin) {
                     //== Cache array lengths
                    adminContactTypesLength = admin.contactTypes.length;
                    adminCompaniesLength    = admin.companies.length;
                    adminDepartmentsLength  = admin.departments.length;
                    //== Populate local arrays
                    for (i = 0; i < adminContactTypesLength; i += 1) {
                        if (admin.contactTypes[i].deleted !== 'Y') {
                            contactTypes.push(admin.contactTypes[i]);
                        }
                    }
                    for (i = 0; i < adminCompaniesLength; i += 1) {
                        if (admin.companies[i].deleted !== 'Y') {
                            companies.push(admin.companies[i]);
                        }
                    }
                    for (i = 0; i < adminDepartmentsLength; i += 1) {
                        if (admin.departments[i].deleted !== 'Y') {
                            departments.push(admin.departments[i]);
                        }
                    }
                    if (err) {
                        reject(err);
                    } else {
                        resolve(contactTypes);
                        resolve(companies);
                        resolve(departments);
                    }
                });
            });
        //== Fetch the selected profile detail from the DB
        queryPromise.then(function (result) {
            UserModel.findOne({'_id' : req.body.profileID}, { 'strengths': 1,
                                                              'preferences': 1,
                                                              'identity': 1,
                                                              'linkedin.email': 1,
                                                              'google.email': 1,
                                                              'facebook.email': 1,
                                                              'local.email': 1 }, function (err, profile) {
                //== Find an email for Gravatar
                hashEmail = helpers.hashEmailAddress(profile);
                //== Remove sensitive data from object before sending to template
                profile.linkedin = undefined;
                profile.google   = undefined;
                profile.facebook = undefined;
                profile.local    = undefined;
                //== Cache the array lengths
                contactTypesLength = contactTypes.length;
                companiesLength    = companies.length;
                departmentsLength  = departments.length;
                //== Decode the company name
                for (i = 0; i < companiesLength; i += 1) {
                    if (companies[i]._id.toString() === profile.identity.team.company) {
                        profile.identity.team.company = companies[i].display;
                    }
                }
                //== Decode the department name 
                for (i = 0; i < departmentsLength; i += 1) {
                    if (departments[i]._id.toString() === profile.identity.team.department) {
                        profile.identity.team.department = departments[i].display;
                    }
                }
                //== Decode the contact types
                for (i = 0; i < 3; i += 1) {
                    for (j = 0; j < contactTypesLength; j += 1) {

                        if (profile.preferences.contact.help[i] && profile.preferences.contact.help[i] === contactTypes[j]._id.toString()) {
                            profile.preferences.contact.help[i] = contactTypes[j].display;
                        }
                        if (profile.preferences.contact.announcements[i] && profile.preferences.contact.announcements[i] === contactTypes[j]._id.toString()) {
                            profile.preferences.contact.announcements[i] = contactTypes[j].display;
                        }
                        if (profile.preferences.contact.brainstorm[i] && profile.preferences.contact.brainstorm[i] === contactTypes[j]._id.toString()) {
                            profile.preferences.contact.brainstorm[i] = contactTypes[j].display;
                        }
                        if (profile.preferences.contact.avoid[i] && profile.preferences.contact.avoid[i] === contactTypes[j]._id.toString()) {
                            profile.preferences.contact.avoid[i] = contactTypes[j].display;
                        }

                    }
                }
                //== Render the EJS template
                res.render('profile-detail', {
                    title:    'Profiles',
                    profile:   profile,
                    hashEmail: hashEmail
                });
            });
        });
    },

    //====================================
    //== PROFILE MANAGEMENT CONTROLLERS ==
    //====================================
    profileStart: function (req, res) {
        //== Render the EJS template
        res.render('profile-start', {
            title: 'Profiles'
        });
    },

    profileHomeScreen: function (req, res) {
        var firstName              = '',
            lastName               = '',
            company                = '',
            department             = '',
            role                   = '',
            description            = '',
            adminEmailLength       = 0,
            adminCompaniesLength   = 0,
            adminDepartmentsLength = 0,
            hashEmail              = '',
            userEmail              = '',
            isAdmin                = false,
            a                      = 0,
            i                      = 0;
        //== Spit out First Name and Last Name as-is
        if (req.user.identity.name.first) { firstName = req.user.identity.name.first; }
        if (req.user.identity.name.last) { lastName = req.user.identity.name.last; }
        //== Spit out Role and Description as-is
        if (req.user.identity.role) { role = req.user.identity.role; }
        if (req.user.identity.description) { description = req.user.identity.description; }
        //== Find an email for Gravatar
        hashEmail = helpers.hashEmailAddress(req.user);
        //== Populate DB-driven attributes and render EJS template
        AdminModel.findOne({'adminUser.admin': 'Y'}, function (err, admin) {
            //== Cache array lengths
            adminEmailLength       = admin.adminUser.email.length;
            adminCompaniesLength   = admin.companies.length;
            adminDepartmentsLength = admin.departments.length;
            //== Determine Admin privs
            isAdmin = false;
            userEmail = helpers.findEmailAddress(req.user);
            for (a = 0; a < adminEmailLength; a += 1) {
                if (userEmail === admin.adminUser.email[a]) {
                    isAdmin = true;
                    break;
                }
            }
            //== Populate the Company name
            if (req.user.identity.team.company) {
                company = 'Unknown Company';
                for (i = 0; i < adminCompaniesLength; i += 1) {
                    if (req.user.identity.team.company === admin.companies[i]._id.toString() && admin.companies[i].deleted !== 'Y') {
                        company = admin.companies[i].display;
                        break;
                    }
                }
            } else {
                company = '';
            }
            //== Populate the Department name
            if (req.user.identity.team.department) {
                department = 'Unknown Team';
                for (i = 0; i < adminDepartmentsLength; i += 1) {
                    if (req.user.identity.team.department === admin.departments[i]._id.toString() && admin.departments[i].deleted !== 'Y') {
                        department = admin.departments[i].display;
                        break;
                    }
                }
            } else {
                department = '';
            }
            //== Render the EJS template
            res.render('profile-home', {
                title:      'Profiles',
                user:        req.user,
                hashEmail:   hashEmail,
                firstName:   firstName,
                lastName:    lastName,
                company:     company,
                department:  department,
                role:        role,
                description: description,
                isAdmin:     isAdmin
            });
        });
    },

    profileHomeUpdateScreen: function (req, res) {
        //== Set default variables
        var profileSelections      = { 'companies': [], 'departments': [] },
            adminEmailLength       = 0,
            adminCompaniesLength   = 0,
            adminDepartmentsLength = 0,
            formInfo               = {},
            firstName              = '',
            lastName               = '',
            role                   = '',
            description            = '',
            hashEmail              = '',
            userEmail              = '',
            isAdmin                = false,
            a                      = 0,
            i                      = 0;
        //== Spit out First Name and Last Name as-is
        if (req.user.identity.name.first) { firstName = req.user.identity.name.first; }
        if (req.user.identity.name.last) { lastName = req.user.identity.name.last; }
        //== Spit out Role and Description as-is
        if (req.user.identity.role) { role = req.user.identity.role; }
        if (req.user.identity.description) { description = req.user.identity.description; }
        //== Find an email for Gravatar
        hashEmail = helpers.hashEmailAddress(req.user);
        //== Compile flash messages into error object
        formInfo.firstNameError = req.flash('firstNameError');
        formInfo.lastNameError  = req.flash('lastNameError');
        //== Populate DB-driven attributes and render EJS template
        AdminModel.findOne({'adminUser.admin': 'Y'}, function (err, admin) {
            //== Cache array lengths
            adminEmailLength       = admin.adminUser.email.length;
            adminCompaniesLength   = admin.companies.length;
            adminDepartmentsLength = admin.departments.length;
            //== Determine Admin privs
            isAdmin = false;
            userEmail = helpers.findEmailAddress(req.user);
            for (a = 0; a < adminEmailLength; a += 1) {
                if (userEmail === admin.adminUser.email[a]) {
                    isAdmin = true;
                    break;
                }
            }
            //== Generate Company names
            for (i = 0; i < adminCompaniesLength; i += 1) {
                if (i === 0) {
                    profileSelections.companies.push({ "value": "", "display": "", "selected": "no" });
                }
                if (admin.companies[i].deleted !== 'Y') {
                    if (req.user.identity.team.company && req.user.identity.team.company === admin.companies[i]._id.toString()) {
                        profileSelections.companies.push({ "value": admin.companies[i]._id, "display": admin.companies[i].display, "selected": "yes" });
                    } else {
                        profileSelections.companies.push({ "value": admin.companies[i]._id, "display": admin.companies[i].display, "selected": "no" });
                    }
                }
            }
            //== Sort Company names
            profileSelections.companies.sort(helpers.byObjectArray('display', false, function (x) { return x.toUpperCase(); }));
            //== Generate Department names
            for (i = 0; i < adminDepartmentsLength; i += 1) {
                if (i === 0) {
                    profileSelections.departments.push({ "value": "", "display": "", "selected": "no" });
                }
                if (admin.departments[i].deleted !== 'Y') {
                    if (req.user.identity.team.department && req.user.identity.team.department === admin.departments[i]._id.toString()) {
                        profileSelections.departments.push({ "value": admin.departments[i]._id, "display": admin.departments[i].display, "selected": "yes" });
                    } else {
                        profileSelections.departments.push({ "value": admin.departments[i]._id, "display": admin.departments[i].display, "selected": "no" });
                    }
                }
            }
            //== Sort Department names
            profileSelections.departments.sort(helpers.byObjectArray('display', false, function (x) { return x.toUpperCase(); }));
            //== Render the EJS template
            res.render('profile-home-update', {
                title:            'Profiles',
                user:              req.user,
                hashEmail:         hashEmail,
                firstName:         firstName,
                lastName:          lastName,
                profileSelections: profileSelections,
                role:              role,
                description:       description,
                formInfo:          formInfo,
                isAdmin:           isAdmin
            });
        });
    },

    profileHomeUpdateTry: function (req, res) {
        //== Set default variables
        var dbUpdate   = true,
            numUpdates = 0;
        //== Update profile First Name (not nullable)
        if (req.body.firstName && req.body.firstName.trim() !== '') {
            if (req.user.identity.name.first !== req.body.firstName) {
                req.user.identity.name.first = req.body.firstName;
                numUpdates += 1;
            }
        } else {
            dbUpdate = false;
            req.flash('firstNameError', 'First Name is required');
        }
        //== Update profile Last Name (not nullable)
        if (req.body.lastName && req.body.lastName.trim() !== '') {
            if (req.user.identity.name.last !== req.body.lastName) {
                req.user.identity.name.last = req.body.lastName;
                numUpdates += 1;
            }
        } else {
            dbUpdate = false;
            req.flash('lastNameError', 'Last Name is required');
        }
        //== Update profile Company (nullable)
        if (req.body.company) {
            if (req.user.identity.team.company !== req.body.company) {
                req.user.identity.team.company = req.body.company;
                numUpdates += 1;
            }
        } else {
            req.user.identity.team.company = '';
            numUpdates += 1;
        }
        //== Update profile Department (nullable)
        if (req.body.department) {
            if (req.user.identity.team.department !== req.body.department) {
                req.user.identity.team.department = req.body.department;
                numUpdates += 1;
            }
        } else {
            req.user.identity.team.department = '';
            numUpdates += 1;
        }
        //== Update profile Role (nullable)
        if (req.body.role) {
            if (req.user.identity.role !== req.body.role) {
                req.user.identity.role = req.body.role;
                numUpdates += 1;
            }
        } else {
            req.user.identity.role = '';
            numUpdates += 1;
        }
        //== Update profile Description (nullable)
        if (req.body.description) {
            if (req.user.identity.description !== req.body.description) {
                req.user.identity.description = req.body.description;
                numUpdates += 1;
            }
        } else {
            req.user.identity.description = '';
            numUpdates += 1;
        }
        //== Update the user in the DB, handle errors, respond with status
        if (dbUpdate === true && numUpdates > 0) {
            req.user.save(function (err) {
                if (err) {
                    res.redirect('/ti/profiles/home/update');
                } else {
                    res.redirect('/ti/profiles/home');
                }
            });
        } else if (dbUpdate === true && numUpdates === 0) {
            res.redirect('/ti/profiles/home');
        } else {
            res.redirect('/ti/profiles/home/update');
        }
    },

    profileStrengthsScreen: function (req, res) {
        //== Set default variables
        var teamName               = 'your team',
            companyName            = 'your company',
            teamStrengthVar        = '',
            companyStrengthVar     = '',
            otherStrengthVar       = '',
            userEmail              = '',
            isAdmin                = false,
            adminEmailLength       = 0,
            adminCompaniesLength   = 0,
            adminDepartmentsLength = 0,
            a                      = 0,
            i                      = 0;
        //== Get Team strengths
        req.user.strengths.department.forEach(function (strength, i) {
            if (i === 0) {
                teamStrengthVar += strength;
            } else {
                teamStrengthVar += ',' + strength;
            }
        });
        //== Get Company strengths
        req.user.strengths.company.forEach(function (strength, i) {
            if (i === 0) {
                companyStrengthVar += strength;
            } else {
                companyStrengthVar += ',' + strength;
            }
        });
        //== Get Other strengths
        req.user.strengths.other.forEach(function (strength, i) {
            if (i === 0) {
                otherStrengthVar += strength;
            } else {
                otherStrengthVar += ',' + strength;
            }
        });
        //== Populate DB-driven attributes and render EJS template
        AdminModel.findOne({'adminUser.admin': 'Y'}, function (err, admin) {
            //== Cache array lengths
            adminEmailLength       = admin.adminUser.email.length;
            adminCompaniesLength   = admin.companies.length;
            adminDepartmentsLength = admin.departments.length;
            //== Determine Admin privs
            isAdmin = false;
            userEmail = helpers.findEmailAddress(req.user);
            for (a = 0; a < adminEmailLength; a += 1) {
                if (userEmail === admin.adminUser.email[a]) {
                    isAdmin = true;
                    break;
                }
            }
            //== Get Team Name
            if (req.user.identity.team.department) {
                for (i = 0; i < adminDepartmentsLength; i += 1) {
                    if (admin.departments[i].deleted !== 'Y' && req.user.identity.team.department === admin.departments[i]._id.toString()) {
                        teamName = 'the ' + admin.departments[i].display + ' team';
                    }
                }
            }
            //== Get Company Name
            if (req.user.identity.team.company) {
                for (i = 0; i < adminCompaniesLength; i += 1) {
                    if (admin.companies[i].deleted !== 'Y' && req.user.identity.team.company === admin.companies[i]._id.toString()) {
                        companyName = admin.companies[i].display;
                    }
                }
            }
            //== Render the EJS template
            res.render('profile-home-strengths', {
                title:           'Profiles',
                user:             req.user,
                teamName:         teamName,
                companyName:      companyName,
                teamStrengths:    teamStrengthVar,
                companyStrengths: companyStrengthVar,
                otherStrengths:   otherStrengthVar,
                isAdmin:          isAdmin
            });
        });
    },

    profileStrengthsTry: function (req, res) {
        var strengthsArr = [],
            action       = '',
            i            = 0;
        //== Determine which strengths to update
        if (req.body.type === 'Team') {
            strengthsArr = req.user.strengths.department;
        }
        if (req.body.type === 'Company') {
            strengthsArr = req.user.strengths.company;
        }
        if (req.body.type === 'Other') {
            strengthsArr = req.user.strengths.other;
        }
        //== Add strength (arrays already exist in model)
        if (req.body.action === 'Add') {
            strengthsArr.push(req.body.tag);
            action = 'added to';
        }
        //== Remove strength (arrays already exist in model)
        if (req.body.action === 'Remove') {
            for (i = strengthsArr.length - 1; i >= 0; i -= 1) {
                if (strengthsArr[i] === req.body.tag) {
                    strengthsArr.splice(i, 1);
                }
            }
            action = 'removed from';
        }
        //== Update the user in the DB, handle errors, respond with status
        req.user.save(function (err) {
            if (err) {
                res.send('SERVER ERROR: Tag "' + req.body.tag + '" NOT ' + action + ' your ' + req.body.type + ' strengths');
            } else {
                res.send('Tag "' + req.body.tag + '" ' + action + ' your ' + req.body.type + ' strengths!');
            }
        });
    },

    profilePreferencesScreen: function (req, res) {
        //== Get the preferences object
        var prefsArr = req.user.preferences,
            //== Create object of arrays for contact preferences
            contactHelp       = { 'firstChoice': [], 'secondChoice': [], 'thirdChoice': [] },
            contactAnnounce   = { 'firstChoice': [], 'secondChoice': [], 'thirdChoice': [] },
            contactBrainstorm = { 'firstChoice': [], 'secondChoice': [], 'thirdChoice': [] },
            contactAvoid      = { 'firstChoice': [], 'secondChoice': [], 'thirdChoice': [] },
            meetingPrefs      = { 'bestDay': [], 'bestTime': [] },
            //== Set the Day values
            daysOfWeek = [ { "value": "",    "display": " " },
                           { "value": "Mon", "display": "Monday" },
                           { "value": "Tue", "display": "Tuesday" },
                           { "value": "Wed", "display": "Wednesday" },
                           { "value": "Thu", "display": "Thursday" },
                           { "value": "Fri", "display": "Friday" } ],
            //== Set the time of day values
            timesOfDay = [ { "value": "",   "display": " " },
                           { "value": "AM", "display": "Morning" },
                           { "value": "PM", "display": "Afternoon" } ],
            //== Set default variables
            adminEmailLength        = 0,
            adminContactTypesLength = 0,
            daysOfWeekLength        = 0,
            timesOfDayLength        = 0,
            helpChoice              = [],
            announceChoice          = [],
            brainstormChoice        = [],
            avoidChoice             = [],
            contactHelpNum          = -1,
            contactAnnounceNum      = -1,
            contactBrainstormNum    = -1,
            contactAvoidNum         = -1,
            choiceCount             = 0,
            userEmail               = '',
            timePrefs               = {},
            isAdmin                 = false,
            a                       = 0,
            i                       = 0,
            j                       = 0,
            stringSort              = function (x) { return x.toUpperCase(); };
        //== Create HTML-ready Contact Type lists
        if (prefsArr.contact.help) { contactHelpNum = prefsArr.contact.help.length; }
        if (prefsArr.contact.announcements) { contactAnnounceNum = prefsArr.contact.announcements.length; }
        if (prefsArr.contact.brainstorm) { contactBrainstormNum = prefsArr.contact.brainstorm.length; }
        if (prefsArr.contact.avoid) { contactAvoidNum = prefsArr.contact.avoid.length; }
        //== Populate DB-driven attributes and render EJS template
        AdminModel.findOne({'adminUser.admin': 'Y'}, function (err, admin) {
            var choiceOrdinal;
            //== Cache array lengths
            adminEmailLength = admin.adminUser.email.length;
            //== Determine Admin privs
            isAdmin = false;
            userEmail = helpers.findEmailAddress(req.user);
            for (a = 0; a < adminEmailLength; a += 1) {
                if (userEmail === admin.adminUser.email[a]) {
                    isAdmin = true;
                    break;
                }
            }
            //== Populate Contact preferences
            for (choiceOrdinal in contactHelp) {
                if (contactHelp.hasOwnProperty(choiceOrdinal)) {
                    helpChoice       = contactHelp[choiceOrdinal];
                    announceChoice   = contactAnnounce[choiceOrdinal];
                    brainstormChoice = contactBrainstorm[choiceOrdinal];
                    avoidChoice      = contactAvoid[choiceOrdinal];
                    //== Create blank selections as first value
                    helpChoice.push({ "value": "", "display": " ", "selected": "no" });
                    announceChoice.push({ "value": "", "display": " ", "selected": "no" });
                    brainstormChoice.push({ "value": "", "display": " ", "selected": "no" });
                    avoidChoice.push({ "value": "", "display": " ", "selected": "no" });
                    //== Sort Contact Type values
                    admin.contactTypes.sort(helpers.byObjectArray('display', false, stringSort));
                    //== Cache array length
                    adminContactTypesLength = admin.contactTypes.length;
                    //== Create HTML-ready user selections
                    for (j = 0; j < adminContactTypesLength; j += 1) {
                        if (admin.contactTypes[j].deleted !== 'Y') {
                            //== Help Contact <option> definitions
                            if (contactHelpNum > choiceCount && prefsArr.contact.help[choiceCount] === admin.contactTypes[j]._id.toString()) {
                                helpChoice.push({ "value": admin.contactTypes[j]._id, "display": admin.contactTypes[j].display, "selected": "yes" });
                            } else {
                                helpChoice.push({ "value": admin.contactTypes[j]._id, "display": admin.contactTypes[j].display, "selected": "no" });
                            }
                            //== Announcement Contact <option> definitions
                            if (contactAnnounceNum >= choiceCount && prefsArr.contact.announcements[choiceCount] === admin.contactTypes[j]._id.toString()) {
                                announceChoice.push({ "value": admin.contactTypes[j]._id, "display": admin.contactTypes[j].display, "selected": "yes" });
                            } else {
                                announceChoice.push({ "value": admin.contactTypes[j]._id, "display": admin.contactTypes[j].display, "selected": "no" });
                            }
                            //== Brainstorm Contact <option> definitions
                            if (contactBrainstormNum >= choiceCount && prefsArr.contact.brainstorm[choiceCount] === admin.contactTypes[j]._id.toString()) {
                                brainstormChoice.push({ "value": admin.contactTypes[j]._id, "display": admin.contactTypes[j].display, "selected": "yes" });
                            } else {
                                brainstormChoice.push({ "value": admin.contactTypes[j]._id, "display": admin.contactTypes[j].display, "selected": "no" });
                            }
                            //== Avoid Contact <option> definitions
                            if (contactAvoidNum >= choiceCount && prefsArr.contact.avoid[choiceCount] === admin.contactTypes[j]._id.toString()) {
                                avoidChoice.push({ "value": admin.contactTypes[j]._id, "display": admin.contactTypes[j].display, "selected": "yes" });
                            } else {
                                avoidChoice.push({ "value": admin.contactTypes[j]._id, "display": admin.contactTypes[j].display, "selected": "no" });
                            }
                        }
                    }
                    choiceCount += 1;
                }
            }
            //== Meeting Day preferences
            daysOfWeekLength = daysOfWeek.length;
            for (i = 0; i < daysOfWeekLength; i += 1) {
                if (prefsArr.meetings.bestDay === daysOfWeek[i].value) {
                    meetingPrefs.bestDay.push({ "value": daysOfWeek[i].value, "display": daysOfWeek[i].display, "selected": "yes" });
                } else {
                    meetingPrefs.bestDay.push({ "value": daysOfWeek[i].value, "display": daysOfWeek[i].display, "selected": "no" });
                }
            }
            //== Meeting Time preferences
            timesOfDayLength = timesOfDay.length;
            for (i = 0; i < timesOfDayLength; i += 1) {
                if (prefsArr.meetings.bestTime === timesOfDay[i].value) {
                    meetingPrefs.bestTime.push({ "value": timesOfDay[i].value, "display": timesOfDay[i].display, "selected": "yes" });
                } else {
                    meetingPrefs.bestTime.push({ "value": timesOfDay[i].value, "display": timesOfDay[i].display, "selected": "no" });
                }
            }
            //== Office Hours preferences
            timePrefs = {};
            if (prefsArr.officeHours.arrive) { timePrefs.arrive = prefsArr.officeHours.arrive; } else { timePrefs.arrive = ''; }
            if (prefsArr.officeHours.depart) { timePrefs.depart = prefsArr.officeHours.depart; } else { timePrefs.depart = ''; }
            if (prefsArr.officeHours.notes) { timePrefs.notes = prefsArr.officeHours.notes;  } else { timePrefs.notes = ''; }
            //== Render EJS template
            res.render('profile-home-preferences', {
                title:            'Profiles',
                user:              req.user,
                contactHelp:       contactHelp,
                contactAnnounce:   contactAnnounce,
                contactBrainstorm: contactBrainstorm,
                contactAvoid:      contactAvoid,
                meetingPrefs:      meetingPrefs,
                timePrefs:         timePrefs,
                isAdmin:           isAdmin
            });
        });
    },

    profilePreferencesTry: function (req, res) {
        //== Set default variables
        var dbUpdate   = true,
            numUpdates = 0,
            prefsArr   = [],
            index      = 0;
        //== Update contact preferences
        if (req.body.prefType === 'contact') {
            //== Determine the DB field to update
            if (req.body.typeCategory === 'help') {
                prefsArr = req.user.preferences.contact.help;
            } else if (req.body.typeCategory === 'announcements') {
                prefsArr = req.user.preferences.contact.announcements;
            } else if (req.body.typeCategory === 'brainstorm') {
                prefsArr = req.user.preferences.contact.brainstorm;
            } else if (req.body.typeCategory === 'avoid') {
                prefsArr = req.user.preferences.contact.avoid;
            }
            //== Set the index value
            index = Number(req.body.choiceNum) - 1;
            //== Update the user document (because arrays already exist)
            if (req.body.choiceValue && req.body.choiceValue.trim() !== '') {
                prefsArr.splice(index, 1, req.body.choiceValue);
                numUpdates += 1;
            } else {
                prefsArr.splice(index);
                numUpdates += 1;
            }
        //== Update meeting preferences
        } else if (req.body.prefType === 'meetings') {
            if (req.body.typeCategory === 'best-day') {
                if (req.body.choiceValue && req.body.choiceValue.trim() !== '') {
                    req.user.preferences.meetings.bestDay = req.body.choiceValue;
                    numUpdates += 1;
                }
            } else if (req.body.typeCategory === 'best-time') {
                if (req.body.choiceValue && req.body.choiceValue.trim() !== '') {
                    req.user.preferences.meetings.bestTime = req.body.choiceValue;
                    numUpdates += 1;
                }
            }
        //== Update Office Hours (Time) preferences
        } else if (req.body.prefType === 'time') {
            if (req.body.typeCategory === 'arrive') {
                if (req.body.choiceValue && req.body.choiceValue.trim() !== '') {
                    req.user.preferences.officeHours.arrive = req.body.choiceValue;
                    numUpdates += 1;
                }
            } else if (req.body.typeCategory === 'depart') {
                if (req.body.choiceValue && req.body.choiceValue.trim() !== '') {
                    req.user.preferences.officeHours.depart = req.body.choiceValue;
                    numUpdates += 1;
                }
            } else if (req.body.typeCategory === 'note') {
                if (req.body.choiceValue && req.body.choiceValue.trim() !== '') {
                    req.user.preferences.officeHours.notes = req.body.choiceValue;
                    numUpdates += 1;
                }
            }
        }
        //== Update the user in the DB, handle errors, respond with status
        if (dbUpdate === true && numUpdates > 0) {
            req.user.save(function (err) {
                if (err) {
                    res.send('SERVER ERROR: Preference not updated');
                } else {
                    //== Return the prefType and typeCategory as a CSS class
                    res.send('.' + req.body.prefType + '-' + req.body.typeCategory);
                }
            });
        } else {
            res.send('null');
        }
    },

    profileAdministratorScreen: function (req, res) {
        //== Set default values
        var adminOptions           = { 'companies': [], 'departments': [], 'contactTypes': [] },
            companiesLength        = 0,
            adminEmailLength       = 0,
            adminCompaniesLength   = 0,
            adminDepartmentsLength = 0,
            adminContactTypeLength = 0,
            userEmail              = '',
            isAdmin                = false,
            userList               = [],
            firstName              = '',
            lastName               = '',
            companyName            = '',
            a                      = 0,
            i                      = 0,
            //== Get list and menu values from DB
            queryPromise   = new NodePromise(function (resolve, reject) {
                //== Populate DB-driven attributes
                AdminModel.findOne({'adminUser.admin': 'Y'}, function (err, admin) {
                    //== If admin collection doesn't exist, create it
                    if (!admin) {
                        admin                 = new AdminModel();
                        admin.adminUser.email = [ "john.x.sandoval@gmail.com" ];
                        admin.adminUser.admin = 'Y';
                        admin.save(function (err) {
                            if (err) {
                                res.send('Error creating Admin collection');
                            } else {
                                res.redirect('/ti/profiles/administrator');
                            }
                        });
                    //== If admin colleciton exists, read it
                    } else {
                        //== Determine Admin privs
                        isAdmin = false;
                        userEmail = helpers.findEmailAddress(req.user);
                        adminEmailLength = admin.adminUser.email.length;
                        for (a = 0; a < adminEmailLength; a += 1) {
                            if (userEmail === admin.adminUser.email[a]) {
                                isAdmin = true;
                                break;
                            }
                        }
                        //== Determine number of values per array
                        adminCompaniesLength   = admin.companies.length;
                        adminDepartmentsLength = admin.departments.length;
                        adminContactTypeLength = admin.contactTypes.length;
                        //== Build Company list
                        for (i = 0; i < adminCompaniesLength; i += 1) {
                            if (admin.companies[i].deleted !== 'Y') {
                                adminOptions.companies.push({ "value": admin.companies[i]._id, "display": admin.companies[i].display });
                            }
                        }
                        //== Sort Company list
                        adminOptions.companies.sort(helpers.byObjectArray('display', false, function (x) { return x.toUpperCase(); }));
                        //== Build Department list
                        for (i = 0; i < adminDepartmentsLength; i += 1) {
                            if (admin.departments[i].deleted !== 'Y') {
                                adminOptions.departments.push({ "value": admin.departments[i]._id, "display": admin.departments[i].display });
                            }
                        }
                        //== Sort Department list
                        adminOptions.departments.sort(helpers.byObjectArray('display', false, function (x) { return x.toUpperCase(); }));
                        //== Build Contact Types list
                        for (i = 0; i < adminContactTypeLength; i += 1) {
                            if (admin.contactTypes[i].deleted !== 'Y') {
                                adminOptions.contactTypes.push({ "value": admin.contactTypes[i]._id, "display": admin.contactTypes[i].display });
                            }
                        }
                        //== Sort Contact Types list
                        adminOptions.contactTypes.sort(helpers.byObjectArray('display', false, function (x) { return x.toUpperCase(); }));
                    }
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            });
        //== Fetch the list of users from the DB and render the EJS template
        queryPromise.then(function (result) {
            if (result) {
                //== Get users from DB
                UserModel.find(function (err, users) {
                    users.forEach(function (user) {
                        firstName   = '???';
                        lastName    = '???';
                        companyName = 'Unknown';
                        //== Set first and last name
                        if (user.identity.name.first) {
                            firstName = user.identity.name.first.trim();
                        }
                        if (user.identity.name.last) {
                            lastName = user.identity.name.last.trim();
                        }
                        //== Decode the Company name
                        companiesLength = adminOptions.companies.length;
                        for (i = 0; i < companiesLength; i += 1) {
                            if (user.identity.team.company === adminOptions.companies[i].value.toString()) {
                                companyName = adminOptions.companies[i].display;
                                break;
                            }
                        }
                        //== Add the user object to the user list
                        userList.push({
                            "id":        user._id,
                            "name":      lastName + ", " + firstName,
                            "company":   companyName,
                            "email":     helpers.findEmailAddress(user),
                            "hashEmail": helpers.hashEmailAddress(user)
                        });
                    });
                    //== Sort user list
                    userList.sort(helpers.byObjectArray('name', false, function (x) { return x.toUpperCase(); }));
                    //== Render EJS template
                    res.render('profile-home-admin', {
                        title:       'Profiles',
                        user:         req.user,
                        adminOptions: adminOptions,
                        userList:     userList,
                        isAdmin:      isAdmin
                    });
                });
            }
        });

    },

    profileAdministratorUser: function (req, res) {
        //== Set default variables
        var adminCompaniesLength   = 0,
            adminDepartmentsLength = 0,
            userProfile            = {},
            firstName              = '',
            lastName               = '',
            companies              = [],
            departments            = [],
            companiesLength        = 0,
            departmentsLength      = 0,
            i                      = 0,
            //== Get contact type display values from DB
            queryPromise = new NodePromise(function (resolve, reject) {
                AdminModel.findOne({'adminUser.admin': 'Y'}, function (err, admin) {
                    //== Cache array lengths
                    adminCompaniesLength   = admin.companies.length;
                    adminDepartmentsLength = admin.departments.length;
                    //== Populate local arrays
                    for (i = 0; i < adminCompaniesLength; i += 1) {
                        if (admin.companies[i].deleted !== 'Y') {
                            companies.push(admin.companies[i]);
                        }
                    }
                    for (i = 0; i < adminDepartmentsLength; i += 1) {
                        if (admin.departments[i].deleted !== 'Y') {
                            departments.push(admin.departments[i]);
                        }
                    }
                    if (err) {
                        reject(err);
                    } else {
                        resolve(companies);
                        resolve(departments);
                    }
                });
            });
        //== Fetch the selected profile detail from the DB
        queryPromise.then(function (result) {
            UserModel.findOne({'_id': req.body.profileID}, function (err, profile) {
                //== Cache the array lengths
                companiesLength   = companies.length;
                departmentsLength = departments.length;
                //== Decode the company name
                for (i = 0; i < companiesLength; i += 1) {
                    if (companies[i]._id.toString() === profile.identity.team.company) {
                        profile.identity.team.company = companies[i].display;
                        break;
                    }
                }
                //== Decode the department name 
                for (i = 0; i < departmentsLength; i += 1) {
                    if (departments[i]._id.toString() === profile.identity.team.department) {
                        profile.identity.team.department = departments[i].display;
                        break;
                    }
                }
                //== Set first and last name
                firstName = '???';
                lastName  = '???';
                if (profile.identity.name.first) {
                    firstName = profile.identity.name.first.trim();
                }
                if (profile.identity.name.last) {
                    lastName = profile.identity.name.last.trim();
                }
                //== Create the profile object to send to the template
                userProfile.userId        = profile._id;
                userProfile.userName      = firstName + " " + lastName;
                userProfile.hashEmail     = helpers.hashEmailAddress(profile);
                userProfile.company       = profile.identity.team.company || 'No Company Selected';
                userProfile.department    = profile.identity.team.department || 'No Team Selected';
                userProfile.linkedin      = 'N/A';
                userProfile.linkedinEmail = '';
                userProfile.google        = 'N/A';
                userProfile.googleEmail   = '';
                userProfile.facebook      = 'N/A';
                userProfile.facebookEmail = '';
                userProfile.local         = 'N/A';
                userProfile.localEmail    = '';
                if (profile.linkedin.token) {
                    userProfile.linkedin = 'Linked';
                    userProfile.linkedinEmail = profile.linkedin.email;
                }
                if (profile.google.token) {
                    userProfile.google = 'Linked';
                    userProfile.googleEmail = profile.google.email;
                }
                if (profile.facebook.token) {
                    userProfile.facebook = 'Linked';
                    userProfile.facebookEmail = profile.facebook.email;
                }
                if (profile.local.email) {
                    userProfile.local = 'Linked';
                    userProfile.localEmail = profile.local.email;
                }
                //== Render the EJS template
                res.render('profile-home-admin-user', {
                    title:    'Profiles',
                    profile:   userProfile
                });
            });
        });
    },

    profileAdministratorTry: function (req, res) {
        //== Set default values
        var updateDB       = false,
            errorMsg       = '',
            adminArr       = [],
            adminArrLength = 0,
            exists         = -1,
            i              = 0;
        //== Update user records
        if (req.body.updateType === 'user') {
            //== Reset password
            if (req.body.action === 'Reset') {
                UserModel.findOne({'_id': req.body.id}, function (err, user) {
                    //== Make sure user ID and new password exist
                    if (user && req.body.value && req.body.value.trim()) {
                        user.local.password = user.generateHash(req.body.value.trim());
                        updateDB = true;
                    } else {
                        errorMsg = 'SERVER ERROR: Password NOT reset';
                    }
                    //== Update the the DB, handle errors, respond with status
                    if (updateDB === true) {
                        user.save(function (err) {
                            if (err) {
                                res.send('SERVER ERROR: Password NOT reset');
                            } else {
                                res.send('success');
                            }
                        });
                        updateDB = false;
                    } else {
                        res.send(errorMsg);
                    }
                });
            //== Remove user
            } else if (req.body.action === 'Remove') {
                //== Make sure user ID exists
                if (req.body.id && req.body.id.trim()) {
                    updateDB = true;
                } else {
                    errorMsg = 'SERVER ERROR: User NOT removed';
                }
                //== Update the the DB, handle errors, respond with status
                if (updateDB === true) {
                    UserModel.remove({'_id': req.body.id}, function (err) {
                        if (err) {
                            res.send('SERVER ERROR: User NOT removed');
                        } else {
                            res.send('success');
                        }
                    });
                    updateDB = false;
                } else {
                    res.send(errorMsg);
                }
            }
        } else {
        //== Update master value lists
            AdminModel.findOne({'adminUser.admin': 'Y'}, function (err, admin) {
                if (req.body.updateType === 'company') {
                    adminArr = admin.companies;
                } else if (req.body.updateType === 'department') {
                    adminArr = admin.departments;
                } else if (req.body.updateType === 'contact-type') {
                    adminArr = admin.contactTypes;
                }
                adminArrLength = adminArr.length;
                //== Add value to list
                if (req.body.action === 'Add') {
                    if (req.body.value !== '') {
                        //== Check for duplicates
                        exists = -1;
                        for (i = 0; i < adminArrLength; i += 1) {
                            if (adminArr[i].display.toLowerCase() === req.body.value.toLowerCase()) {
                                if (adminArr[i].deleted === 'Y') {
                                    adminArr[i].deleted = '';
                                    exists += 1;
                                    updateDB = true;
                                    break;
                                }
                                exists += 1;
                                errorMsg = 'Entry already exists';
                                break;
                            }
                        }
                        if (exists === -1) {
                            adminArr.push({ _id: mongoose.Types.ObjectId(), "display": req.body.value, "deleted": "" });
                            updateDB = true;
                        }
                    }
                //== Remove value from list
                } else if (req.body.action === 'Remove') {
                    for (i = adminArrLength - 1; i >= 0; i -= 1) {
                        if (adminArr[i]._id.toString() === req.body.value) {
                            adminArr[i].deleted = 'Y';
                            updateDB = true;
                        }
                    }
                } else {
                    errorMsg = 'Could not locate entry for removal';
                }
                //== Update the the DB, handle errors, respond with status
                if (updateDB === true) {
                    admin.save(function (err) {
                        if (err) {
                            res.send('SERVER ERROR: Admin list not updated');
                        } else {
                            res.send('success');
                        }
                    });
                    updateDB = false;
                } else {
                    res.send(errorMsg);
                }
            });
        }
    },

    //==========================================================
    //== PROFILE AUTHENTICATION AND AUTHORIZATION CONTROLLERS ==
    //==========================================================
    //== Profile Home- Logins screen
    profileLogins: function (req, res) {
        //== Set default values
        var adminEmailLength = 0,
            userEmail        = '',
            isAdmin          = false,
            a                = 0;
        //== Query the DB for admin privs
        AdminModel.findOne({'adminUser.admin': 'Y'}, function (err, admin) {
            //== Determine Admin privs
            isAdmin   = false;
            userEmail = helpers.findEmailAddress(req.user);
            adminEmailLength = admin.adminUser.email.length;
            for (a = 0; a < adminEmailLength; a += 1) {
                if (userEmail === admin.adminUser.email[a]) {
                    isAdmin = true;
                    break;
                }
            }
            //== Render the EJS template
            res.render('profile-home-logins', {
                title:  'Profiles',
                user:    req.user,
                isAdmin: isAdmin
            });
        });
    },
    //== Local Login - Display
    localLoginScreen: function (req, res) {
        res.render('profile-login', {
            title:  'Profiles',
            message: req.flash('loginMessage')
        });
    },
    //== Local Login - Logic
    localLoginTry: passport.authenticate('local-login', {
        successRedirect: '/ti/profiles/home',
        failureRedirect: '/ti/profiles/login',
        failureFlash:     true
    }),
    //== Local Signup - Display
    localSignupScreen: function (req, res) {
        res.render('profile-signup', {
            title:  'Profiles',
            message: req.flash('signupMessage')
        });
    },
    //== Local Signup - Logic
    localSignupTry: passport.authenticate('local-signup', {
        successRedirect: '/ti/profiles/home',
        failureRedirect: '/ti/profiles/signup',
        failureFlash:     true
    }),
    //== Local Link - Display
    localLinkScreen: function (req, res) {
        res.render('profile-home-link', {
            title:  'Profiles',
            message: req.flash('loginMessage')
        });
    },
    //== Local Link - Logic
    localLinkTry: passport.authenticate('local-signup', {
        successRedirect: '/ti/profiles/logins',
        failureRedirect: '/ti/profiles/link/local',
        failureFlash:     true
    }),
    //== Local Unlink - Logic
    unlinkLocal: function (req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function (err) {
            res.redirect('/ti/profiles/logins');
        });
    },

     //== LinkedIn Login - Send
    sendLinkedInAuth: passport.authenticate('linkedin', {
        scope: ['r_basicprofile', 'r_emailaddress']
    }),
    //== LinkedIn Login - Receive
    receiveLinkedInAuth: passport.authenticate('linkedin', {
        successRedirect: '/ti/profiles/home',
        failureRedirect: '/ti/profiles/start'
    }),
    //== LinkedIn Link - Send
    sendLinkedInLink: passport.authorize('linkedin', {
        scope: ['r_basicprofile', 'r_emailaddress']
    }),
    //== LinkedIn Link - Receive
    receiveLinkedInLink:  passport.authorize('linkedin', {
        successRedirect: '/ti/profiles/logins',
        failureRedirect: '/ti/profiles/logins'
    }),
    //== LinkedIn Unlink - Logic
    unlinkLinkedIn: function (req, res) {
        var user            = req.user;
        user.linkedin.token = undefined;
        user.save(function (err) {
            res.redirect('/ti/profiles/logins');
        });
    },

    //== Google Login - Send
    sendGoogleAuth: passport.authenticate('google', {
        scope: 'email'
    }),
    //== Google Login - Receive
    receiveGoogleAuth: passport.authenticate('google', {
        successRedirect: '/ti/profiles/home',
        failureRedirect: '/ti/profiles/start'
    }),
    //== Google Link - Send
    sendGoogleLink: passport.authorize('google', {
        scope: ['profile', 'email']
    }),
    //== Google Link - Receive
    receiveGoogleLink:  passport.authorize('google', {
        successRedirect: '/ti/profiles/logins',
        failureRedirect: '/ti/profiles/logins'
    }),
    //== Google Unlink - Logic
    unlinkGoogle: function (req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function (err) {
            res.redirect('/ti/profiles/logins');
        });
    },

    //== Facebook Login - Send
    sendFacebookAuth: passport.authenticate('facebook', {
        scope: 'email'
    }),
    //== Facebook Login - Receive
    receiveFacebookAuth: passport.authenticate('facebook', {
        successRedirect: '/ti/profiles/home',
        failureRedirect: '/ti/profiles/start'
    }),
    //== Facebook Link - Send
    sendFacebookLink: passport.authorize('facebook', {
        scope: 'email'
    }),
    //== Facebook Link - Receive
    receiveFacebookLink: passport.authorize('facebook', {
        successRedirect: '/ti/profiles/logins',
        failureRedirect: '/ti/profiles/home'
    }),
    //== Facebook Unlink - Logic
    unlinkFacebook: function (req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function (err) {
            res.redirect('/ti/profiles/logins');
        });
    },

    //== Global Logout
    logOut: function (req, res) {
        req.logout();
        res.redirect('/ti');
    }

};

