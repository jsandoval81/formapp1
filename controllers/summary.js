/*var models = require('../app/models'),
    md5 = require('MD5');
*/
module.exports = {
    index: function(req, res) {
        /*models.Contact.find({}, function(err, data) {
            res.json(data);
        });*/
        res.render('summary', { title: 'Summary' });
    },
    /*getById: function(req, res) {
        models.Contact.find({ _id: req.params.id }, function(err, contact) {
            if (err) {
                res.json({error: 'Contact not found.'});
            } else {
                res.json(contact);
            }
        });
    },*/
};
