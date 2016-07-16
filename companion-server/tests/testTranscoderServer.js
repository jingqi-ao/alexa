
var https = require('https');
var request = require("request");

var fs = require('fs');


// Narrow-tailored ignore invalid SSL certificate
var agentOptions = {
    host: 'localhost',
    port: '8443',
    path: '/api/v1/transcode',
    rejectUnauthorized: false
};

var insecuredAgent = new https.Agent(agentOptions);

var formData = {
    audio: fs.createReadStream('/home/jao/wavs/userVoice.3gp')
}

/*
var requestOptions = {
    url: "https://192.168.1.185:9443/api/v1/transcode",
    formData: formData,
    method: 'POST',
    agent: insecuredAgent
};
*/

/*
var requestOptions = {
    url: "https://192.168.1.185:9443/api/v1/transcode",
    formData: formData,
    method: 'POST',
    rejectUnauthorized: false
};
*/

// AWS
var requestOptions = {
    url: "https://52.201.229.195:9443/api/v1/transcode",
    formData: formData,
    method: 'POST',
    rejectUnauthorized: false
};


request(requestOptions, function optionalCallback(err, httpResponse, body) {
    if (err) {
        console.error('upload failed:', err);
        return;
    }
    console.log('Server responded');

    console.log('body');
    //console.log(body);

    //var correctResult = fs.readFileSync('/tmp/alexa/onServer.wav', 'binary');

    //console.log(body.length);
    //console.log(correctResult.length);

    fs.writeFile('/tmp/alexa/avsResponseTest.wav', body, 'binary', function(error) {
        console.log("done");
        console.log(error);
    });
});
