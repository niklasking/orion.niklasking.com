var express     = require('express'),
    router      = express.Router(),
    passport    = require('passport'),
    Runner      = require('../models/runner'),
    Competition = require('../models/competition');

// var YEAR = 2018;
// var ORIONPOKALEN_YEAR = YEAR - 17;

router.get("/orionpokalen/:year", function(req, res) {
    var year = req.params.year;
    var ORIONPOKALEN_YEAR = year - 17;
    var query = Runner.
                find({totalPointsOrion1000: { $gt: 0 }, birthYear: { $gt: ORIONPOKALEN_YEAR }, resultYear: year}).
                sort({ totalPointsOrion1000: -1, wins: -1 });
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            res.render("orion1000/index", { runners: runners, 
                                            compType: "orionpokalen",
                                            year: year});
        }
    });
});

router.get("/orion1000/:year", function(req, res) {
    var year = req.params.year;
    var query = Runner.
                find({totalPointsOrion1000: { $gt: 0 }, resultYear: year}).
                sort({ totalPointsOrion1000: -1, wins: -1 });
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            res.render("orion1000/index", { runners: runners, 
                                            compType: "orion1000",
                                            year: year });
        }
    });
});
router.get("/orion1000standings/:year", function(req, res) {
    var year = req.params.year;
    var query = Runner.
                find({totalPointsOrion1000: { $gt: 0 }, resultYear: year}).
                sort({ totalPointsOrion1000: -1, wins: -1 });
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            res.render("orion1000/orion1000standings", { runners: runners, 
                                            compType: "orion1000",
                                            year: year });
        }
    });
});


router.get("/orion1000/:id/:year", function(req, res) {
    var year = req.params.year;
    var query = Runner.
                find({_id: req.params.id, resultYear: year}).
                populate("competitions");
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            res.render("orion1000/results", {runner: runners[0], compType: req.query.compType, year: year});
        }
    });
});
router.get("/orion1000standings/:id/:year", function(req, res) {
    var year = req.params.year;
    var query = Runner.
                find({_id: req.params.id, resultYear: year}).
                populate("competitions");
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            res.render("orion1000/standingsresults", {runner: runners[0], compType: req.query.compType, year: year});
        }
    });
});

router.get("/resultat/runners/:year", function(req, res) {
    var year = req.params.year;
    var query = Runner.
                find({ "competitions.0": { "$exists": true}, resultYear: year }).
                sort({ nameFamily: 1, nameGiven: 1 }).
                populate("competitions");
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            res.render("resultat/runners", { runners: runners, year: year });
        }
    });
});

router.get("/resultat/runners/:id/:year", function(req, res) {
    var year = req.params.year;
    var query = Runner.
                // find({ "competitions.0": { "$exists": true}, nameFamily : regexp }).
                find({ nameFamily : {$regex : "^" + req.params.id}, resultYear: year}).
                sort({ nameFamily: 1, nameGiven: 1 }).
                populate("competitions");
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            res.render("resultat/runners", { runners: runners, year: year });
        }
    });
});

// function isLoggedIn(req, res, next) {
//     if (req.isAuthenticated()) {
//         return next();
//     }
//     res.redirect("/login");
// }

module.exports = router;