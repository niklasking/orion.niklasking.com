var express         = require('express');
var router          = express.Router();
var passport        = require('passport');
var CalendarEvent   = require('../models/calendarEvent');

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

router.get("/kalender", function(req, res) {
    var date = req.query.date;
    var _id = req.query._id;
    var title = req.query.title;
    var className = req.query.className;
    var lat = req.query.lat;
    var lng = req.query.lng;
    var ansvarig = req.query.ansvarig;
    var link = req.query.link;
    var description = req.query.description;
    CalendarEvent.find({}, function(err, events) {
        if(err) {
            console.log(err);
        }
        else {
            res.render("calendar/calendar", {event_list: events, date: date, _id: _id, className: className, lat: lat, lng: lng, title: title, ansvarig: ansvarig, link: link, description: description});
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
