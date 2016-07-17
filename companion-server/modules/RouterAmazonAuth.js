
/**
* Router handling Login-with-Amazon (LWA) 
*/



var express = require('express');
var request = require("request");
var querystring = require('querystring');

module.exports = function(options)  {

    var scope="alexa:all";
    var productId = options.productId;

    /*
    var scopeData = {
        "alexa:all": {
            "productID": "alexa_android_client",
            "productInstanceAttributes": {
                "deviceSerialNumber": "bigboss"
            }
        }
    };
    */

    var scopeData = {
        "alexa:all": {
            "productID": productId,
            "productInstanceAttributes": {
                "deviceSerialNumber": "bigboss"
            }
        }
    };

    var responseType = "code";

    var amazonAPIOAURL = "https://www.amazon.com/ap/oa";

    var defaultAmazonAuthRedirectURL = "https://localhost:8443/auth/amazonauthredirect"
    var redirectURL = (options ? options.amazonAuthRedirectURL : null) ? options.amazonAuthRedirectURL : defaultAmazonAuthRedirectURL;

    // Get tokens
    var clientId = options.clientId;

    var clientSecret = options.clientSecret;

    function getTokens(code, clientId, clientSecret, redirectURI, callback) {

        console.log("getTokens");

        var formObj = {
            grant_type: "authorization_code",
            code: code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectURI
        };

        request.post({
            url:'https://api.amazon.com/auth/o2/token',
            form: formObj}, callback);
    }

    // Get token callback
    var obtainTokenCallback = options.obtainTokenCallback;


    var router = express.Router();

    router.get('/amazonauth', function(req, res) {

        console.log("/auth/amazonauth");

        console.log("req.query.sessionId");
        console.log(req.query.sessionId);

        var sessionId = req.query.sessionId ? req.query.sessionId : "sessionId";

        //scopeData["alexa:all"]["productInstanceAttributes"]["sessionId"] = req.query.sessionId ? req.query.sessionId : "sessionId";

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

        // To do: use "state=SESSION_ID" to track user (Android client) with accessToken
        var queryString = "client_id=" + clientId + "&" +
            "scope=" + querystring.escape(scope) + "&" +
            "scope_data=" + querystring.escape(JSON.stringify(scopeData)) + "&" +
            "response_type=" + responseType + "&" +
            "redirect_uri=" + querystring.escape(redirectURL) + "&" +
            "state=" + sessionId;

        console.log("queryObj");
        console.log(queryObj);

        //var queryString = querystring.stringify(queryObj);

        console.log("queryString");
        console.log(queryString);

        var loginWithAmazonURL = amazonAPIOAURL + "?" + queryString;

        console.log("loginWithAmazonURL");
        console.log(loginWithAmazonURL);

        res.redirect(loginWithAmazonURL);

    }); // router.get('/amazonauth', ...)

    router.get('/amazonauthredirect', function(req, res) {

        console.log("/amazonauthredirect");

        var code = req.query.code;
        var scope = req.query.scope;
        var state = req.query.state;

        var sessionId = req.query.state ? req.query.state : "sessionId";

        console.log("state");
        console.log(state);

        // code is returned
        if(code) {

            getTokens(code, clientId, clientSecret, redirectURL, function(error,httpResponse,body) {

                if(error) {

                    console.log(error);

                    if(obtainTokenCallback) {

                        obtainTokenCallback(
                            {
                                statusCode: 401,
                                error: error
                            },
                            null
                        );
                    }

                    res.status(401).end();
                    return;
                }

                console.log("body");
                console.log(typeof body);
                console.log(body);

                var tokenObj = JSON.parse(body);

                if(obtainTokenCallback) {
                    obtainTokenCallback(null, {
                        sessionId: sessionId,
                        tokens: tokenObj
                    });
                }

                res.send('Tokens obtained');
            });

            return;
        }

        res.status(500).send('/amazonauthredirect failed');

    }); // router.get('/amazonauthredirect', ...)

    return router;

}