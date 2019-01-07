var express         = require('express'),
    request         = require('request'),
    parseXMLString  = require('xml2js').parseString,
    router          = express.Router(),
    moment          = require('moment'),
    passport        = require('passport'),
    Runner          = require('../models/runner'),
    Competition     = require('../models/competition'),
    CalendarEvent   = require('../models/calendarEvent');

var YEAR = 2018;
var ORIONPOKALEN_YEAR = YEAR - 17;
var ORINGEN_ELITSPRINT = 24317;
var API_KEY = "";

// Step 1. Clear all and read all runners
router.get("/runners/init", function(req, res) {
    var options = {
        url: 'https://eventor.orientering.se/api/persons/organisations/288',
        headers: {
          'ApiKey': API_KEY
        }
    };
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            Runner.remove({}, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    Competition.remove({}, function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            parseXMLString(body, function(err, result) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    result.PersonList.Person.forEach(function(runner) {
                                        var runnerNameGiven     = runner.PersonName[0].Given[0]._;
                                        var runnerNameFamily    = runner.PersonName[0].Family;
                                        var runnerBirth         = runner.BirthDate[0].Date;
                                        var runnerBirthYear     = parseInt(runnerBirth.toString().substring(0, 4));
                                        var runnerEventorId     = runner.PersonId;
                                        var newRunner = new Runner({
                                            nameGiven: runnerNameGiven,
                                            nameFamily: runnerNameFamily,
                                            birth: runnerBirth,
                                            birthYear: runnerBirthYear,
                                            eventorId: runnerEventorId
                                        });
                                        console.log("Found runner: " + newRunner.nameGiven + " " + newRunner.nameFamily);
                                        newRunner.save(function(err, data) {
                                            if (err) {
                                                console.log(err);
                                            }
                                        });        
                                    });
                                }
                            });
                        }
                    });
                }
                res.redirect("/");                
            });
        }
        else {
            res.send("Something went wrong :-(");
        }
    });
});

// Step 2. Fetch all competitions for the year YEAR
router.get("/competitions/init", function(req, res) {
    console.log("Hämtar resultat");
        var query = Runner.
                    find({});
        query.exec(function(err, runners) {
            if (err) {
                console.log(err);
            } else {
                runners.forEach(function(runner) {
                    var runnerId = runner.eventorId;
                    var options = {
                        url: 'https://eventor.orientering.se/api/results/person?personId=' + runnerId + '&fromDate=' + YEAR + '-01-01&toDate=' + YEAR + '-12-31',
                        headers: {
                        'ApiKey': API_KEY
                        }
                    };
                    request(options, function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                            parseXMLString(body, function(err, result) {
                                if (err) {
                                    console.log(err);
                                } else if (result.ResultListList.ResultList == undefined) {
                                } else {
    console.log("Found results for runner: " + runnerId);
                                    var competitionsArray = [];
                                    result.ResultListList.ResultList.forEach(function(comp) {
                                        var eventorId = comp.Event[0].EventId;
                                        var name = comp.Event[0].Name;
                                        var date = comp.Event[0].StartDate[0].Date;
                                        var year = YEAR;
                                        var category = comp.Event[0].EventClassificationId;
                                        var className = comp.ClassResult[0].EventClass[0].Name;
                                        var classType = comp.ClassResult[0].EventClass[0].ClassTypeId;
                                        var starts = parseInt(comp.ClassResult[0].EventClass[0].ClassRaceInfo[0].$.noOfStarts);
    
                                        var relay = comp.ClassResult[0].EventClass[0].$.teamEntry == "Y" ? true : false;
                                        var statusOk = comp.Event[0].EventStatusId == "9" ? true : false;
                                        var multi = comp.Event[0].$.eventForm == "IndMultiDay" ? true : false;
                                        var resultOk = true;
                                        var positionStr = "";
                                        var relayTeam = "";
                                        var relayLeg = "";
                                        if (!relay) {
                                            if (!multi) {
                                                // Endagstävling
                                                var resultOk = comp.ClassResult[0].PersonResult[0].Result[0].CompetitorStatus[0].$.value == "OK" ? true : false;
                                                if (resultOk) {
                                                    positionStr = comp.ClassResult[0].PersonResult[0].Result[0].ResultPosition;
                                                }
    
                                                var newCompetition = new Competition({
                                                    eventorId: eventorId,
                                                    name: name,
                                                    date: date,
                                                    category: category,
                                                    statusOk: statusOk,
                                                    className: className,
                                                    classType: classType,
                                                    resultOk: resultOk,
                                                    positionStr: positionStr,
                                                    starts: starts,
                                                    relay: relay,
                                                    relayTeam: relayTeam,
                                                    relayLeg: relayLeg
                                                });
                                                if (comp.ClassResult[0].PersonResult[0].Organisation != undefined) {
                                                    if (comp.ClassResult[0].PersonResult[0].Organisation[0].OrganisationId == "288") {
                                                        // Remove O-ringen elitsprinten, since it is also reported for O-ringen.
                                                        if (eventorId.toString() != ORINGEN_ELITSPRINT) {
                                                            competitionsArray.push(newCompetition);
                                                        }
                                                    }
                                                }
                                            } else {
                                                // Flerdagarstävling
                                                var eventName = name;
                                                // Check if reported as kval & final, as for SM
                                                if (comp.ClassResult.length > 1) {
                                                    for (var day = 0; day < comp.ClassResult.length; day++) {
                                                        positionStr = "";
                                                        starts = starts = parseInt(comp.ClassResult[day].EventClass[0].ClassRaceInfo[0].$.noOfStarts);
                                                        name = eventName + " " + comp.ClassResult[day].EventClass[0].Name;
                                                        className = comp.ClassResult[day].EventClass[0].Name;
                                                        date = comp.ClassResult[day].PersonResult[0].RaceResult[0].Result[0].StartTime[0].Date;
                                                        resultOk = comp.ClassResult[day].PersonResult[0].RaceResult[0].Result[0].CompetitorStatus[0].$.value == "OK" ? true : false;
                                                        if (resultOk) {
                                                            // position = parseInt(comp.ClassResult[0].PersonResult[day].RaceResult[0].Result[0].ResultPosition);
                                                            positionStr = comp.ClassResult[day].PersonResult[0].RaceResult[0].Result[0].ResultPosition;
                                                        }
    
                                                        var newCompetition = new Competition({
                                                            eventorId: eventorId,
                                                            name: name,
                                                            date: date,
                                                            category: category,
                                                            statusOk: statusOk,
                                                            className: className,
                                                            classType: classType,
                                                            resultOk: resultOk,
                                                            positionStr: positionStr,
                                                            starts: starts,
                                                            relay: relay,
                                                            relayTeam: relayTeam,
                                                            relayLeg: relayLeg
                                                        });
                                                        if (comp.ClassResult[day].PersonResult[0].Organisation != undefined) {
                                                            if (comp.ClassResult[day].PersonResult[0].Organisation[0].OrganisationId == "288") {
                                                                competitionsArray.push(newCompetition);
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    for (var day = 0; day < comp.ClassResult[0].PersonResult.length; day++) {
                                                        positionStr = "";
                                                        var eventRaceId = comp.ClassResult[0].PersonResult[day].RaceResult[0].EventRaceId;
                                                        comp.Event[0].EventRace.forEach(function(eventRace) {
                                                            // console.log(eventRace.EventRaceId + " - " + eventRaceId);
                                                            if (eventRace.EventRaceId.toString() == eventRaceId.toString()) {
                                                                name = eventName + " " + eventRace.Name;
                                                                date = eventRace.RaceDate[0].Date;        
                                                            }
                                                        });
                                                        resultOk = comp.ClassResult[0].PersonResult[day].RaceResult[0].Result[0].CompetitorStatus[0].$.value == "OK" ? true : false;
                                                        if (resultOk) {
                                                            // position = parseInt(comp.ClassResult[0].PersonResult[day].RaceResult[0].Result[0].ResultPosition);
                                                            positionStr = comp.ClassResult[0].PersonResult[day].RaceResult[0].Result[0].ResultPosition;
                                                        }
    
                                                        var newCompetition = new Competition({
                                                            eventorId: eventorId,
                                                            name: name,
                                                            date: date,
                                                            category: category,
                                                            statusOk: statusOk,
                                                            className: className,
                                                            classType: classType,
                                                            resultOk: resultOk,
                                                            positionStr: positionStr,
                                                            starts: starts,
                                                            relay: relay,
                                                            relayTeam: relayTeam,
                                                            relayLeg: relayLeg
                                                        });
                                                        if (comp.ClassResult[0].PersonResult[0].Organisation != undefined) {
                                                            if (comp.ClassResult[0].PersonResult[0].Organisation[0].OrganisationId == "288") {
                                                                competitionsArray.push(newCompetition);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            // Kavle
                                            resultOk = comp.ClassResult[0].TeamResult[0].TeamMemberResult[0].CompetitorStatus[0].$.value == "OK" ? true : false;
                                            if (resultOk) {
                                                positionStr = parseInt(comp.ClassResult[0].TeamResult[0].TeamMemberResult[0].Position[0]._);
                                            }
                                            relayTeam = comp.ClassResult[0].TeamResult[0].TeamName;
                                            relayLeg = comp.ClassResult[0].TeamResult[0].TeamMemberResult[0].Leg;
    
                                            var newCompetition = new Competition({
                                                eventorId: eventorId,
                                                name: name,
                                                date: date,
                                                category: category,
                                                statusOk: statusOk,
                                                className: className,
                                                classType: classType,
                                                resultOk: resultOk,
                                                positionStr: positionStr,
                                                starts: starts,
                                                relay: relay,
                                                relayTeam: relayTeam,
                                                relayLeg: relayLeg
                                            });
                                            if (comp.ClassResult[0].TeamResult[0].Organisation != undefined) {
                                                if (comp.ClassResult[0].TeamResult[0].Organisation[0].OrganisationId == "288") {
                                                    competitionsArray.push(newCompetition);
                                                }
                                            }
                                        }
                                    });
                                    Competition.insertMany(competitionsArray, function(err, comps) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            Runner.update({eventorId: runnerId},{competitions: comps},{upsert:true},function(err){
                                                if(err){
                                                    console.log(err);
                                                }
                                            });
                                        }
                                    })
                                }
                            });
                        }
                        else {
                            res.send("Something went wrong :-(");
                        }
                    });
    // }
                });
            }
        });
        res.redirect("/");
});

// Step 3. Calculate points for all competitions
router.get("/runners/calc", function(req, res) {
    var query = Runner.
                find({ }).
                populate("competitions");
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            runners.forEach(function(runner) {
                if (runner.competitions.length == 0) {
                    // No results stored for the runner
                }
                runner.competitions.forEach(function(comp) {
                    var klar = false;
                    var basePoints = 0;
                    var points = 0;
                    // Check godkänd
                    if (!comp.resultOk) {
                        points = 0;
                        klar = true;
                    }
                    // Check nattcup = 0
                    if (!klar) {
                        if (comp.name.toLowerCase().indexOf("nattcup") != -1) {
                            // SPECIAL - kolla så att KM och nattcup inte är samma
                            if (comp.name.indexOf("KM") == -1) {
                                points = 0;
                                klar = true;
                            }
                        }
                    }
                    // Check typ av tävling
                    if (!klar) {
                        switch (comp.category) {
                            case "0":
                            case "1":
                            case "2":
                            case "3":
                                basePoints = 100;
                                break;
                        }
                        // Check KM = max 60
                        if (comp.name.indexOf("KM") != -1) {
                            basePoints = 60;
                        }
                        // Check ungdomsserie = max 60
                        if (comp.name.indexOf("Ungdomsserie") != -1) {
                            basePoints = 60;
                        }
                    }
                    // Check U-klass = 30
                    // Check inskolning = 30
                    if (!klar) {
                        if (comp.classType == 18) {
                            points = 30;
                            klar = true;
                        }
                    }
                    // Check öppen klass = 30
                    if (!klar) {
                        if (comp.classType == 19) {
                            points = 30;
                            klar = true;
                        }
                    }
                    // Antal startande == 0 => 30
                    if (!klar) {
                        if (comp.starts == 0) {
                            points = 30;
                            klar = true;
                        }
                    }
                    // Placering == 0 => 30
                    if (!klar) {
                        if (parseInt(comp.positionStr) == 0) {
                            points = 30;
                            klar = true;
                        }
                    }
                    // Check ensam start = 30
                    if (!klar) {
                        if (comp.starts == 1) {
                            points = 30;
                            klar = true;
                        }
                    }                
                    // Räkna ut poäng = min 30
                    if (!klar) {
                        var pos = parseInt(comp.positionStr);
                        points = Math.round((basePoints/(comp.starts - 1))*(comp.starts - pos));
                        if (points < 30) {
                            points = 30;
                        }
                    }
                    Competition.update({_id: comp._id},{points: points},{upsert:true},function(err){
                        if(err){
                            console.log(err);
                        }
                    });
                });
                console.log("Beräknat poäng för löpare: " + runner.nameGiven + " " + runner.nameFamily);
            });
            res.redirect("/");
        }
    });
});

// Step 4. Calculate Spring till 1000 and Orionpokalen
router.get("/orion1000/calc", function(req, res) {
    var query = Runner.
                find({ }).
                populate("competitions");
    query.exec(function(err, runners) { 
        if (err) {
            console.log(err);
        } else {
            runners.forEach(function(runner) {
                var totalPointsOrion1000 = 0;
                var wins = 0;
                var results = [];
                var comps = runner.competitions;
                comps.sort(function(a, b){ return b.points - a.points});
                for (var i = 0; i < comps.length; i++) {
                    if (i < 10) {
                        totalPointsOrion1000 += comps[i].points;
                        results.push(comps[i].points);
                    }
                    if (comps[i].points == 100) {
                        wins++;
                    }
                };
                Runner.update({_id: runner._id}, {totalPointsOrion1000: totalPointsOrion1000},{upsert:true}, function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        Runner.update({_id: runner._id}, {wins: wins},{upsert:true}, function(err) {
                            if (err) {
                                console.log(err);
                            } else {
                                Runner.update({_id: runner._id}, {orion1000Results: results},{upsert:true}, function(err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    console.log("Beräknat poäng för " + runner.nameGiven + " " + runner.nameFamily);
                                });            
                            }
                        });
                    }
                });
            });
        }
    });
    res.redirect("/");
});

// CALENDAR
router.get("/admin/calendar", function(req, res) {
    var date = req.query.date;
    var _id = req.query._id;
    var className = req.query.className;
    var title = req.query.title;
    var ansvarig = req.query.ansvarig;
    var link = req.query.link;
    var description = req.query.description;
    var lat = req.query.lat;
    var lng = req.query.lng;
    CalendarEvent.find({}, function(err, events) {
        if(err) {
            req.flash("error", "Nu blev det nåt knas :-(");
            console.log(err);
        }
        else {
            res.render("admin/calendar/new", {event_list: events, date: date, _id: _id, title: title, className: className, lat: lat, lng: lng, ansvarig: ansvarig, link: link, description: description});
        }
    });    
});
router.post("/admin/calendar", function(req, res) {
    var title = req.body.title;
    var start = req.body.start;
    var className = req.body.className;
    var link = req.body.link;
    var ansvarig = req.body.ansvarig;
    var description = req.body.description;
    var lat = req.body.lat;
    var lng = req.body.lng;
    if (req.body.new != undefined) {
        // SKAPA EN NY AKTIVITET

        // var author = {
        //     id: req.user._id,
        //     username: req.user.username
        // };
        var newCalendarEvent = {title: title, start: start, className: className, lat: lat, lng: lng, ansvarig: ansvarig, link: link, description: description};
        CalendarEvent.create(newCalendarEvent, function(err, justCreatedCalendarEvent) {
            if(err) {
                req.flash("error", "Nu blev det nåt knas :-(");
                console.log(err);
            }
            else {
                // req.flash("success", "Successfully created a campground.");
                req.flash("success", "Aktivitet " + title + " sparad.");
                res.redirect("/admin/calendar");
            }
        }); 
    } else if (req.body.edit != undefined) {
        // ÄNDRA EN EXISTERANDE AKTIVITET
        var _id = req.body._id;
        if (_id != undefined) {
            var newCalendarEvent = {title: title, start: start, className: className, lat: lat, lng: lng, ansvarig: ansvarig, link: link, description: description};
            CalendarEvent.findByIdAndUpdate(_id, newCalendarEvent, function(err, updatedCalendarEvent) {
                if (err) {
                    req.flash("error", "Nu blev det nåt knas :-(");
                    res.redirect("/admin/calendar");
                } else {
                    req.flash("success", "Aktivitet " + title + " uppdaterad.");
                    res.redirect("/admin/calendar");
                }
            });
        } else {
            res.redirect("/");
        }
    } else if (req.body.delete != undefined) {
        // TA BORT EN EXISTERANDE AKTIVITET
        var _id = req.body._id;
        if (_id != undefined) {
            CalendarEvent.deleteOne({ _id: _id }, function(err) {
                if (err) {
                    console.log(err);
                    req.flash("error", "Nu blev det nåt knas :-(");
                    res.redirect("/admin/calendar");
                } else {
                    req.flash("success", "Aktiviteten borttagen");
                    res.redirect("/admin/calendar");
                }
            });
        } else {
            res.redirect("/");
        }
    }
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

module.exports = router;