var uuid = require('node-uuid');

var AVSHttp2 = require('./AVSHttp2.js');
var avsHttp2 = AVSHttp2();

module.exports = function AVSEvents() {

    var AVSEvents = function() {

        // The current context is fixed.
        this.generateContextJSON = function(){

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

            return ctx;

        }; // generateContextJSON()

        this.generateEventJSON = function(eventType) {

            if(eventType === "SpeechRecognizer.Recognize") {
                return {
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
            }

            if(eventType === "System.SynchronizeState") {
                return {
                    "header": {
                        "namespace": "System",
                        "name": "SynchronizeState",
                        "messageId": uuid.v1()
                    },
                    "payload": {
                    }
                }
            }

        }; // generateEventJSON()

        this.sendEventToAVS = function(eventParam, accessToken, callback) {

            var that = this;

            var eventType = eventParam.eventType;
            var audioBuffer = eventParam.audioBuffer;

            var ctx = that.generateContextJSON();
            var evt = that.generateEventJSON("SpeechRecognizer.Recognize");

            console.log('AVSEvents.sendEventToAVS ctx');
            console.log(ctx);

            console.log('AVSEvents.sendEventToAVS evt');
            console.log(evt);

            console.log('AVSEvents.sendEventToAVS audioBuffer.length');
            console.log(audioBuffer.length);

            console.log('AVSEvents.sendEventToAVS accessToken');
            console.log(accessToken);

            var multiparts = {
                jsonPart: {
                    body: {
                        "context": ctx,
                        "event": evt
                    }
                },
                audioPart: {
                    bodyBuffer: audioBuffer
                }
            };

            avsHttp2.sendHttp2RequestToAVSv2(multiparts, accessToken, function(error, data) {
                if(error) {
                    console.log("Error: AVSEvents.sendEventToAVS failure: " + error);
                    callback(error);
                    return;
                }
                console.log('AVSEvents.sendEventToAVS avsHttp2 success');
                callback(null, data);
            });

        }; // sendEventToAVS()

    }

    return new AVSEvents();

}
