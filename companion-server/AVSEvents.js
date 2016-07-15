var uuid = require('node-uuid');

module.exports = function AVSEvents() {

    return {

        // The current context is fixed.
        generateContextJSON: function(){

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

        }, // generateContextJSON()

        generateEventJSON: function(eventType) {

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

        }, // generateEventJSON()

        sendEventToAVS: function(eventParam, accessToken, callback) {

            var eventType = eventParam.eventType;
            var audioBuffer = eventParam.audioBuffer;

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
                    bodyBuffer: audioBuffer
                }
            };

            avsHttp2.sendHttp2RequestToAVSv2(multiparts, accessToken, function(error, data) {
                if(error) {
                    console.log("Error: avsHttp2.sendHttp2RequestToAVS " + error);
                    callback(error);
                    return;
                }
                callback(null, data);
            });

        } // sendEventToAVS()

    }

}
