var express         = require('express');
var router          = express.Router();
var passport        = require('passport');
var request         = require('request');
// var News            = require('../models/News');

router.get("/news/new", function(req, res) {
    res.render("news/new");
});

module.exports = router;