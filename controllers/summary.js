"use strict";

var passport   = require('passport');
var mongoose   = require('mongoose');
var helpers    = require('../helpers/helpers');
var UserModel  = require('../models/user');
var AdminModel = require('../models/admin');

module.exports = {
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
            res.render('summary-index', {
                title: 'Summary',
                filterSelections: filterSelections
            });
        });
    },

    indexFilter: function (req, res) {
        //== Set default variables
        var teamSummaryLength    = 0,
            companySummaryLength = 0,
            teamStrengths        = [],
            teamStrengthsLength  = 0,
            companyStrength      = '',
            foundMatch           = false,
            i                    = 0,
            j                    = 0;
        //== First query the DB to generate a list of Team skills and strengths
        UserModel.aggregate([
            //== Apply Company and Team conditions
            { "$match": { "identity.team.company": req.body.company, "identity.team.department": req.body.department }},
            //== Unwind the Team strengths
            { "$unwind": "$strengths.department" },
            //== Group and count the Team strengths
            { "$group": { "_id": "$strengths.department", "count": { "$sum": 1 }}},
            //== Sort the grouped Team strengths (descending)
            { "$sort": { "count": -1 }}],
            //== Handle the query results
            function (err, teamSummary) {
                //== Cache the array length
                teamSummaryLength = teamSummary.length;
                //== Populate the Team strength function array
                for (i = 0; i < teamSummaryLength; i += 1) {
                    teamStrengths.push({ "display": teamSummary[i]._id, "weight": teamSummary[i].count });
                }
                //== Second query the DB to add in Company skills and strengths
                UserModel.aggregate([
                    //== Apply search conditions
                    { "$match": { "identity.team.company": req.body.company, "identity.team.department": req.body.department }},
                    //== Unwind the Company strengths
                    { "$unwind": "$strengths.company" },
                    //== Group and count the Company strengths
                    { "$group": { "_id": "$strengths.company", "count": { "$sum": 1 }}},
                    //== Sort the grouped Company strengths (descending)
                    { "$sort": { "count": -1 }}],
                    function (err, companySummary) {
                        //== Cache the array lengths
                        companySummaryLength = companySummary.length;
                        teamStrengthsLength  = teamStrengths.length;
                        //== Add the Company strengths to the Team strengths array
                        for (i = 0; i < companySummaryLength; i += 1) {
                            foundMatch      = false;
                            companyStrength = companySummary[i]._id;
                            for (j = 0; j < teamStrengthsLength; j += 1) {
                                if (companyStrength === teamStrengths[j].display) {
                                    //== Just add to the existing count
                                    teamStrengths[j].weight = teamStrengths[j].weight + companySummary[i].count;
                                    foundMatch = true;
                                    break;
                                }
                            }
                            //== Add a new strength to the array
                            if (!foundMatch) {
                                teamStrengths.push({ "display": companySummary[i]._id, "weight": companySummary[i].count });
                            }
                        }
                        //== Sort the output array
                        teamStrengths.sort(helpers.byObjectArray('weight', true, parseInt));
                        //== Render the EJS template
                        res.render('summary-report', {
                            title: 'Summary',
                            strengthSummary: teamStrengths
                        });
                    }
                );
            }
        );
    }

};
