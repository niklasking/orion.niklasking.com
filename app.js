var express         = require('express'),
    request         = require('request'),
    bodyParser      = require('body-parser'),
    parseXMLString  = require('xml2js').parseString,
    methodOverride  = require('method-override');
    flash           = require('connect-flash'),
    mongoose        = require('mongoose'),
    passport        = require('passport'),
    CustomStrategy  = require('passport-custom'),
    Tabulator       = require('tabulator-tables'),
    Runner          = require('./models/runner'),
    Competition     = require('./models/competition'),
    fs              = require('fs'),
    http            = require('http'),
    https           = require('https'),
    helmet          = require('helmet'),
    middleware      = require('./middleware');

var indexRoutes         = require("./routes/index");
var adminRoutes         = require("./routes/admin");
var resultsRoutes       = require("./routes/results");
var playgroundRoutes    = require("./routes/playground");

var API_KEY = "";

var dbUrl = process.env.DATABASEURL || "mongodb://localhost/orionpokalen";
mongoose.connect(dbUrl);


var app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use('/static', express.static('static'));
app.use(flash());
app.use(methodOverride("_method"));

// var io;
var server;
if (isProduction()) {
    app.use(helmet());
        const options = {
        key: fs.readFileSync("/etc/letsencrypt/live/niklasking.com/privkey.pem"),
        cert: fs.readFileSync("/etc/letsencrypt/live/niklasking.com/fullchain.pem")
    };

    server = https.Server(options, app);
    server.listen(443);
    app.listen(80);
    console.log("Server started at port 443.");
    // io = require('socket.io')(https);
} else {
    server = http.Server(app);
    server.listen(4455);
    console.log("Server started at port 4455.");
    // io = require('socket.io')(http);
}
var io = require('socket.io')(server);
app.io = io;

io.on('connection', function(socket){
    // console.log('A USER is connected');
    socket.on('disconnect', function(){
    //   console.log('A USER got disconnected');
    });
});
// io.on('connection', function(socket){
//     socket.on('chat message', function(msg){
//       console.log('message: ' + msg);
//     });
// });
// io.on('connection', function(socket){
//     socket.on('chat message', function(msg){
//       io.emit('chat message', msg);
//     });
// });
io.on('connection', function(socket){
    socket.on('refresh status', function(msg){
      io.emit('refresh status', msg);
    });
});

app.use(require("express-session")({
    secret: "Ole King cyklade runt Hagel Island on the ice with suger in his hair",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use('custom', new CustomStrategy(
    function(req, done) {
        // var eventorLogin = process.env.EVENTOR_LOGIN || "0";
        // if (eventorLogin == "0") {
        if (!isProduction()) {
            // ===================================================================
            // THIS IS A TEMPORARY SOLUTION - TO BE REMOVED WHEN USING EVENTOR
            // ===================================================================
            if (req.body.username == "orion" && req.body.password == "hej") {
                var user = {
                    eventorId:          "27788",
                    nameFamily:         "Orion",
                    nameGiven:          "Admin",
                    phoneNumber:        "123456789",
                    mobilePhoneNumber:  "987654321",
                    mailAddress:        "orion@orion.orion"
                };
                done(null, user);
            } else {
                done(null, null);
            }
            // ===================================================================
            // END
            // ===================================================================
        } else {
            // ===================================================================
            // THIS IS THE EVENTOR AUTHENTICATION - ACTIVATE ONCE HTTPS IS ENABLED
            // ===================================================================
            var options = {
                url: 'https://eventor.orientering.se/api/authenticatePerson',
                headers: {
                'ApiKey': API_KEY,
                'Username': req.body.username,
                'Password': req.body.password
                }
            };
            request(options, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    parseXMLString(body, function(err, result) {
                        // console.log("Frågat Eventor. fick svaret: " + response.statusCode + ": " + err);
                        if (err) {
                            done(err, null);
                        }
                        var eventorId           = result.Person.PersonId;
                        var nameFamily          = result.Person.PersonName[0].Family;
                        var nameGiven           = result.Person.PersonName[0].Given[0]._;
                        var phoneNumber         = "";
                        var mobilePhoneNumber   = "";
                        var mailAddress         = "";
                        if (result.Person.Tele[0].TeleType[0].$.value.toString() == "official") {
                            phoneNumber         = result.Person.Tele[0].$.phoneNumber;
                            mobilePhoneNumber   = result.Person.Tele[0].$.mobilePhoneNumber;
                            mailAddress         = result.Person.Tele[0].$.mailAddress;    
                        }
                        var user = {
                            eventorId:          eventorId,
                            nameFamily:         nameFamily,
                            nameGiven:          nameGiven,
                            phoneNumber:        phoneNumber,
                            mobilePhoneNumber:  mobilePhoneNumber,
                            mailAddress:        mailAddress
                        };
                        done(null, user);
                    });
                } else {
                    // User not found: 404
                    // Fel lösenord: 404
                    // console.log("Frågat Eventor. fick svaret :-(: " + response.statusCode + ": " + error);
                    done(error, null);
                }
            });   
            // ===================================================================
            // END
            // ===================================================================
        }
    }
  ));

passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.use(function(req, res, next) {
    res.locals.currentUser  = req.user;
    res.locals.error        = req.flash("error");
    res.locals.success      = req.flash("success");
    next();
});


var db = mongoose.connection;
db.on('error', console.error.bind("Could not connect to MongoDB"));
db.once('open', function() {

});

app.use("/", indexRoutes);
app.use("/", adminRoutes);
app.use("/", resultsRoutes);
app.use("/", playgroundRoutes);

// if (isProduction()){
//     const options = {
//         key: fs.readFileSync("/etc/letsencrypt/live/niklasking.com/privkey.pem"),
//         cert: fs.readFileSync("/etc/letsencrypt/live/niklasking.com/fullchain.pem")
//     };
//     https.createServer(options, app).listen(443);
//     console.log("Server started at port 443.");
// } else {
//     // var server = http.listen(4455, process.env.IP, function() {
//     // var server = app.listen(process.env.PORT, process.env.IP, function() {
//     http.createServer(app).listen(4455);
//     console.log("Orionpokalen is started at port 4455.");    
//     // });
// }

function isProduction() {
    var os = require('os');
    if (os.hostname == 'server') {
        return true;
    } else {
        return false;
    }
}