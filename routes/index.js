var express         = require('express');
var router          = express.Router();
var passport        = require('passport');
var CalendarEvent   = require('../models/calendarEvent');
var moment          = require('moment');
var request         = require('request');
var parseXMLString  = require('xml2js').parseString;

var API_KEY = "a7ff03d951bf4584a848df74aca6768d";

router.get("/", function(req, res) {
    CalendarEvent.find({}, function(err, events) {
        if(err) {
            console.log(err);
        }
        else {
            res.render("index", {event_list: events});
        }
    });    
});

router.get("/login", function(req, res) {
    res.render("login");
});

router.post("/login", passport.authenticate('custom', {failureRedirect: '/login'}), function(req, res) {
    res.redirect("/");
});

router.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

router.get("/calendar", function(req, res) {
    CalendarEvent.find({}, function(err, events) {
        if(err) {
            console.log(err);
        }
        else {
            res.render("calendar/calendar", {event_list: events});
        }
    });    
});

router.get("/calendar/fetch", function(req, res) {
    CalendarEvent.findById(req.query.eventId, function(err, event) {
        if(err) {
            console.log(err);
            req.flash("error", "Kunde inte hitta aktiviteten :-(");
            res.redirect("/");
        }
        else {
            res.send({event: event});
        }
    });    
});

router.get("/calendar/comp/fetch", function(req, res) {
    CalendarEvent.find({year: req.query.year})
        .sort({start: 1})
        .exec(function(err, events) {
            var rows = [];
            if(err) {
                console.log(err);
                res.send(rows);
            }
            else {
                var entries = [];
                var entriesPromise = getOrionEntries(events);
                entriesPromise.then(function(result) {
                        entries = result;
                        events.forEach(function(event) {
                            var row = "<tr>";
                            row += "<td>" + moment(event.start).format("DD/MM") + "</td>";
                            row += "<td><a href=\"" + event.link + "\">" + event.title + "</a></td>";
                            row += "<td><img src=\"https://eventor.orientering.se/Organisation/Logotype/" + event.orgId + "?type=SmallIcon\">  " + event.ansvarig + "</td>";
                            row += "<td>";
                            if (event.raceType.indexOf("Stafett") != -1) {
                                row += "R";
                            } else if (event.raceType.indexOf("natt") != -1) {
                                row += "N";
                            } else if (event.raceDistance.indexOf("Lång") != -1) {
                                row += "L";
                            } else if (event.raceDistance.indexOf("Medel") != -1) {
                                row += "M";
                            } else if (event.raceDistance.indexOf("Sprint") != -1) {
                                row += "S";
                            } else if (event.raceDistance.indexOf("Ultra") != -1) {
                                row += "U";
                            }
                            row += "</td>";
                            row += "<td class=\"text-right\">";
                            var count = "-";
                            for (var i = 0; i < entries.length; i++) {
                                if (entries[i].eventId == event.eventorId) {
                                    count = entries[i].count;
                                    break;
                                }
                            };
                            row += count;
                            row += "</td>";
                            row += "</tr>";
                            rows.push(row);
                        });
                        res.send({rows: rows});
        
                    }, function(err) {
                        console.log(err);
                    }
                );
            }
        });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

function getOrionEntries(events) {
    var entires = [];
    var ids = events[0].eventorId;
    for (var i = 1; i < events.length; i++) {
        ids += "," + events[i].eventorId;
    };
    var options = {
        // url: 'https://eventor.orientering.se/api/competitorcount?organisationIds=483&eventIds=' + ids,
        url: 'https://eventor.orientering.se/api/competitorcount?organisationIds=288&eventIds=' + ids,
        headers: {
        'ApiKey': API_KEY
        }
    };
    return new Promise(function(resolve, reject) {
        var entries = [];
        request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                parseXMLString(body, function(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        if (result.CompetitorCountList != undefined) {
                            if (result.CompetitorCountList.CompetitorCount != undefined) {
                                for (var i = 0; i < result.CompetitorCountList.CompetitorCount.length; i++) {
                                    if (result.CompetitorCountList.CompetitorCount[i].OrganisationCompetitorCount != undefined) {
                                        var eventId = result.CompetitorCountList.CompetitorCount[i].$.eventId;
                                        var count = result.CompetitorCountList.CompetitorCount[i].OrganisationCompetitorCount[0].$.numberOfEntries;
                                        var countResult = {eventId: eventId, count: count};
                                        entries.push(countResult);
                                    }
                                }
                            }
                        }
                        resolve(entries);
                    }
                });
            } else {
                reject(err);
            }
        });
    });
    // return entires;
}
module.exports = router;
