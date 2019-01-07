var express = require('express');
var router = express.Router();
var passport = require('passport');

var YEAR = 2018;
var API_KEY = "";

router.get("/auth", function(req, res) {
    var options = {
        url: 'https://eventor.orientering.se/api/authenticatePerson',
        headers: {
          'ApiKey': API_KEY,
          'Username': '',
          'Password': ''
        }
    };
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            parseXMLString(body, function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    res.send(result);
                }
            });
        } else {
            // User not found: 404
            // Fel lösenord: 404
            res.send(response.statusCode + ": " + error);

        }
    });                
});

router.get("/runners/test/:id", function(req, res) {
    // Anton: 9944
    var options = {
        url: 'https://eventor.orientering.se/api/results/person?personId=' + req.params.id + '&fromDate=' + YEAR + '-01-01&toDate=' + YEAR + '-12-31',
        headers: {
        'ApiKey': API_KEY
        }
    };
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            parseXMLString(body, function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    res.send(result);
                }
            });
        }
    });
});

router.get("/test/landing1", function(req, res) {
    res.render("test/landing1");
});


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

module.exports = router;