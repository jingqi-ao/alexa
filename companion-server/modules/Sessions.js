
// Each session (per client) is valid for 14 days
// When a session is valid, tokens are automatically refreshed

//var _ = require("underscore");

var request = require('request');

module.exports = function(options) {

    //var CONSTANT_1_DAY_IN_MILISEC = 24*60*60*1000;
    //var CONSTANT_1_MIN_IN_MILISEC = 5*60*1000;

    var CONSTANT_1_DAY_IN_MILISEC = 24*60*60*1000;
    var CONSTANT_1_MIN_IN_MILISEC = 100*5*60*1000;

    var CONSTANT_SESSION_TTL_IN_MILISEC = 14*24*60*60*1000; // 14 days
    CONSTANT_SESSION_TTL_IN_MILISEC = 30*60*1000; // 30 min, test only

    var CONSTANT_TOKEN_TTL_IN_MILISEC = 50*60*1000; // 50 min
    CONSTANT_TOKEN_TTL_IN_MILISEC = 10*60*1000; // 10 min, test only

    var clientId = options.clientId;
    var clientSecret = options.clientSecret;

    var avsInit = options.avsInit;

    var Sessions = function() {

        this.sessions = {};

        this.addSession = function(sessionId, tokens) {

            var tokens = tokens;
            tokens["expires_at"] = Date.now() + CONSTANT_TOKEN_TTL_IN_MILISEC;

            this.sessions[sessionId] = {
                createdAt: Date.now(),
                expiredAt: Date.now() + CONSTANT_SESSION_TTL_IN_MILISEC,
                tokens: tokens
            };
        };

        // Updating session only updates its tokens
        this.updateSession = function(sessionId, tokens) {

            // Update tokens
            var session = this.sessions[sessionId];

            console.log("Session.updateSession oldSession");
            console.log(session);

            var tokens = tokens;
            tokens["expires_at"] = Date.now() + CONSTANT_TOKEN_TTL_IN_MILISEC;

            if(session) {
                session.tokens = tokens;
            }

            console.log("Session.updateSession newSession");
            console.log(this.sessions[sessionId]);

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

                that.updateSession(data.sessionId, data.tokens);

            };

            for (var sessionId in this.sessions) {

                console.log("sessionId");
                console.log(sessionId);

                var session = this.sessions[sessionId];

                // If session TTL is reached, remove the session
                if(Date.now() > session.expiredAt) {

                    console.log("Session expired, remove the session");

                    this.deleteSession(sessionId);
                    break;
                }

                // If token will expire within 5 min, refresh the token
                if(Date.now() > session.tokens["expires_at"]) {

                    console.log("Token will expire. Refresh the token");

                    var refreshToken = session.tokens["refresh_token"];

                    this.refreshTokens(refreshToken, clientId, clientSecret, sessionId, refreshCallback);
                }

            }


            // Run checkloop every 15 mins
            //setTimeout(this.startloop, 15*60*1000);
            //setTimeout(that.startloop(that), 30*1000);

        }; // checkloop ()

        this.pingSessions = function() {

            console.log("Sessions.pingSessions start");

            for (var sessionId in this.sessions) {

                console.log("sessionId");
                console.log(sessionId);

                var session = this.sessions[sessionId];

                var accessToken = session.tokens["access_token"];

                avsInit.sendPingToAVS(accessToken, function(error, data) {
                    if(error) {
                        console.log("Sessions.pingSessions failed with sessionId: " + sessionId);
                        return;
                    }
                    console.log("Sessions.pingSessions succeeded with sessionId: " + sessionId);
                });

            }

        }; // pingSessions()

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

        // Get accessToken
        this.getTokens = function(sessionId) {

            var session = this.sessions[sessionId];

            console.log("Session.getAccessToken session");
            console.log(session);

            if(!session) {
                return null;
            }

            console.log("Session.getTokens session.tokens");
            console.log(session.tokens);

            return session.tokens;

        }; // getAccessToken


    }

    return new Sessions();

}