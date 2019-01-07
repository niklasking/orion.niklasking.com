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
    lng: String
});

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);