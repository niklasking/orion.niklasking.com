var mongoose = require('mongoose');

var noCalcCompetitionSchema = new mongoose.Schema({
    eventorId: String,
    orgId: String,
    date: String,
    name: String,
    ansvarig: String,
    lat: String,
    lng: String,
    raceType: String,
    raceDistance: String,
    resultYear: String
});

module.exports = mongoose.model("NoCalcCompetition", noCalcCompetitionSchema);
