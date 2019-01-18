var express         = require('express');
var router          = express.Router();
var passport        = require('passport');
var request         = require('request');
// var formidable      = require('formidable');
var fs              = require('fs');
var util            = require('util');
var multer          = require('multer');
var thumb           = require('node-thumbnail').thumb;

var upload = multer({ dest: './uploads/' });
// var News            = require('../models/News');

router.get("/news/new", function(req, res) {
    res.render("news/new", {uploadedFile: "", newsContent: ""});
});

router.post("/news/img/upload", upload.single("upload"), function(req, res) {
    if (req.file) {
        // console.log(req.file.mimetype);
        var oldPath = __dirname + "/../" + req.file.path;
        var newPath = __dirname + "/../static/imgs/uploaded/src/" + req.file.originalname;
        var thumb_smallPath = __dirname + "/../static/imgs/uploaded/thumbnail_small/";
        if (req.file.mimetype == "image/jpeg" || req.file.mimetype == "image/png" || req.file.mimetype == "image/bmp") {
            // Supported file type
            thumb({
                    source: oldPath, // could be a filename: dest/path/image.jpg
                    destination: thumb_smallPath,
                    suffix: '',
                    width: 200,
                    ignore: true,
                    skip: true,
                    basename: req.file.originalname
                }, function(files, err, stdout, stderr) {
                    fs.copyFileSync(oldPath, newPath, function (err) {
                        if (err) {
                            console.log("Could not copy file " + err);
                        }
                    });
                    fs.unlink(oldPath,function(err){
                        if(err) return console.log(err);
                    }); 
                    var uploadedFile = "/static/imgs/uploaded/src/" + req.file.originalname;    
                    res.send({uploadedFile: uploadedFile});
                });
        } else {
            fs.copyFileSync(oldPath, newPath, function (err) {
                if (err) {
                    console.log("Could not copy file " + err);
                }
            });
            fs.unlink(oldPath,function(err){
                if(err) return console.log(err);
            }); 
            var uploadedFile = "/static/imgs/uploaded/src/" + req.file.originalname;    
            res.send({uploadedFile: uploadedFile});
        } 
    } else {
        console.log('No File Uploaded');
        res.send({uploadedFile: ""});
    }
});

router.get("/news/imgs/old", function(req, res) {
    var oldImages = [];
    var thumbnailFolderPath = __dirname + '/../static/imgs/uploaded/thumbnail_small/';
    console.log(thumbnailFolderPath);
    // var fs = require('fs');

    fs.readdirSync(thumbnailFolderPath).forEach(file => {
                console.log(file);
                oldImages.push("/static/imgs/uploaded/thumbnail_small/" + file);
    });
    res.send({oldImages: oldImages});
});

module.exports = router;