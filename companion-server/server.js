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
