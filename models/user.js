var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    nameFamily: String,
    nameGiven: String,
    eventorId: String,
    roles: Array
});

module.exports = mongoose.model("User", userSchema);

// Roles
//  superadmin - can do everything
//  ungdomadmin