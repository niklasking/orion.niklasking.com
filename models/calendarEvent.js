var mongoose = require('mongoose');

var calendarEventSchema = new mongoose.Schema({
    title: String,
    start: String,
    url: String,
    link: String,
    // place: String,
    // responsible: String,
    description: String,
    ansvarig: String,
    className: String,
    lat: String,
    lng: String,
    eventorId: String,
    year: String,
    raceType: String,
    raceDistance: String,
    // raceNight: Boolean,
    orgId: String
});

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);

// raceType:
//  RelaySingleDay - Stafett (natt)
//  IndSingleDay - Individuellt (natt)
//  IndMultiDay - Flerdagars (natt)
//
// raceDistance:
//  Long - Lång
//  Middle - Medel
//  UltraLong - Ultralång
//  Sprint - Sprint
//
// className:
//  eventTraining
//  eventCompetition
//  eventMeeting
//  eventImportant
