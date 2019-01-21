var mongoose = require('mongoose');

var newsSchema = new mongoose.Schema({
    rubrik: String,
    text: String,
    types: Array,
    documents: Array,
    to: Date,
    from: Date,
    created: Date,
    modified: Date,
    createdBy: String,
    modifiedBy: String
});

module.exports = mongoose.model("News", newsSchema);