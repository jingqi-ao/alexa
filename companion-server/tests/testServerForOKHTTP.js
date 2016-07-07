
var http = require('http');

var express = require('express');
var app = express();

PORT = 4000;

/*
// HTTPS server
https.createServer(options, app).listen(PORT, function () {
    console.log('Alexa companion server listening on ' + PORT);
});

app.get('/', function (req, res) {
    res.send('Hello World!');
});
*/

// HTTP server
app.get('/', function(req, res){
    console.log("hit /");
    res.send('hello world');
});

// Upload the sound file

var formidable = require('formidable');

var Transcoder = require("../Transcoder.js");
var transcoder = Transcoder();

app.post('/events', function(req, res) {

    console.log("/events");

    console.log(req.get('Content-Type'));

    var form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = "/tmp";

    form.parse(req, function(err, fields, files) {

        console.log("err");
        console.log(err);

        console.log("fields");
        console.log(fields);

        console.log("files");
        console.log(files);

        res.send('POST /events');

    });

})

app.listen(PORT, function() {
    console.log('Alexa companion server listening on ' + PORT);
});
