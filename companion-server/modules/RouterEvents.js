
var express = require('express');
var request = require("request");

var formidable = require('formidable');

var async = require('async');

var Transcoder = require("./Transcoder.js");
var transcoder = Transcoder();

var fs = require('fs');



var AVSEvents = require("./AVSEvents.js");
var avsEvents = AVSEvents();

module.exports = function(options)  {

    var sessions = options.sessions;

    var router = express.Router();

    router.post('/', function(req, res) {


        console.log("hit /events");

        var form = new formidable.IncomingForm();
        form.encoding = 'binary';
        form.uploadDir = "/tmp";

        form.parse(req, function(err, fields, files) {

            console.log("fields");
            console.log(fields);

            var sessionId = fields.sessionId;

            if(!sessionId) {
                // If no sessionId
                res.status(401).send('No sessionId in the request');
                return;
            }

            var session = sessions.getSession(sessionId);

            if(!session) {
                // If no sessionId
                res.status(401).send('the provided sessionId is not valid');
                return;
            }

            var wavFileFullPath = null;

            async.waterfall([
                function(callback) {

                    var file = files.audio;

                    console.log(typeof file);

                    var threeGPPFileFullPath = file.path;
                    wavFileFullPath = file.path + '.wav';

                    // Transcaode .3gpp file to .wav file
                    transcoder.threeGPPtoWav(threeGPPFileFullPath, wavFileFullPath);

                    callback(null);

                },
                function(callback) {

                    // Read .wav file into buffer
                    var wavFileBuffer = fs.readFileSync(wavFileFullPath);

                    var accessToken = session.tokens.access_token;

                    var eventParam = {
                        eventType: "SpeechRecognizer.Recognize",
                        audioBuffer: wavFileBuffer
                    }

                    avsEvents.sendEventToAVS(eventParam, accessToken, function(error, data) {
                        if(error) {
                            callback(error);
                            return;
                        }
                        callback(null, data);
                    })


                }
            ], function (error, result) {
                if(error) {
                    console.log('RouterEvents error');
                    console.log(error);
                    res.status(500).end();
                    return;
                }
                res.status(200).send(result.audioBuffer);
            }); // async.waterfall()

        }); // form.parse()



    }); // router.get('/events',...)


    return router;

}