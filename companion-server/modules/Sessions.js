
// Each session (per client) is valid for 14 days
// When a session is valid, tokens are automatically refreshed

//var _ = require("underscore");

var request = require('request');

module.exports = function(options) {

    //var CONSTANT_1_DAY_IN_MILISEC = 24*60*60*1000;
    //var CONSTANT_1_MIN_IN_MILISEC = 5*60*1000;

    var CONSTANT_1_DAY_IN_MILISEC = 24*60*60*1000;
    var CONSTANT_1_MIN_IN_MILISEC = 100*5*60*1000;

    var clientId = options.clientId;
    var clientSecret = options.clientSecret;

    var Sessions = function() {

        this.sessions = {};

        this.addSession = function(sessionId, tokens) {

            var tokens = tokens;
            tokens["expires_at"] = Date.now() + 3000*1000;

            this.sessions[sessionId] = {
                createdAt: Date.now(),
                tokens: tokens
            };
        };

        // Currently the same implementation as "addSession"
        this.updateSession = function(error, data) {

            if(error) {
                this.deleteSession(error.sessionId);
                return;
            }

            this.addSession(data.sessionId, data.tokens);

        };

        this.deleteSession = function(sessionId) {
            delete this.sessions[sessionId];
        };

        this.getSession = function(sessionId) {
            return this.sessions[sessionId];
        }

        // This is an ugly implemention of refreshing tokens
        // Could fight for CPU with AVS process
        // Should use database and dedicate service for this
        this.checkSessions = function() {

            var that = this;

            console.log("that.sessions");
            console.log(that.sessions);

            var refreshCallback = function(error, data) {

                if(error) {
                    that.deleteSession(error.sessionId);
                    return;
                }

                that.addSession(data.sessionId, data.tokens);

            };

            for (var sessionId in this.sessions) {

                console.log("sessionId");
                console.log(sessionId);

                var session = this.sessions[sessionId];

                // If session is older than 14 days, remove the session
                if(Math.floor((Date.now() - session.createdAt) / CONSTANT_1_DAY_IN_MILISEC) > 14) {

                    console.log("Session is older than 14 days, remove the session");

                    this.deleteSession(sessionId);
                    break;
                }

                // If token will expire within 5 min, refresh the token
                if(Math.floor((Date.now() - session.tokens["expires_at"]) / CONSTANT_1_MIN_IN_MILISEC) < 5) {

                    console.log("Token will expire within 5 min, refresh the token");

                    var refreshToken = session.tokens["refresh_token"];

                    this.refreshTokens(refreshToken, clientId, clientSecret, sessionId, refreshCallback);
                }

            }


            // Run checkloop every 15 mins
            //setTimeout(this.startloop, 15*60*1000);
            //setTimeout(that.startloop(that), 30*1000);

        }; // checkloop ()

        this.refreshTokens = function(refreshToken, clientId, clientSecret, sessionId, callback) {

            console.log("refreshTokens");

            var formObj = {
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret
            };

            request.post({
                url:'https://api.amazon.com/auth/o2/token',
                form: formObj}, function(error,httpResponse,body) {
                    if(error) {

                        console.log("error");
                        console.log(error);

                        callback({
                            sessionId: sessionId,
                            error: error
                        });
                        return;
                    }

                    console.log("body");
                    console.log(body);

                    callback(null, {
                        sessionId: sessionId,
                        tokens: JSON.parse(body)
                    });
                });

        }; // refreshTokens()



    }

    return new Sessions();

}