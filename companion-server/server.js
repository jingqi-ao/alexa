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
    console.log("client connected ...");
    res.send('Hello World!');
});

// Handle client upload
var formidable = require('formidable');

var Transcoder = require("./Transcoder.js");
var transcoder = Transcoder();

app.post('/events', function(req, res) {

    console.log(req.get('Content-Type'));

    var form = new formidable.IncomingForm();
    form.encoding = 'binary';
    form.uploadDir = "/tmp";

    form.parse(req, function(err, fields, files) {

        console.log("err");
        console.log(err);

        console.log("fields");
        console.log(fields);

        console.log("files");
        console.log(files);

        // For some reason, this event never got triggerred
        form.on('file', function(field, file) {
            //rename the incoming file to the file's name
            //fs.rename(file.path, form.uploadDir + "/" + "clientAudio.3pg");

            console.log('HERE');

            var threeGPPFileFullPath = file.path;
            var wavFileFullPath = file.path + '.wav';

            // Transcaode .3gpp file to .wav file
            transcoder.threeGPPtoWav(threeGPPFileFullPath, wavFileFullPath);

            // Read .wav file into buffer
            var wavFileBuffer = fs.readFileSync(wavFileFullPath);

            console.log('HERE');

            // Send AVS speech recognition event

            var eventParam = {
                audioBuffer: wavFileBuffer
            };

            //avsSendSpeechRecognizerRecognizeEvent(eventParam);

            //res.send('POST /events');

        });

        console.log('HERE');

        var file = files.audio;

        console.log(typeof file);

        var threeGPPFileFullPath = file.path;
        var wavFileFullPath = file.path + '.wav';

        // Transcaode .3gpp file to .wav file
        transcoder.threeGPPtoWav(threeGPPFileFullPath, wavFileFullPath);

        // Read .wav file into buffer
        var wavFileBuffer = fs.readFileSync(wavFileFullPath);

        console.log('HERE');

        // Send AVS speech recognition event
        var eventParam = {
            audioBuffer: wavFileBuffer
        };

        //avsSendSpeechRecognizerRecognizeEvent(eventParam);

        var config = {
            response: {
                storage: {
                    localFullPath: file.path + 'response.wav'
                }
            }
        }

        avsSendSpeechRecognizerRecognizeEvent(eventParam, config, function(error, data) {
            res.status(200).send(data.audioBuffer);
        });

        //res.send('POST /events');

    });

})


// Load avs.json
avsConfig = require('./avs.json');

var clientId = avsConfig.clientId;
var clientSecret = avsConfig.clientSecret;


var RouterAmazonAuth = require('./modules/RouterAmazonAuth.js');


var Sessions = require('./modules/Sessions.js');
var sessions = Sessions({
    clientId: avsConfig.clientId,
    clientSecret: avsConfig.clientSecret
});

setInterval(function(){
    sessions.checkSessions();
}, 10*1000);

var routerAmazonAuth = RouterAmazonAuth({
    amazonAuthRedirectURL: "https://localhost:8443/auth/amazonauthredirect",
    clientId: clientId,
    clientSecret: clientSecret,
    obtainTokenCallback: function(error, data) {
        if(error) {
            console.log("error");
            console.log(error);
            return;
        }
        console.log("data");
        console.log(data);

        sessions.addSession(data.sessionId, data.tokens);

    }
});

app.use('/auth', routerAmazonAuth);

/*
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
app.get('/auth/amazonauthorize', function (req, res) {

    console.log("json");
    var scopeDataJSONString = JSON.stringify(scopeData);
    var scopeDataJSONStringEscaped = querystring.escape(scopeDataJSONString);

    console.log("scopeDataJSONString");
    console.log(scopeDataJSONString);

    console.log("scopeDataJSONStringEscaped");
    console.log(scopeDataJSONStringEscaped);

    console.log("req.query.sessionId");
    console.log(req.query.sessionId);

    var queryObj = {
        client_id: clientId,
        scope: scope,
        scope_data: scopeDataJSONStringEscaped,
        response_type: responseType,
        redirect_uri: redirectURL
    };

    console.log("queryObj");
    console.log(queryObj);

    // To do: use "state=SESSION_ID" to track user (Android client) with accessToken
    var queryString = "client_id=" + clientId + "&" +
        "scope=" + querystring.escape(scope) + "&" +
        "scope_data=" + querystring.escape(JSON.stringify(scopeData)) + "&" +
        "response_type=" + responseType + "&" +
        "redirect_uri=" + querystring.escape(redirectURL) + "&" +
        "state=abcdefg";

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
    var state = req.query.state;

    console.log("state");
    console.log(state);

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
*/

// Get user profile
// Need extra scope (scope other than alexa:all)
/*
function getUserProfile(accessToken, callback) {

    request.get({
        url:'https://api.amazon.com/user/profile',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    }, callback);

}
*/

// AVS
function testFunc() {

    getUserProfile(tokenObj.access_token, function(error,httpResponse,body) {
        if(error) {
            console.log("GetUserProfile error" + error);
            return;
        }
        console.log("GetUserProfile");
        console.log(body);
    });

    //setTimeout(avsCreateDownChannelStream, 5000)
    //avsCreateDownChannelStream();

    //setTimeout(avsSendSynchronizeStateEvent, 10000);

    //setTimeout(avsSendSpeechRecognizerRecognizeEvent, 20000);
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

var AVSEvents = require("./AVSEvents.js");
var avsEvents = AVSEvents();

var AVSHttp2 = require("./AVSHttp2.js");
var avsHttp2 = AVSHttp2();

// TEST ONLY
//var multipart2AudioBuffer = fs.readFileSync('/home/jao/wavs/weather.wav');
var multipart2AudioBuffer = fs.readFileSync('/home/jao/wavs/audiorecordtest3gp.wav');
// TEST ONLY (END)

function avsSendSpeechRecognizerRecognizeEvent(eventParam, config, callback) {

    var ctx = avsEvents.generateContextJSON();
    var evt = avsEvents.generateEventJSON("SpeechRecognizer.Recognize");

    var multiparts = {
        jsonPart: {
            body: {
                "context": ctx,
                "event": evt
            }
        },
        audioPart: {
            bodyBuffer: eventParam.audioBuffer
        }
    };

    var avsAPItokens = {
        accessToken: tokenObj.access_token
    };

    console.log("avsSendSpeechRecognizerRecognizeEvent");

    var config = {
        avsAPItokens: avsAPItokens,
        response: {
            storage: {
                localFullPath: config.response.storage.localFullPath
            }
        }
    };

    avsHttp2.sendHttp2RequestToAVS(multiparts, config, function(error, data) {
        if(error) {
            console.log("Error: avsHttp2.sendHttp2RequestToAVS " + error);
            return;
        }
        callback(null, data);
    });

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
