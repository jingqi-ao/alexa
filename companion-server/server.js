var https = require('https');

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json

var port = 8443;

// Setup HTTPS server
var fs = require('fs');

var options = {
    key: fs.readFileSync('certs/node.key'),
    cert: fs.readFileSync('certs/node.crt')
};

https.createServer(options, app).listen(port, function () {
    console.log('Alexa companion server listening on ' + port);
});

app.get('/', function (req, res) {
    res.send('Hello World!');
});


// Load avs.json
avsConfig = require('./avs.json');

var clientId = avsConfig.clientId;
var clientSecret = avsConfig.clientSecret;

console.log("avsConfig");
console.log(avsConfig);

// Amazon Login
var authAmazonURL = "https://www.amazon.com/ap/oa";

var scope="alexa:all";
var scopeData = {
    "alexa:all": {
        "productID": "device_note3",
        "productInstanceAttributes": {
            "deviceSerialNumber": "bigboss"
        }
    }
};
var responseType = "code";
var redirectURL = "https://localhost:8443/auth/amazonresponse";


var querystring = require('querystring');
app.get('/auth/login', function (req, res) {

    console.log("json");
    var scopeDataJSONString = JSON.stringify(scopeData);
    var scopeDataJSONStringEscaped = querystring.escape(scopeDataJSONString);

    console.log("scopeDataJSONString");
    console.log(scopeDataJSONString);

    console.log("scopeDataJSONStringEscaped");
    console.log(scopeDataJSONStringEscaped);

    var queryObj = {
        client_id: clientId,
        scope: scope,
        scope_data: scopeDataJSONStringEscaped,
        response_type: responseType,
        redirect_uri: redirectURL
    };

    console.log("queryObj");
    console.log(queryObj);


    var queryString = "client_id=" + clientId + "&" +
        "scope=" + querystring.escape(scope) + "&" +
        "scope_data=" + querystring.escape(JSON.stringify(scopeData)) + "&" +
        "response_type=" + responseType + "&" +
        "redirect_uri=" + querystring.escape(redirectURL);

    console.log("queryObj");
    console.log(queryObj);

    //var queryString = querystring.stringify(queryObj);

    console.log("queryString");
    console.log(queryString);

    var loginWithAmazonURL = authAmazonURL + "?" + queryString;

    console.log("loginWithAmazonURL");
    console.log(loginWithAmazonURL);

    res.redirect(loginWithAmazonURL);
});

// Amazon response handler
var tokenObj = null;
app.get('/auth/amazonresponse', function(req, res) {

    console.log("/auth/amazonresponse");

    var code = req.query.code;
    var scope = req.query.scope;

    // code is returned
    if(code) {
        getTokens(code, null, null, null, function(error,httpResponse,body) {
            if(error) {
                console.log(error);
                res.status(401).end();
                return;
            }
            console.log("body");
            console.log(typeof body);
            console.log(body);

            tokenObj = JSON.parse(body);

            // TEST ONLY:Triger avs functions
            //setTimeout(avsCreateDownChannelStream, 3000);
            setTimeout(testFunc, 3000);
            // TEST ONLY (END)

            res.send('Tokens obtained');
        });
    }

});

// Get accessCode
var request = require("request");
function getTokens(code, client_id, client_secret, redirect_uri, callback) {

    console.log("getTokens");

    if(!client_id) {
        client_id = clientId;
    }

    if(!client_secret) {
        client_secret = clientSecret;
    }

    var formObj = {
        grant_type: "authorization_code",
        code: code,
        client_id: client_id,
        client_secret: client_secret,
        redirect_uri: redirectURL
    };

    request.post({
        url:'https://api.amazon.com/auth/o2/token',
        form: formObj}, callback);
}

// AVS
function testFunc() {
    avsCreateDownChannelStream();
    setTimeout(avsSendSynchronizeStateEvent, 10000);
    setTimeout(avsSendSpeechRecognizerRecognizeEvent, 20000);
}

var http2 = require('http2');
var uuid = require('node-uuid');
var formidable = require('formidable');

var avsAPIEndPoint = "https://avs-alexa-na.amazon.com";
var avsAPIHostName = "avs-alexa-na.amazon.com";

var avsAPIEventsEndpoint = "/v20160207/events";
var avsAPIDirectivesEndpoint = "/v20160207/directives";


var mutlipartBoundary = "boundary"
var boundaryDelimiter = "--" + mutlipartBoundary + "\r\n";
var endBoundaryDelimiter = "--" + mutlipartBoundary + "--" + "\r\n";

function avsSendSpeechRecognizerRecognizeEvent() {
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

    var multipart2AudioBuffer = fs.readFileSync('/home/jao/wavs/weather.wav');
    //var multipart2AudioBuffer = fs.readFileSync('/home/jao/wavs/test-small.bin');

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
        port: 443,
        path: avsAPIEventsEndpoint,
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + tokenObj.access_token,
            "Content-type": "multipart/form-data; boundary="+mutlipartBoundary
        }
    };

    console.log("avsSendSpeechRecognizerRecognizeEvent options");
    console.log(options);

    var req = http2.request(options, function(res) {

        console.log("res.statusCode");
        console.log(res.statusCode);

        console.log("res.headers");
        console.log(res.headers);

        var writeStream = fs.createWriteStream('/home/jao/wavs/response');
        res.pipe(writeStream);

        res.on('data', function(chunk) {
            console.log("on data");
            console.log(chunk);
            //var textChunk = chunk.toString('utf8');
            //console.log(textChunk);

        });

        res.on('end', function() {
            console.log('No more data in response.')
        });


        /*
        var form = new formidable.IncomingForm();
        form.encoding = 'binary';
        form.parse(res, function(err, fields, files) {
            console.log("err");
            console.log(err);

            console.log("fields");
            console.log(fields);

            console.log("files");
            console.log(files);
        });
*/

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

function avsSendSynchronizeStateEvent() {

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
        port: 443,
        path: avsAPIEventsEndpoint,
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + tokenObj.access_token,
            "Content-type": "multipart/form-data; boundary="+mutlipartBoundary
        }
    };

    console.log("avsSendSynchronizeStateEvent options");
    console.log(options);

    var req = http2.request(options, function(res) {

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

function avsPing() {

    var options = {
        hostname: avsAPIHostName,
        port: 443,
        path: '/ping',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + tokenObj.access_token
        }
    };

    console.log("avsPing options");
    console.log(options);

    var req = http2.request(options, function(res) {

        if(res.statusCode === 204) {
            console.log("avsPing succeeded.");
        }

        res.on('data', function(chunk) {
            console.log(chunk);
        });

        res.on('end', function() {
            console.log('No more data in response.')
        });

    });

    req.on('error', (e) => {
        console.log(e);
        //console.log(`problem with request: ${e.message}`);
    });

    req.end();

}

function avsCreateDownChannelStream() {

    var options = {
        hostname: avsAPIHostName,
        port: 443,
        path: avsAPIDirectivesEndpoint,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + tokenObj.access_token
        }
    };

    console.log("avsCreateDownChannelStream options");
    console.log(options);

    var req = http2.request(options, function(res) {

        if(res.statusCode === 204) {
            console.log("avsPing succeeded.");
        }

        res.on('data', function(chunk) {
            console.log(chunk);
        });

        res.on('end', function() {
            console.log('No more data in response.')
        });

    });

    req.on('error', (e) => {
        console.log(e);
        //console.log(`problem with request: ${e.message}`);
    });

    req.end();

}
