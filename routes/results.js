var express     = require('express'),
    router      = express.Router(),
    passport    = require('passport'),
    Runner      = require('../models/runner'),
    Competition = require('../models/competition');

var YEAR = 2018;
var ORIONPOKALEN_YEAR = YEAR - 17;

router.get("/orionpokalen", function(req, res) {
    var query = Runner.
                find({totalPointsOrion1000: { $gt: 0 }, birthYear: { $gt: ORIONPOKALEN_YEAR }}).
                sort({ totalPointsOrion1000: -1, wins: -1 });
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            res.render("orion1000/index", { runners: runners, 
                                            compType: "orionpokalen",
                                            year: YEAR});
        }
    });
});

router.get("/orion1000", function(req, res) {
    var query = Runner.
                find({totalPointsOrion1000: { $gt: 0 }}).
                sort({ totalPointsOrion1000: -1, wins: -1 });
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            res.render("orion1000/index", { runners: runners, 
                                            compType: "orion1000",
                                            year: YEAR });
        }
    });
});


router.get("/orion1000/:id", function(req, res) {
    var query = Runner.
                find({_id: req.params.id}).
                populate("competitions");
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            res.render("orion1000/results", {runner: runners[0], compType: req.query.compType});
        }
    });
});

router.get("/resultat/runners", function(req, res) {
    var query = Runner.
                find({ "competitions.0": { "$exists": true} }).
                sort({ nameFamily: 1, nameGiven: 1 }).
                populate("competitions");
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            res.render("resultat/runners", { runners: runners, year: YEAR });
        }
    });
});

router.get("/resultat/runners/:id", function(req, res) {
    // var regexp = new RegExp("^"+ req.params.id);
    var query = Runner.
                // find({ "competitions.0": { "$exists": true}, nameFamily : regexp }).
                find({ nameFamily : {$regex : "^" + req.params.id}}).
                sort({ nameFamily: 1, nameGiven: 1 }).
                populate("competitions");
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            res.render("resultat/runners", { runners: runners, year: YEAR });
        }
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

module.exports = router;