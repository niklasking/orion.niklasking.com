var express         = require('express');
var router          = express.Router();
var passport        = require('passport');
var request         = require('request');
var formidable      = require('formidable');
var fs              = require('fs');
var util            = require('util');
var os = require('os');
// var News            = require('../models/News');

router.get("/news/new", function(req, res) {
    res.render("news/new", {uploadedFile: "", newsContent: ""});
});

router.post("/news/img/upload", function(req, res) {
    var form = new formidable.IncomingForm();
 
    form.parse(req, function (err, fields, files) {
        // console.log(fields);
        // console.log("*************");
        var uploadedFile = files.upload.path + "/" + files.upload.name;
        // var oldpath = files[0].path;
        // var newpath = '/uploads/' + files[0].name;
        // fs.rename(oldpath, newpath, function (err) {
        // if (err) throw err;
        //     res.write('File uploaded and moved!');
        //     res.end();
        // });
        // res.write('File uploaded');
        // res.end();
        res.send({uploadedFile: uploadedFile, newsContent: fields.newsContent});
        // res.render("news/new", {uploadedFile: uploadedFile, newsContent: fields.newsContent});
    });
});

module.exports = router;