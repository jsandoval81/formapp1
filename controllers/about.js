"use strict";

module.exports = {
    //== Index redirects to one of the about/help tabs
    index: function (req, res) {
        res.redirect('/ti/about/inspiration');
    },

    inspiration: function (req, res) {
        res.render('about-inspiration', {
            title: 'About'
        });
    },

    howto: function (req, res) {
        var section = "";
        if (req.params.section) {
            section = req.params.section;
        }
        res.render('about-howto', {
            title:  'About',
            section: section
        });
    },

    architecture: function (req, res) {
        res.render('about-architecture', {
            title: 'About'
        });
    },

    future: function (req, res) {
        res.render('about-future', {
            title: 'About'
        });
    }
};
