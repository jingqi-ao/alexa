
// Transcoder-server
//
//      Dedicated server for .3gp to .wav transcoding
//      Use HTTPS to encrypt the user's voice file

var https = require('https');

var express = require('express');
var app = express();

var formidable = require('formidable');

var fs = require('fs-extra');

var findRemoveSync = require('find-remove');

if(process.env.TRANSCODER_SERVER_PORT) {
    console.log("process.env.TRANSCODER_SERVER_PORT is: " + process.env.TRANSCODER_SERVER_PORT);
} else {
    console.log("process.env.TRANSCODER_SERVER_PORT is NOT set. Use default port 9443");
}
var port = process.env.TRANSCODER_SERVER_PORT ? process.env.TRANSCODER_SERVER_PORT : 9443;

var Transcoder = require("./modules/Transcoder.js");
var transcoder = Transcoder();

// Create the temporary folder
var TEMP_FOLDER_FULL_PATH = '/tmp/alexa';
if (!fs.existsSync(TEMP_FOLDER_FULL_PATH)){
    console.log("Creating folder: " + TEMP_FOLDER_FULL_PATH);
    fs.mkdirSync(TEMP_FOLDER_FULL_PATH);
} else {
    console.log("Emptying folder: " + TEMP_FOLDER_FULL_PATH);
    fs.emptyDir(TEMP_FOLDER_FULL_PATH);
}

// Setup HTTPS server
var options = {
    key: fs.readFileSync('certs/node.key'),
    cert: fs.readFileSync('certs/node.crt')
};

https.createServer(options, app).listen(port, function () {
    console.log('Transcoder server is running at: ' + port);
});

// POST /api/v1/transcode
// Expect body:
// {
//     audio: FILE
// }

app.post('/api/v1/transcode', function (req, res) {

    var form = new formidable.IncomingForm();
    form.encoding = 'binary';
    form.uploadDir = TEMP_FOLDER_FULL_PATH;

    form.parse(req, function(err, fields, files) {

        if(err) {

            console.log("error");
            console.log(err);

            res.status(500).end();

            return;
        }

        console.log("fields");
        console.log(fields);

        // From 3GPP file to .wav file
        var file = files.audio;

        console.log(typeof file);

        var threeGPPFileFullPath = file.path;
        var wavFileFullPath = file.path + '.wav';

        // Transcaode .3gpp file to .wav file
        transcoder.threeGPPtoWav(threeGPPFileFullPath, wavFileFullPath);

        // Read .wav file
        var wavFileBuffer = fs.readFileSync(wavFileFullPath);

        //fs.writeFileSync('/tmp/alexa/onServer.wav', wavFileBuffer, 'binary');

        console.log("check check");
        console.log(typeof wavFileBuffer);
        console.log(wavFileBuffer.length);

        res.status(200).send(wavFileBuffer);

    }); // form.parse()

});

// Cleanup job (run every 1 hour)
function periodicCleanup() {
    console.log("Start cleaning up: " +  TEMP_FOLDER_FULL_PATH);
    var result = findRemoveSync(TEMP_FOLDER_FULL_PATH, {age: {seconds: 3600}});
    console.log("Cleanup result");
    console.log(result);
}

setInterval(
    function(){
        periodicCleanup();
    }, 
    15*60*1000
);
