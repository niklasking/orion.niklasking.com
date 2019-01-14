var User = require("../models/user");

var middlewareObj = {};

middlewareObj.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Please login first!");
    res.redirect("/login");
}

middlewareObj.isSuperAdmin = function (req, res, next) {
    checkRole("superadmin", req, res, next);
}

middlewareObj.isUngdomAdmin = function (req, res, next) {
    checkRole("ungdomadmin", req, res, next);
}

function checkRole(requiredRole, req, res, next) {
    if (req.isAuthenticated()) {
        var query = User.
                    find({eventorId: req.user.eventorId});
        query.exec(function(err, users) { 
            if(err) {
                req.flash("error", "Something went wrong.");
                res.redirect("back");
            }
            else {
                if (users.length == 0) {
                    req.flash("error", "Du saknar behörighet. Vänligen kontakta IT-support.");
                    res.redirect("back");
                } else {
                    var found = false;
                    for (var i = 0; i < users[0].roles.length; i++) {
                        if (users[0].roles[i] == requiredRole) {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        next();
                    } else {
                        req.flash("error", "Du saknar behörighet. Vänligen kontakta IT-support.");
                        res.redirect("back");
                    }
                }
            }
        });  
    } else {
        req.flash("error", "Please login first.");
        res.redirect("/login");
    }
}

module.exports = middlewareObj;