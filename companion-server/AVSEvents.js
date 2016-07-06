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

        } // generateEventJSON()



    }

}
