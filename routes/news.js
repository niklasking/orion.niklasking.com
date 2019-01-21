var express         = require('express');
var router          = express.Router();
var passport        = require('passport');
var request         = require('request');
// var formidable      = require('formidable');
var fs              = require('fs');
var util            = require('util');
var multer          = require('multer');
var thumb           = require('node-thumbnail').thumb;
var moment          = require('moment');
var middleware      = require("../middleware");

var upload = multer({ dest: './uploads/' });
var News = require('../models/news');

router.get("/news/new", middleware.isLoggedIn, function(req, res) {
    res.render("news/new", {uploadedFile: "", newsContent: ""});
});

router.get("/news", function(req, res) {
    var now = moment();
    News.find({from: {"$lt": now}, to: {"$gt": now}, types: req.query.client})
        .sort({modified: 1})
        .exec(function(err, news) {
            // console.log(news);
            if(err) {
                console.log(err);
                res.send();
            }
            else {
                res.send({news: news});
            }
        });
});

router.post("/news", middleware.isLoggedIn, function(req, res) {
    var types = [];
    if (req.body.club != undefined) {
        types.push("club");
    }
    if (req.body.elit != undefined) {
        types.push("elit");
    }
    if (req.body.ungdom != undefined) {
        types.push("ungdom");
    }
    if (req.body.facebook != undefined) {
        types.push("facebook");
    }
    var newNews = { rubrik: req.body.rubrik, 
                    text: req.body.text,
                    to: moment(req.body.to, "YYYY-MM-DD HH:mm:ss"),
                    from: moment(req.body.from, "YYYY-MM-DD HH:mm:ss"),
                    created: moment(),
                    modified: moment(),
                    createdBy: req.user.nameGiven + " " + req.user.nameFamily,
                    types: types,
                    documents: req.body.documents
                };
    News.create(newNews, function(err, justCreatedNews) {
        if(err) {
            req.flash("error", "Nu blev det nåt knas :-(");
            console.log(err);
            res.redirect("/home");
        }
        else {
            // req.flash("success", "Successfully created a campground.");
            req.flash("success", "Nyheten " + req.body.rubrik + " sparad.");
            res.redirect("/home");
        }
    }); 
});

router.post("/news/img/upload", middleware.isLoggedIn, upload.single("upload"), function(req, res) {
    if (req.file) {
        // console.log(req.file.mimetype);
        if (!req.file.mimetype.startsWith("image/")) {
            console.log('No File Uploaded. Faulty mimetype: ' + req.file.mimetype);
            res.send({uploadedFile: ""});    
        } else {
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
        }
    } else {
        console.log('No File Uploaded');
        res.send({uploadedFile: ""});
    }
});

router.post("/news/doc/upload", middleware.isLoggedIn, upload.single("uploadDoc"), function(req, res) {
    if (req.file) {
        // console.log(req.file.mimetype);
        var oldPath = __dirname + "/../" + req.file.path;
        var newPath = __dirname + "/../static/docs/uploaded/" + req.file.originalname;
            fs.copyFileSync(oldPath, newPath, function (err) {
                if (err) {
                    console.log("Could not copy file " + err);
                }
            });
            fs.unlink(oldPath,function(err){
                if(err) return console.log(err);
            }); 
            var uploadedFile = "/static/docs/uploaded/" + req.file.originalname;    
            res.send({uploadedFile: uploadedFile});
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
        oldImages.push("/static/imgs/uploaded/thumbnail_small/" + file);
    });
    res.send({oldImages: oldImages});
});

module.exports = router;