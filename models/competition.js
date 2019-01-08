var mongoose = require('mongoose');

var competitionSchema = new mongoose.Schema({
    eventorId: String,
    name: String,
    date: String,
    resultYear: String,
    category: String,
    statusOk: Boolean,
    className: String,
    classType: String,
    resultOk: Boolean,
    // position: { type: Number, default: 0 },
    positionStr: String,
    starts: Number,
    relay: { type: Boolean, default: false },
    relayTeam: { type: String, default: "" },
    relayLeg: { type: String, default: "" },
    // basePoints: { type: Number, default: 30 },
    // fixedPoints: { type: Number, default: 0 },
    points: { type: Number, default: 0 }
});

module.exports = mongoose.model("Competition", competitionSchema);

// category: 
// 1 = mästerskap
// 2 = nationell tävling
// 3 = distriktstävling
// 4 = närtävling
// 5 = klubbtävling

// status:
// 5 = annat
// 9  = OK
// 10 = inställd

// classType:
// 16 = elitklass
// 17 = vanlig tävlingsklass
// 18 = inskolning eller U-klass
// 19 = öppen bana