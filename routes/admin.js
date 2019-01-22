var express         = require('express'),
    request         = require('request'),
    parseXMLString  = require('xml2js').parseString,
    router          = express.Router(),
    moment          = require('moment'),
    passport        = require('passport'),
    Runner          = require('../models/runner'),
    Competition     = require('../models/competition'),
    CalendarEvent   = require('../models/calendarEvent'),
    User            = require('../models/user'),
    middleware      = require("../middleware");

var ORINGEN_ELITSPRINT = 24317;
var API_KEY = "a7ff03d951bf4584a848df74aca6768d";

router.get("/admin", middleware.isLoggedIn, function(req, res) {
    var superAdmin = "no";
    User.find({eventorId: req.user.eventorId}, function(err, users) {
        if(err) {
        }
        else {
            if (users.length > 0) {
                for (var i = 0; i < users[0].roles.length; i++) {
                    if (users[0].roles[i] == "superadmin") {
                        superAdmin = "yes";
                        break;
                    }
                }
                res.render("admin/index", {superAdmin: superAdmin});
            }
        }
    });   
});

router.get("/admin/todo", function(req, res) {
    res.render("admin/todo");
});

router.get("/admin/runner", middleware.isSuperAdmin, function(req, res) {
    var year = new Date().getFullYear();
    var query = Runner.
                find({ resultYear: year }).
                sort({ nameFamily: 1, nameGiven: 1 });
    query.exec(function(err, runners) { 
        if(err) {
            res.send({runners: runners, error: "Kunde inte hämta medlemmar. " + err});
        }
        else {
            res.send({runners: runners, error: ""});
        }
    });    
});

router.get("/admin/user", middleware.isSuperAdmin, function(req, res) {
    var query = User.
                find({}).
                sort({ nameFamily: 1, nameGiven: 1 });
                // populate("roles");
    query.exec(function(err, users) { 
        if(err) {
            res.send({users: users, error: "Kunde inte hämta användare. " + err});
        }
        else {
            res.send({users: users, error: ""});
        }
    });    
});

router.post("/admin/user", middleware.isSuperAdmin, function(req, res) {
    var eventorId = req.body.eventorId;
    var newRole = req.body.role;
    var query = Runner.
                find({eventorId: eventorId});
    query.exec(function(err, runners) { 
        if (err) {
            req.flash("error", "ERROR 1: Kunde inte lägga till roll till användaren.");
            res.redirect("/admin");
        } else {
            if (runners.length == 0) {
                req.flash("error", "ERROR 2: Kunde inte lägga till roll till användaren.");
                res.redirect("/admin");
            } else {
                var nameGiven = runners[0].nameGiven;
                var nameFamily = runners[0].nameFamily;
                var query2 = User.
                find({eventorId: eventorId});
                    query2.exec(function(err, users) { 
                        if(err) {
                            req.flash("error", "ERROR 3: Kunde inte lägga till roll till användaren.");
                            res.redirect("/admin");
                                        }
                        else {
                            if (users.length > 0) {
                                // Användaren finns redan.
                                var found = false;
                                for (var i = 0; i < users[0].roles.length; i++) {
                                    if (users[0].roles[i] == newRole) {
                                        found = true;
                                        break;
                                    }
                                }
                                if (found) {
                                    req.flash("error", "Användaren har redan denna roll.");
                                    res.redirect("/admin");
                                } else {
                                    var roles = users[0].roles;
                                    roles.push(newRole);
                                    User.findByIdAndUpdate(users[0]._id, {roles: roles}, function(err, updatedCalendarEvent) {
                                        if (err) {
                                            req.flash("error", "ERROR 4: Kunde inte lägga till roll till användaren.");
                                            res.redirect("/admin");
                                        } else {
                                            req.flash("success", "Roll tillagd till användare.");
                                            res.redirect("/admin");
                                        }
                                    });                        
                                }
                            } else {
                                // Användaren finns inte.
                                var roles = [];
                                roles.push(newRole);
                                var newUser = new User({
                                                nameGiven: nameGiven,
                                                nameFamily: nameFamily,
                                                eventorId: eventorId,
                                                roles: roles
                                });
                                User.create(newUser, function(err, justCreatedUser) {
                                    if(err) {
                                        req.flash("error", "ERROR 5: Kunde inte lägga till roll till användaren.");
                                        res.redirect("/admin");
                                    }
                                    else {
                                        req.flash("success", "Roll tillagd till användare.");
                                        res.redirect("/admin");
                                    }
                                }); 
                            }
                        }
                    });    

            }
        }
    });
});

router.delete("/admin/user/:id", middleware.isSuperAdmin, function(req, res) {
    var eventorId = req.params.id;
    var oldRole = req.body.role;
    // 1. Find user.
    // 2. Remove role from roles array.
    var query = User.
    find({eventorId: eventorId});
    query.exec(function(err, users) { 
        if(err) {
            req.flash("error", "ERROR 1: Kunde inte ta bort rollen.");
            res.redirect("/admin");
        } else {
            if (users.length == 0) {
                req.flash("error", "ERROR 2: Kunde inte ta bort rollen.");
                res.redirect("/admin");
            } else {
                var user = users[0];
                var roles = [];
                user.roles.forEach(function(role) {
                    if (oldRole != role) {
                        roles.push(role);
                    }
                });
                User.findByIdAndUpdate(user._id, {roles: roles}, function(err, updatedCalendarEvent) {
                    if (err) {
                        req.flash("error", "ERROR 3: Kunde inte ta bort rollen.");
                        res.redirect("/admin");
                    } else {
                        req.flash("success", "Rollen borttagen från användaren.");
                        res.redirect("/admin");
                    }
                });    
            }
        }
    });
});

router.get("/admin/runners/refresh/:year", middleware.isSuperAdmin, function(req, res) {
    var year = req.params.year;
    var options = {
        url: 'https://eventor.orientering.se/api/persons/organisations/288',
        headers: {
          'ApiKey': API_KEY
        }
    };
    var data; // Used to transfer info between promises.

    var app = req.app;
    req.app.io.sockets.emit('refresh status', "Nu börjar vi!");
    
    

    // Get members from Eventor
    var dataPromise = new Promise(function(resolve, reject) {
        request(options, function(error, response, body) {
            if (error || response.statusCode != 200) {
                req.flash("error", "Nu blev det knas i steg 1 :-(");
                console.log("error 1");
                req.app.io.sockets.emit('refresh status', "ERROR: Nu blev det knas i steg 1.");
                reject(error);
            } else {
                console.log("ok 1");
                req.app.io.sockets.emit('refresh status', "Alla medlemmar hämtade från Eventor för " + year);
                data = body;
                resolve(data);
            }
        });
    }).then(function(result) {
    // Remove all members in database
        return new Promise((resolve, reject) => {
            Runner.remove({resultYear: year}, function(err) {
                if (err) {
                    console.log("error 2");
                    req.flash("error", "Nu blev det knas i steg 2 :-(");
                    reject(err);
                } else {
                    console.log("ok 2");
                    req.app.io.sockets.emit('refresh status', "Alla medlemmar borttagna från databasen för " + year);
                    resolve();
                }
            });    
        });
    }).then(function(result) {
    // Remove all competitions from database
        return new Promise((resolve, reject) => {
            Competition.remove({resultYear: year}, function(err) {
                if (err) {
                    console.log("error 3");
                    req.flash("error", "Nu blev det knas i steg 3 :-(");
                    reject(err);
                } else {
                    console.log("ok 3");
                    req.app.io.sockets.emit('refresh status', "Alla resultat borttagna från databasen för " + year);
                    resolve();
                }
            });
        });
    }).then(function(result) {
        // Parse Eventor XML file
        return new Promise((resolve, reject) => {
            parseXMLString(data, function(err, result) {
                if (err) {
                    console.log("error 4");
                    req.flash("error", "Nu blev det knas i steg 4 :-(");
                    reject(err);
                } else {
                    console.log("ok 4");
                    req.app.io.sockets.emit('refresh status', "Svaret från Eventor verkar vara ok.");
                    resolve(result);
                }
            });
        });
    }).then(function(result) {
    // Save member in database
        var promises = [];

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
                resultYear: year,
                eventorId: runnerEventorId
            });
            // console.log("Found runner: " + newRunner.nameGiven + " " + newRunner.nameFamily);
            promises.push(saveRunner(newRunner));
        });
        Promise.all(promises) 
            .then((results) => {
                console.log("ok 5");
                // Get all members from database.
                dataPromise = new Promise(function(resolve, reject) {
                    var query = Runner.
                    find({resultYear: year});
                    query.exec(function(err, runners) {
                        if (err) {
                            console.log("error 6");
                            req.flash("error", "Nu blev det knas i steg 6 :-(");
                            reject(err);
                        } else {
                            console.log("ok 6");
                            req.app.io.sockets.emit('refresh status', "Hämtade alla medlemmar från databasen för att kunna spara resultaten.");
                            data = runners;
                            resolve(runners);
                        }
                    });
                }).then(function(results) {
                // Get results for all members
                    var promises = [];
                    runners = data;
                    runners.forEach(function(runner) {
                        promises.push(getCompsForRunner(runner, year, req.app.io));
                    });
                    Promise.all(promises) 
                    .then((results) => {
                        console.log("ok 7");
                        req.app.io.sockets.emit('refresh status', "Hämtade alla resultat för " + year);
                        // Get runners and competitions and start calculating points
                        dataPromise = new Promise(function(resolve, reject) {
                            var query = Runner.
                                find({resultYear: year }).
                                populate("competitions");
                            query.exec(function(err, runners) { 
                                if (err) {
                                    console.log("error 8");
                                    req.flash("error", "Nu blev det knas i steg 8 :-(");
                                    reject(err);
                                } else {
                                    console.log("ok 8");
                                    req.app.io.sockets.emit('refresh status', "Dax att börja beräkna poängen.");
                                    data = runners;
                                    resolve(runners);
                                }            
                            });
                        }).then(function(results) {
                            // Calculate and store competition points for each runner
                            var promises = [];
                            runners = data;
                            runners.forEach(function(runner) {
                                promises.push(calculatePoints(runner, req.app.io));
                                // promises.push(calculatePoints(runner));
                            });
                            Promise.all(promises) 
                                .then((results) => {
                                    console.log("ok 9");
                                    req.app.io.sockets.emit('refresh status', "Alla poäng beräknade för " + year);
                                    // Get runners and competitions and start calculating cups
                                    dataPromise = new Promise(function(resolve, reject) {
                                        var query = Runner.
                                            find({resultYear: year }).
                                            populate("competitions");
                                        query.exec(function(err, runners) { 
                                            if (err) {
                                                console.log("error 10");
                                                req.flash("error", "Nu blev det knas i steg 10 :-(");
                                                reject(err);
                                            } else {
                                                console.log("ok 10");
                                                req.app.io.sockets.emit('refresh status', "Dax att börja räkna poäng för Spring till 1000 samt Orionpokalen för " + year);
                                                data = runners;
                                                resolve(runners);
                                            }            
                                        });
                                    }).then(function(results) {
                                        // Calculate and store cup points for each runner
                                        var promises = [];
                                        runners = data;
                                        runners.forEach(function(runner) {
                                            promises.push(calculateCupPoints(runner, req.app.io));
                                        });
                                        Promise.all(promises) 
                                            .then((results) => {
                                                console.log("ok 11");
                                                req.app.io.sockets.emit('refresh status', "Alla resultat hämtade och beräknade för" + year);
                                                res.redirect("/");
                                            })
                                            .catch((e) => {
                                                req.flash("error", "Nu blev det knas i steg 11 :-(");
                                                console.log("error 11");
                                                res.redirect("/");
                                            });  
                                    });          
                                })
                                .catch((e) => {
                                    req.flash("error", "Nu blev det knas i steg 9 :-(");
                                    req.app.io.sockets.emit('refresh status', "ERROR 9: Kunde inte beräkna poängen för Spring till 1000 och Oriopokalen.");
                                    console.log("error 9");
                                    res.redirect("/");
                                });
                        });
                    })
                    .catch((e) => {
                        req.flash("error", "Nu blev det knas i steg 7 :-(");
                        console.log("error 7");
                        res.redirect("/");
                    });
                });

            })
            .catch((e) => {
                req.flash("error", "Nu blev det knas i steg 5.all :-(");
                console.log("error 5.all");
                res.redirect("/");
            });
        });

    

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
    var eventorId = req.query.eventorId;
    var orgId = req.query.orgId;
    CalendarEvent.find({}, function(err, events) {
        if(err) {
            req.flash("error", "Nu blev det nåt knas :-(");
            console.log(err);
            res.redirect("/");
        }
        else {
            res.render("admin/calendar/new", {event_list: events, date: date, _id: _id, title: title, className: className, lat: lat, lng: lng, ansvarig: ansvarig, link: link, description: description, eventorId: eventorId, orgId: orgId});
        }
    });    
});

router.get("/admin/calendar/comps/fetch", function (req, res){  
    var id = req.query.eventorId;
    var options = {
        url: 'https://eventor.orientering.se/api/event/' + id,
        headers: {
        'ApiKey': API_KEY
        }
    };
    request(options, function(error, response, body) {
        var events = [];
        if (!error && response.statusCode == 200) {
            parseXMLString(body, function(err, result) {
                if (err) {
                    res.send({events: events});
                } else if (result.Event == undefined) {
                    res.send({events: events});
                } else if (result.Event.StartDate == undefined) {
                    res.send({events: events});
                } else {
                    for (var i = 0; i < result.Event.EventRace.length; i++) {
                        var eventorId = result.Event.EventId;
                        var title =     result.Event.Name + " " + result.Event.EventRace[i].Name;
                        var ansvarig =  result.Event.Organiser[0].Organisation[0].Name;
                        var orgId =     result.Event.Organiser[0].Organisation[0].OrganisationId;
                        var raceType =  result.Event.$.eventForm;

                        var start =        result.Event.EventRace[i].RaceDate[0].Date + " " + result.Event.EventRace[i].RaceDate[0].Clock;
                        var lat =          result.Event.EventRace[i].EventCenterPosition[0].$.y;
                        var lng =          result.Event.EventRace[i].EventCenterPosition[0].$.x;
                        var raceDistance = result.Event.EventRace[i].$.raceDistance;
                        var raceNight =    result.Event.EventRace[i].$.raceLightCondition;
                        var night =        raceNight == "Night" ? true : false;
                        
                        events.push(new CalendarEvent({
                            title: title,
                            start: start,
                            link: "https://eventor.orientering.se/Events/Show/" + eventorId,
                            ansvarig: ansvarig,
                            className: "eventCompetition",
                            lat: lat,
                            lng: lng,
                            eventorId: eventorId,
                            orgId: orgId,
                            year: start.toString().substring(0, 4),
                            raceType: raceType,
                            raceDistance: raceDistance,
                            raceNight: night
                        }));
                    }
                    res.send({events: events});
                }
            });
        } else {
            if (error != undefined) {
                console.log(error);
                res.send({events: events});
            }
            if (response.statusCode != undefined) {
                res.send({events: events});
            } else {
                res.send({events: events});
            }
        }
    }); 
 });

 router.get("/admin/calendar/comps/:year", function(req, res) {
    var year = req.params.year;
    CalendarEvent.find({year: year}).
            sort({start: 1}).
            exec(function(err, comps) {
                if(err) {
                    req.flash("error", "Nu blev det nåt knas :-(");
                    console.log(err);
                    res.redirect("/");
                }
                else {
                    res.render("admin/comps/index", {comps: comps, year: year});
                }
    });
});

router.post("/admin/calendar/comps", middleware.isLoggedIn, function(req, res) {
    var eventsPromise = new Promise(function(resolve, reject) {
        CalendarEvent.find({eventorId: { $ne: undefined }}, function(err, existingEvents) {
            if(err) {
                console.log(err);
                resolve([]);
            }
            else {
                resolve(existingEvents);
            }
        });
    });
    eventsPromise.then(function(events) {
        var comps = [];
        var year = "";
        for (var i = 0; i < req.body.legs; i++) {
            if (i == 0) {
                year = req.body.start1.toString().substring(0, 4);
                var found = false;
                for (var j = 0; j < events.length; j++) {
                    if (req.body.eventorId1 == events[j].eventorId) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    comps.push(new CalendarEvent({
                            title: req.body.title1,
                            start: req.body.start1,
                            link: req.body.link1,
                            ansvarig: req.body.ansvarig1,
                            className: "eventCompetition",
                            lat: req.body.lat1,
                            lng: req.body.lng1,
                            eventorId: req.body.eventorId1,
                            orgId: req.body.orgId1,
                            year: req.body.start1.toString().substring(0, 4),
                            raceType: req.body.raceType1,
                            raceDistance: req.body.raceDistance1,
                            description: req.body.description,
                            link: "https://eventor.orientering.se/Events/Show/" + req.body.eventorId1
                        })
                    );
                }
            }
            else if (i == 1) {year = req.body.start2.toString().substring(0, 4);
                year = req.body.start2.toString().substring(0, 4);
                var found = false;
                for (var j = 0; j < events.length; j++) {
                    if (req.body.eventorId2 == events[j].eventorId) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    comps.push(new CalendarEvent({
                            title: req.body.title2,
                            start: req.body.start2,
                            link: req.body.link2,
                            ansvarig: req.body.ansvarig2,
                            className: "eventCompetition",
                            lat: req.body.lat2,
                            lng: req.body.lng2,
                            eventorId: req.body.eventorId2,
                            orgId: req.body.orgId2,
                            year: req.body.start2.toString().substring(0, 4),
                            raceType: req.body.raceType2,
                            raceDistance: req.body.raceDistance2,
                            description: req.body.description,
                            link: "https://eventor.orientering.se/Events/Show/" + req.body.eventorId2
                        })
                    );
                }
            }
            else if (i == 2) {
                year = req.body.start3.toString().substring(0, 4);
                var found = false;
                for (var j = 0; j < events.length; j++) {
                    if (req.body.eventorId3 == events[j].eventorId) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    comps.push(new CalendarEvent({
                            title: req.body.title3,
                            start: req.body.start3,
                            link: req.body.link3,
                            ansvarig: req.body.ansvarig3,
                            className: "eventCompetition",
                            lat: req.body.lat3,
                            lng: req.body.lng3,
                            eventorId: req.body.eventorId3,
                            orgId: req.body.orgId3,
                            year: req.body.start3.toString().substring(0, 4),
                            raceType: req.body.raceType3,
                            raceDistance: req.body.raceDistance3,
                            description: req.body.description,
                            link: "https://eventor.orientering.se/Events/Show/" + req.body.eventorId3
                        })
                    );
                }
            }
            else if (i == 3) {
                year = req.body.start4.toString().substring(0, 4);
                var found = false;
                for (var j = 0; j < events.length; j++) {
                    if (req.body.eventorId4 == events[j].eventorId) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    comps.push(new CalendarEvent({
                            title: req.body.title4,
                            start: req.body.start4,
                            link: req.body.link4,
                            ansvarig: req.body.ansvarig4,
                            className: "eventCompetition",
                            lat: req.body.lat4,
                            lng: req.body.lng4,
                            eventorId: req.body.eventorId4,
                            orgId: req.body.orgId4,
                            year: req.body.start4.toString().substring(0, 4),
                            raceType: req.body.raceType4,
                            raceDistance: req.body.raceDistance4,
                            description: req.body.description,
                            link: "https://eventor.orientering.se/Events/Show/" + req.body.eventorId4
                        })
                    );
                }
            }
            else if (i == 4) {
                year = req.body.start5.toString().substring(0, 4);
                var found = false;
                for (var j = 0; j < events.length; j++) {
                    if (req.body.eventorId5 == events[j].eventorId) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    comps.push(new CalendarEvent({
                            title: req.body.title5,
                            start: req.body.start5,
                            link: req.body.link5,
                            ansvarig: req.body.ansvarig5,
                            className: "eventCompetition",
                            lat: req.body.lat5,
                            lng: req.body.lng5,
                            eventorId: req.body.eventorId5,
                            orgId: req.body.orgId5,
                            year: req.body.start5.toString().substring(0, 4),
                            raceType: req.body.raceType5,
                            raceDistance: req.body.raceDistance5,
                            description: req.body.description,
                            link: "https://eventor.orientering.se/Events/Show/" + req.body.eventorId5
                        })
                    );
                }
            }
        }
        if (comps.length == 0) {
            req.flash("error", "Tävlingen finns redan i kalendern.");
            res.redirect("/admin/calendar/comps/" + year);
        } else {
            CalendarEvent.insertMany(comps, function(err, comps) {
                if (err) {
                    console.log(err);
                    req.flash("error", "Det gick inte att spara tävlingen. Undrar varför?");
                    res.redirect("/admin/calendar/comps/" + year);
                } else {
                    req.flash("success", "Ny tävling sparad.");
                    res.redirect("/admin/calendar/comps/" + year);
                }
            });
        }
    });
});

router.delete("/admin/calendar/comps/:id", middleware.isLoggedIn, function(req,res) {
    var year = req.body.year;
    CalendarEvent.findByIdAndRemove(req.params.id, function(err) {
        if (err) {
            req.flash("error", "Det gick inte att ta bort tävlingen. Undrar varför?");
            res.redirect("/admin/calendar/comps/" + year);
        }
        req.flash("success", "Tävlingen borttagen.");
        res.redirect("/admin/calendar/comps/" + year);
    });
});

router.post("/admin/calendar", middleware.isLoggedIn, function(req, res) {
    var title = decodeURIComponent(req.body.title);
    var start = req.body.start;
    start = start.replace(/\./g, '-');
    var className = req.body.className;
    var link = req.body.link;
    var ansvarig = req.body.ansvarig;
    var description = req.body.description;
    var lat = req.body.lat;
    var lng = req.body.lng;
    if (req.body.new != undefined) {
        var newCalendarEvent = {title: title, start: start, className: className, lat: lat, lng: lng, ansvarig: ansvarig, link: link, description: description};
        CalendarEvent.create(newCalendarEvent, function(err, justCreatedCalendarEvent) {
            if(err) {
                req.flash("error", "Nu blev det nåt knas :-(");
                console.log(err);
                res.redirect("/admin/calendar");
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

router.get("/admin/ungdom", middleware.isUngdomAdmin, function(req, res) {
    res.render("admin/ungdom/index");
});

// function isLoggedIn(req, res, next) {
//     if (req.isAuthenticated()) {
//         return next();
//     }
//     res.redirect("/login");
// }

// function isProduction() {
//     var os = require('os');
//     if (os.hostname == 'server') {
//         return true;
//     } else {
//         return false;
//     }
// }

function saveRunner(newRunner) {
    return new Promise((resolve, reject) => {
        newRunner.save(function(err, data) {
            if (err) {
                // req.flash("error", "Nu blev det knas i steg 5 :-(");
                console.log("error 5");
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function getCompsForRunner(runner, year, io) {
    var runnerId = runner.eventorId;
    // console.log("Found runner: " + runner.nameGiven + " " + runner.nameFamily);
    var options = {
        url: 'https://eventor.orientering.se/api/results/person?personId=' + runnerId + '&fromDate=' + year + '-01-01&toDate=' + year + '-12-31',
        headers: {
            'ApiKey': API_KEY
        }
    };
    return new Promise((resolve, reject) => {
        request(options, function(error, response, body) {
            if (error || response.statusCode != 200) {
                console.log("error 7.1: " + error);
                resolve();
                // req.flash("error", "Nu blev det knas i steg 7.1 :-(");
                // reject(err);
            } else {
                getAndSaveCompetitions(runner, body, year, io);
                resolve();
            }
        });
    });
}

function getAndSaveCompetitions(runner, body, year, io) {
    var runnerId = runner.eventorId;
    parseXMLString(body, function(err, result) {
        if (err) {
            console.log(err);
        } else if (result.ResultListList.ResultList == undefined) {
        } else {
            console.log("Found results for runner: " + runner.nameGiven + " " + runner.nameFamily);
            io.sockets.emit('refresh status', "Hittade resultat för " + year + " för " + runner.nameGiven + " " + runner.nameFamily);
            var competitionsArray = [];
            result.ResultListList.ResultList.forEach(function(comp) {
                var eventorId = comp.Event[0].EventId;
                var name = comp.Event[0].Name;
                var date = comp.Event[0].StartDate[0].Date;
                // var year = year;
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
                            relayLeg: relayLeg,
                            resultYear: year
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
                                    relayLeg: relayLeg,
                                    resultYear: year
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
                                    relayLeg: relayLeg,
                                    resultYear: year
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
                        relayLeg: relayLeg,
                        resultYear: year
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
                    // Runner.update({eventorId: runnerId},{competitions: comps},{upsert:true},function(err){
                    Runner.findByIdAndUpdate(runner._id, {competitions: comps}, function(err, updatedRunner) {
                        if(err){
                            console.log(err);
                        }
                    });
                }
            });
        }
    });
}

function calculatePoints(runner, io) {
// function calculatePoints(runner) {
    return new Promise((resolve, reject) => {
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
        // io.sockets.emit('refresh status', "Poäng beräknat och sparat för " + year + " för " + runner.nameGiven + " " + runner.nameFamily);
        resolve();
    });    
}

function calculateCupPoints(runner, io) {
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
        if (comps[i].points == 100 && comps[i].positionStr == "1") {
            wins++;
        }
    };
    return new Promise((resolve, reject) => {
        Runner.update({_id: runner._id}, {totalPointsOrion1000: totalPointsOrion1000},{upsert:true}, function(err) {
            if (err) {
                console.log(err);
            } else {
                Runner.update({_id: runner._id}, {wins: wins},{upsert:true}, function(err) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        Runner.update({_id: runner._id}, {orion1000Results: results},{upsert:true}, function(err) {
                            if (err) {
                                console.log(err);
                                reject(err);
                            }
                            // io.sockets.emit('refresh status', "Beräknat poäng för Spring till 1000 och Orionpokalen " + year + " för " + runner.nameGiven + " " + runner.nameFamily);
                            console.log("Beräknat poäng för " + runner.nameGiven + " " + runner.nameFamily);
                            resolve();
                        });            
                    }
                });
            }
        });
    });
}

// function isSuperAdmin(user) {
//     var query = User.
//                 find({eventorId: user.eventorId});
//     query.exec(function(err, users) { 
//         if(err) {
//             return "no";
//         } else {
//             if (users.length == 0) {
//                 return "no";
//             } else {
//                 var found = false;
//                 for (var i = 0; i < users[0].roles.length; i++) {
//                     if (users[0].roles[i] === "superadmin") {
//                         found = true;
//                         break;
//                     }
//                 }
//                 if (found) {
//                     return "yes";
//                 } else {
//                     return "no";
//                 }
//             }
//         }
//     });  
//     return "XXX";
// }

module.exports = router;