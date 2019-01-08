var express = require('express');
var router = express.Router();
var passport = require('passport');
var request  = require('request');
var parseXMLString = require('xml2js').parseString;

var YEAR = 2018;
var API_KEY = "a7ff03d951bf4584a848df74aca6768d";

router.get("/auth", function(req, res) {
    var options = {
        url: 'https://eventor.orientering.se/api/authenticatePerson',
        headers: {
          'ApiKey': API_KEY,
          'Username': '',
          'Password': ''
        }
    };
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            parseXMLString(body, function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    res.send(result);
                }
            });
        } else {
            // User not found: 404
            // Fel lösenord: 404
            res.send(response.statusCode + ": " + error);

        }
    });                
});

router.get("/runners/test/:id", function(req, res) {
    // Anton: 9944
    var options = {
        url: 'https://eventor.orientering.se/api/results/person?personId=' + req.params.id + '&fromDate=' + YEAR + '-01-01&toDate=' + YEAR + '-12-31',
        headers: {
        'ApiKey': API_KEY
        }
    };
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            parseXMLString(body, function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    res.send(result);
                }
            });
        }
    });
});

router.get("/comps/test/:id", function(req, res) {
    var id = req.params.id;
    // Nattcup 9: 24584
    var options = {
        url: 'https://eventor.orientering.se/api/event/' + id,
        headers: {
        'ApiKey': API_KEY
        }
    };
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            parseXMLString(body, function(err, result) {
                if (err) {
                    console.log(err);
                    res.redirect("/");
                } else {
                    res.send(result);
                }
            });
        } else {
            if (error != undefined) {
                console.log(error);
            }
            if (response.statusCode != undefined) {
                console.log(response.statusCode);
            }
            res.redirect("/");
        }
    });
});
router.get('/ajax', function (req, res){  
    var id = req.query.eventorId;
    // console.log(req);
    // console.log("*******************");
    // console.log(id);
    // var id = "21851";
    // Nattcup 9: 24584
    var options = {
        url: 'https://eventor.orientering.se/api/event/' + id,
        headers: {
        'ApiKey': API_KEY
        }
    };
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            parseXMLString(body, function(err, result) {
                if (err) {
                    req.flash("error", "Kunde inte hämta eventor id " + id);
                    res.redirect("/");
                } else if (result.Event == undefined) {
                    req.flash("error", "Kunde inte hämta eventor id " + id);
                    res.redirect("/");
                } else {
                    var eventorId = result.Event.EventId;
                    var title = result.Event.Name;
                    var start = result.Event.StartDate[0].Date + " " + result.Event.StartDate[0].Clock;
                    var ansvarig = result.Event.Organiser[0].Organisation[0].Name;
                    var lat = result.Event.EventRace[0].EventCenterPosition[0].$.y;
                    var lng = result.Event.EventRace[0].EventCenterPosition[0].$.x;

                    res.send({eventorId: eventorId, title: title, start: start, ansvarig: ansvarig, lat: lat, lng: lng});
                }
            });
        } else {
            if (error != undefined) {
                console.log(error);
            }
            if (response.statusCode != undefined) {
                res.send({eventorId: "", title: "", start: "", ansvarig: "", lat: "", lng: ""});
            } else {
                req.flash("error", "Kunde inte hämta eventor id " + id);
                res.redirect("/");    
            }
        }
    }); 
 });


router.get("/test/landing1", function(req, res) {
    res.render("test/landing1");
});


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

module.exports = router;