var mongoose = require('mongoose');

var calendarEventSchema = new mongoose.Schema({
    title: String,
    start: String,
    url: String,
    link: String,
    place: String,
    responsible: String,
    description: String,
    ansvarig: String,
    className: String,
    lat: String,
    lng: String,
    eventorId: String,
    year: String,
    raceType: String,
    raceDistance: String,
    raceNight: Boolean
});

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);

// raceType:
//  RelaySingleDay
//  IndSingleDay
//  IndMultiDay
//
// raceDistance:
//  Long
//  Middle
//  UltraLong
//  Sprint
//
// className:
//  eventTraining
//  eventCompetition
//  eventMeeting
//  eventImportant
