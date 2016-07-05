
// Note: replace http2 to http in the testRequest() function
var http = require("http");

var avsAPIHostName = 'localhost';
var avsAPIEventsEndpoint = '/events';
var uuid = require('node-uuid');

var mutlipartBoundary = "boundary"
var boundaryDelimiter = "--" + mutlipartBoundary + "\r\n";
var endBoundaryDelimiter = "--" + mutlipartBoundary + "--" + "\r\n";

var tokenObj = {
    access_token: "1234"
};

var fs = require('fs');

function testRequest() {

    var ctx = [
        {
            "header": {
                "namespace": "AudioPlayer",
                "name": "PlaybackState"
            },
            "payload": {
                "token": "",
                "offsetInMilliseconds": 0,
                "playerActivity": "IDLE"
            }
        },
        {
            "header": {
                "namespace": "Alerts",
                "name": "AlertsState"
            },
            "payload": {
                "allAlerts": [],
                "activeAlerts": []
            }
        },
        {
            "header": {
                "namespace": "Speaker",
                "name": "VolumeState"
            },
            "payload": {
                "volume": 0,
                "muted": false
            }
        },
        {
            "header": {
                "namespace": "SpeechSynthesizer",
                "name": "SpeechState"
            },
            "payload": {
                "token": "",
                "offsetInMilliseconds": 0,
                "playerActivity": "FINISHED"
            }
        }
    ];

    var evt = {
        "header": {
            "namespace": "SpeechRecognizer",
            "name": "Recognize",
            "messageId": uuid.v1(),
            "dialogRequestId": uuid.v1()
        },
        "payload": {
            "profile": "CLOSE_TALK",
            "format": "AUDIO_L16_RATE_16000_CHANNELS_1"
        }
    }

    var body = {
        "context": ctx,
        "event": evt
    };

    var mutipart1 = boundaryDelimiter +
        'Content-Disposition: form-data; name="metadata"' + '\r\n' + 
        'Content-Type: application/json; charset=UTF-8' + '\r\n' + 
        '\r\n' +
        JSON.stringify(body) + '\r\n';

    console.log("mutipart1");
    console.log(mutipart1);

    var multipart2Head = boundaryDelimiter +
        'Content-Disposition: form-data; name="audio"' + '\r\n' + 
        'Content-Type: application/octet-stream' + '\r\n' + 
        '\r\n';

    //var multipart2AudioBuffer = fs.readFileSync('/home/jao/wavs/weather.wav');
    var multipart2AudioBuffer = fs.readFileSync('/home/jao/wavs/test-small.bin');

    console.log("multipart2AudioBuffer length");
    console.log(multipart2AudioBuffer.length);

    var multipart2End = '\r\n' + endBoundaryDelimiter;


    // Buffers
    var multipart1Buffer = Buffer.from(mutipart1);

    var multipart2HeadBuffer = Buffer.from(multipart2Head);
    var multipart2EndBuffer = Buffer.from(multipart2End);

    var bodyBuffer = Buffer.concat([multipart1Buffer, multipart2HeadBuffer, multipart2AudioBuffer, multipart2EndBuffer], 
        multipart1Buffer.length + multipart2HeadBuffer.length + multipart2AudioBuffer.length + multipart2EndBuffer.length);

    console.log("bodyBuffer length");
    console.log(bodyBuffer.length);

    var options = {
        hostname: avsAPIHostName,
        port: 5000,
        path: avsAPIEventsEndpoint,
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + tokenObj.access_token,
            "Content-type": "multipart/form-data; boundary="+mutlipartBoundary
        }
    };

    console.log("avsSendSynchronizeStateEvent options");
    console.log(options);

    var req = http.request(options, function(res) {

        console.log(res.statusCode);

        res.on('data', function(chunk) {
            console.log(chunk);
            var textChunk = chunk.toString('utf8');
            console.log(textChunk);
        });

        res.on('end', function() {
            console.log('No more data in response.')
        });

    });

    req.on('error', (e) => {
        console.log(e);
        //console.log(`problem with request: ${e.message}`);
    });

    console.log("bodyBuffer");
    console.log(bodyBuffer.toString());

    req.write(bodyBuffer);

    req.end();

}

/*
function testRequest() {

    var ctx = [
        {
            "header": {
                "namespace": "AudioPlayer",
                "name": "PlaybackState"
            },
            "payload": {
                "token": "",
                "offsetInMilliseconds": 0,
                "playerActivity": "IDLE"
            }
        },
        {
            "header": {
                "namespace": "Alerts",
                "name": "AlertsState"
            },
            "payload": {
                "allAlerts": [],
                "activeAlerts": []
            }
        },
        {
            "header": {
                "namespace": "Speaker",
                "name": "VolumeState"
            },
            "payload": {
                "volume": 0,
                "muted": false
            }
        },
        {
            "header": {
                "namespace": "SpeechSynthesizer",
                "name": "SpeechState"
            },
            "payload": {
                "token": "",
                "offsetInMilliseconds": 0,
                "playerActivity": "FINISHED"
            }
        }
    ];

    var evt = {
        "header": {
            "namespace": "System",
            "name": "SynchronizeState",
            "messageId": uuid.v1()
        },
        "payload": {
        }
    }

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

    console.log("mutipartBody");
    console.log(mutipartBody);

    var options = {
        hostname: avsAPIHostName,
        port: 5000,
        path: avsAPIEventsEndpoint,
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + tokenObj.access_token,
            "Content-type": "multipart/form-data; boundary="+mutlipartBoundary
        }
    };

    console.log("avsSendSynchronizeStateEvent options");
    console.log(options);

    var req = http.request(options, function(res) {

        console.log(res.statusCode);

        res.on('data', function(chunk) {
            console.log(chunk);
            var textChunk = chunk.toString('utf8');
            console.log(textChunk);
        });

        res.on('end', function() {
            console.log('No more data in response.')
        });

    });

    req.on('error', (e) => {
        console.log(e);
        //console.log(`problem with request: ${e.message}`);
    });

    req.write(mutipartBody);

    req.end();

}
*/

testRequest();