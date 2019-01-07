var mongoose = require('mongoose');

var runnerSchema = new mongoose.Schema({
    nameFamily: String,
    nameGiven: String,
    birth: String,
    birthYear: { type: Number, default: 1967 },
    eventorId: String,
    competitions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Competition"
        }
    ],
    totalPointsOrion1000: { type: Number, default: 0 },
    totalPointsOrionpokalen: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    orion1000Results: Array
});

module.exports = mongoose.model("Runner", runnerSchema);