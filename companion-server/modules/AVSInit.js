
// Setup HTTP2 connection between server and Alexa Voice Service
// Ref: https://developer.amazon.com/public/solutions/alexa/alexa-voice-service/docs/managing-an-http-2-connection

var http2 = require('http2');

var AVSEvents = require("./AVSEvents.js");
var avsEvents = AVSEvents();

var async = require('async');

module.exports = function(options) {

    var avsAPIHostName = "avs-alexa-na.amazon.com";

    var avsAPIEventsEndpoint = "/v20160207/events";

    var avsAPIDirectivesEndpoint = "/v20160207/directives";

    var mutlipartBoundary = "boundary"
    var boundaryDelimiter = "--" + mutlipartBoundary + "\r\n";
    var endBoundaryDelimiter = "--" + mutlipartBoundary + "--" + "\r\n";

    var AVSInit = function() {

        this.establishDownChannelStream = function(accessToken, callback) {

            var options = {
                hostname: avsAPIHostName,
                port: 443,
                path: avsAPIDirectivesEndpoint,
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + accessToken
                }
            };

            console.log("AVSInit.establishDownChannelStream() options");
            console.log(options);

            var req = http2.request(options, function(res) {

                console.log('AVSInit.establishDownChannelStream() res.statusCode');
                console.log(res.statusCode);

                if(res.statusCode === 204) {
                    console.log("AVSInit.establishDownChannelStream() succeeded.");
                }

                res.on('data', function(chunk) {
                    console.log(chunk);
                });

                res.on('end', function() {
                    console.log('establishDownChannelStream() No more data in response.');
                    //callback(null);
                });

                callback(null);

            });

            req.on('socket', (socket) => {
                console.log("establishDownChannelStream socket");
                //console.log(socket);
                //console.log(`problem with request: ${e.message}`);
            });

            req.on('error', (e) => {
                console.log(e);
                callback({
                    statusCode: 500,
                    error: e
                });
                //console.log(`problem with request: ${e.message}`);
            });

            req.end();

            //callback(null);

        }; // this.establishDownChannelStream()

        this.sendSynchronizeStateEvent = function(accessToken, callback) {

            var ctx = avsEvents.generateContextJSON();

            var evt = avsEvents.generateEventJSON("System.SynchronizeState");

            var body = {
                "context": ctx,
                "event": evt
            };

            var mutipartBody = boundaryDelimiter +
                'Content-Disposition: form-data; name="metadata"' + '\r\n' + 
                'Content-Type: application/json; charset=UTF-8' + '\r\n' + 
                '\r\n' +
                JSON.stringify(body) + '\r\n' +
                endBoundaryDelimiter;

            console.log("AVSInit.sendSynchronizeStateEvent() mutipartBody");
            console.log(mutipartBody);

            var options = {
                hostname: avsAPIHostName,
                port: 443,
                path: avsAPIEventsEndpoint,
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    "Content-type": "multipart/form-data; boundary="+mutlipartBoundary
                }
            };

            console.log("AVSInit.sendSynchronizeStateEvent() options");
            console.log(options);

            var req = http2.request(options, function(res) {

                console.log('AVSInit.sendSynchronizeStateEvent() res.statusCode');
                console.log(res.statusCode);

                res.on('data', function(chunk) {
                    console.log(chunk);
                    var textChunk = chunk.toString('utf8');
                    console.log(textChunk);
                });

                res.on('end', function() {
                    console.log('AVSInit.sendSynchronizeStateEvent() No more data in response.');
                    callback(null);

                });

            });

            req.on('error', (e) => {
                console.log(e);
                callback({
                    statusCode: 500,
                    error: e
                });
            });

            req.write(mutipartBody);

            req.end();

        }; // this.sendSynchronizeStateEvent()

        this.initConnectionWithAVS = function(config, callback) {

            var accessToken = config.accessToken;

            var that = this;

            async.waterfall([
                function(callback) {

                    that.establishDownChannelStream(accessToken, function(error, data) {

                        if(error) {
                            callback(error);
                            return;
                        }

                        callback(null);

                    });

                },
                function(callback) {

                    that.sendSynchronizeStateEvent(accessToken, function(error, data) {

                        if(error) {
                            callback(error);
                            return;
                        }

                        callback(null);

                    });
                }
            ], function (error, result) {
                if(error) {
                    console.log('AVSInit.initConnectionWithAVS() error');
                    console.log(error);
                    callback(error);
                    return;
                }
                callback(null, result);
            });

        }; // this.initConnectionWithAVS()

    }

    return new AVSInit();

}
