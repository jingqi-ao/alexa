var fs = require('fs-extra');

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json

var findRemoveSync = require('find-remove');

var port = null;

// If TRANSCODER_SERVER_USE_HTTPS is set, use HTTPS server
// Otherwise, use http server (e.g. behind a load balancer which offloads TLS)
if(process.env.ALEXA_SERVER_USE_HTTPS) {

    if(process.env.ALEXA_SERVER_PORT) {
        console.log("process.env.TRANSCODER_SERVER_PORT is: " + process.env.TRANSCODER_SERVER_PORT);
        port = process.env.ALEXA_SERVER_PORT;
    } else {
        console.log("process.env.TRANSCODER_SERVER_PORT is NOT set. Use default port 8443");
        port = 8443;
    }

    // Setup HTTPS server
    var options = {
        key: fs.readFileSync('certs/node.key'),
        cert: fs.readFileSync('certs/node.crt')
    };

    var https = require('https');

    https.createServer(options, app).listen(port, function () {
        console.log('Alexa is on HTTPS ');
        console.log('Alexa companion server listening on ' + port);
    });

} else {

    if(process.env.ALEXA_SERVER_PORT) {
        console.log("process.env.TRANSCODER_SERVER_PORT is: " + process.env.ALEXA_SERVER_PORT);
        port = process.env.ALEXA_SERVER_PORT;
    } else {
        console.log("process.env.TRANSCODER_SERVER_PORT is NOT set. Use default port 8080");
        port = 8080;
    }

    var http = require('http');

    http.createServer(app).listen(port, function () {
        console.log('Alexa is on HTTP');
        console.log('Alexa companion server listening on ' + port);
    });

}

// Create the temporary folder
var TEMP_FOLDER_FULL_PATH = '/tmp/alexa';
if (!fs.existsSync(TEMP_FOLDER_FULL_PATH)){
    console.log("Creating folder: " + TEMP_FOLDER_FULL_PATH);
    fs.mkdirSync(TEMP_FOLDER_FULL_PATH);
} else {
    console.log("Emptying folder: " + TEMP_FOLDER_FULL_PATH);
    fs.emptyDir(TEMP_FOLDER_FULL_PATH);
}


app.get('/', function (req, res) {
    console.log("client connected ...");
    res.send('Welcome to use AVS service...');
});

// Handle client upload
var formidable = require('formidable');

var Transcoder = require("./Transcoder.js");
var transcoder = Transcoder();

// Load clientId and clientSecret from Environment Varaibles or json file

var avsConfig = null;

if(process.env.ALEXA_SERVER_AVS_CLIENT_ID && process.env.ALEXA_SERVER_AVS_CLIENT_SECRET) {

    avsConfig = {
        clientId: process.env.ALEXA_SERVER_AVS_CLIENT_ID,
        clientSecret: process.env.ALEXA_SERVER_AVS_CLIENT_SECRET,
        productId: process.env.ALEXA_SERVER_AVS_PRODUCT_ID,
        amazonAuthRedirectURL: process.env.ALEXA_SERVER_AMAZON_REDIRECT_URL,
        transcoderFullURL: process.env.TRANSCODER_SERVER_FULL_URL
    };

} else {

    avsConfig = require('./avs.json');
}

var RouterAmazonAuth = require('./modules/RouterAmazonAuth.js');

var AVSInit = require('./modules/AVSInit.js');
var avsInit = AVSInit();

var Sessions = require('./modules/Sessions.js');
var sessions = Sessions({
    clientId: avsConfig.clientId,
    clientSecret: avsConfig.clientSecret,
    avsInit: avsInit
});

var routerAmazonAuth = RouterAmazonAuth({
    productId: avsConfig.productId,
    amazonAuthRedirectURL: avsConfig.amazonAuthRedirectURL,
    clientId: avsConfig.clientId,
    clientSecret: avsConfig.clientSecret,
    obtainTokenCallback: function(error, data) {
        if(error) {
            console.log("error");
            console.log(error);
            return;
        }
        console.log("data");
        console.log(data);

        sessions.addSession(data.sessionId, data.tokens);

        avsInit.initConnectionWithAVS({
            accessToken: data.tokens.access_token
        }, function(error, data) {
            if(error) {
                console.log("error");
                console.log(error);
                return;
            }
            console.log("data");
            console.log(data);

        });

    }

});

app.use('/auth', routerAmazonAuth);

var RouterEvents = require('./modules/RouterEvents.js');
var routerEvents = RouterEvents({
    sessions: sessions,
    transcoderFullURL: avsConfig.transcoderFullURL
});

app.use('/api/v1/events', routerEvents);

// Start periodic tasks

setInterval(function(){
    sessions.checkSessions();
}, 15*60*1000);


setInterval(function(){
    sessions.pingSessions();
}, 4*60*1000);

setInterval(
    function(){
        console.log("Start cleaning up: " +  TEMP_FOLDER_FULL_PATH);
        var result = findRemoveSync(TEMP_FOLDER_FULL_PATH, {age: {seconds: 3600}});
        console.log("Cleanup result");
        console.log(result);
    }, 
    15*60*1000
);
