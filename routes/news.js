var express         = require('express');
var router          = express.Router();
var passport        = require('passport');
var request         = require('request');
// var formidable      = require('formidable');
var fs              = require('fs');
var util            = require('util');
var multer          = require('multer');

var upload = multer({ dest: './uploads/' });
// var News            = require('../models/News');

router.get("/news/new", function(req, res) {
    res.render("news/new", {uploadedFile: "", newsContent: ""});
});

router.post("/news/img/upload", upload.single("upload"), function(req, res) {
    if (req.file) {
        var oldpath = __dirname + "/../" + req.file.path;
        var newpath = __dirname + "/../static/imgs/uploaded/" + req.file.originalname;
        fs.renameSync(oldpath, newpath, function (err) {
            if (err) throw err;
        });
        var uploadedFile = "/static/imgs/uploaded/" + req.file.originalname;
    } else {
        console.log('No File Uploaded');
        var uploadedFile = "";
        var uploadStatus = 'File Upload Failed';
    }
    res.send({uploadedFile: uploadedFile});
});

module.exports = router;