# Transcoder server

Transcoder server is to transform .3gp (3GPP) format file from Android client to .wav format. It utilizes Ubuntu command line tool "avconv".

Transcoder server exposes its public interface as HTTPS server. HTTPS will protect the uploaded user voice resource (i.e. .3gp file).

## 3GPP file requirement
Please note that .3gp file should satisfy Alexa Voice Service requirement

- 16bit Linear PCM

- 16kHz sample rate

- Single channel

Reference: https://developer.amazon.com/public/solutions/alexa/alexa-voice-service/reference/speechrecognizer

Different client might need to configure the audio recording software differently to fulfill the requirement above. On Android, the following configuration meets the requirement.

```
        mMediaRecorder.setAudioEncodingBitRate(16);
        mMediaRecorder.setAudioSamplingRate(16000);
        mMediaRecorder.setAudioChannels(1);
```

## (Simplified) Workflow of transcoder server
(1) Receive .3gp file from the request body of "POST /api/v1/transcode"

(2) Transcoder .3gp file into .wav format

(3) Response the request in (1) with .wav binary


## Deploy
Pre-requisite: 

- node (e.g. v5.12.0) (https://nodejs.org/en/download/)

(1) Install avconv
```
$ sudo apt-get install avconv
```

(2) Copy the server folder to deployment target

(3) Install node dependencies

```
$ cd SERVER_FOLDER
$ npm install
```

(4) Run server
```
$ cd SERVER_FOLDER
$ node tra
```


