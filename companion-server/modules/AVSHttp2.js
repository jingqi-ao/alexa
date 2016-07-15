
var http2 = require('http2');

// TEST ONLY
var fs = require('fs');
// TEST ONLY (END)

var AVSResponseParser = require("./AVSResponseParser.js");
var avsResponseParser = AVSResponseParser();

module.exports = function() {

    var mutlipartBoundary = "boundary";

    var avsAPIHostName = "avs-alexa-na.amazon.com";

    var avsAPIEventsEndpoint = "/v20160207/events";

    var avsAPIDirectivesEndpoint = "/v20160207/directives";

    return {

        // Data strcuture
        // multiparts: {
        //     jsonPart: {
        //         body: JSON_OBJECT
        //     },
        //     audioPart: {
        //         bodyBuffer: NODE_BUFFER
        //     }
        // }
        //
        // avsAPItokens: {
        //     accessToken: STRING
        // }
        // config: {
        //     avsAPItokens: {
        //         accessToken: STRING
        //     },
        //     response: {
        //         storage: {
        //             localFullPath: STRING
        //         }
        //     }
        // }

        // callback return object
        // {
        //     directive: null,
        //     audioBuffer: partBuffers.partBodyBuffer
        // }

        sendHttp2RequestToAVSv2: function(multiparts, accessToken, callback) {

            var boundaryDelimiter = "--" + mutlipartBoundary + "\r\n";
            var endBoundaryDelimiter = "--" + mutlipartBoundary + "--" + "\r\n";

            // Part1 (JSON)
            var jsonPartHeadString = boundaryDelimiter +
                'Content-Disposition: form-data; name="metadata"' + '\r\n' + 
                'Content-Type: application/json; charset=UTF-8' + '\r\n' + 
                '\r\n';

            var jsonPartBodyString = JSON.stringify(multiparts.jsonPart.body) + '\r\n';

            var jsonPartBuffer = Buffer.from(jsonPartHeadString + jsonPartBodyString);

            // Part2 (Audio)
            var audioPartHeadString = boundaryDelimiter +
                'Content-Disposition: form-data; name="audio"' + '\r\n' + 
                'Content-Type: application/octet-stream' + '\r\n' + 
                '\r\n';
            var audioPartHeadBuffer = Buffer.from(audioPartHeadString);
            var audioPartBodyBuffer = multiparts.audioPart.bodyBuffer;

            // End delimiter
            var endDelimiterString = '\r\n' + endBoundaryDelimiter;
            var endDelimiterBuffer = Buffer.from(endDelimiterString);

            // Concatenate all buffer together to form bodyBuffer
            var reqBodyBuffer = Buffer.concat([jsonPartBuffer, audioPartHeadBuffer, audioPartBodyBuffer, endDelimiterBuffer], 
                jsonPartBuffer.length + audioPartHeadBuffer.length + audioPartBodyBuffer.length + endDelimiterBuffer.length);

            // Send request
            var reqOptions = {
                hostname: avsAPIHostName,
                port: 443,
                path: avsAPIEventsEndpoint,
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    "Content-type": "multipart/form-data; boundary="+mutlipartBoundary
                }
            };

            var resBuffers = [];

            var req = http2.request(reqOptions, function(res) {

                console.log("res.statusCode");
                console.log(res.statusCode);

                console.log("res.headers");
                console.log(typeof res.headers);
                console.log(res.headers);

                //var writeStream = fs.createWriteStream('/home/jao/wavs/response2');
                //res.pipe(writeStream);

                res.on('data', function(chunk) {
                    console.log("on data");
                    //console.log(chunk);
                    //var textChunk = chunk.toString('utf8');
                    //console.log(textChunk);

                    resBuffers.push(chunk);

                });

                res.on('end', function() {
                    console.log('No more data in response.');

                    // Find the boundary string from headers
                    var boundary = avsResponseParser.getBoundaryFromHeader(res.headers);

                    console.log("boundary");
                    console.log(boundary);

                    // Concatenate all chunk buffers
                    var responseBodyBuffer = Buffer.concat(resBuffers);

                    // Find each part's index
                    var partIndices = avsResponseParser.getPartIndices(responseBodyBuffer, boundary);

                    console.log("partIndices");
                    console.log(partIndices);


                    // Get JSON part buffer
                    partBuffers = avsResponseParser.getPartHeadAndBodyBuffer(responseBodyBuffer, partIndices[0]);

                    var testString = partBuffers.partHeaderBuffer.toString();
                    console.log("testString");
                    console.log(testString);

                    testString = partBuffers.partBodyBuffer.toString();
                    console.log("testString");
                    console.log(testString);

                    // Get audio part buffer (if it exists)
                    if(partIndices.length > 1) {

                        partBuffers = avsResponseParser.getPartHeadAndBodyBuffer(responseBodyBuffer, partIndices[1]);

                        testString = partBuffers.partHeaderBuffer.toString();
                        console.log("testString");
                        console.log(testString);

                        testString = partBuffers.partBodyBuffer.toString();
                        console.log("testString");
                        //console.log(testString);

                        // TEST ONLY
                        fs.writeFileSync('/tmp/avsResponseTest.wav', partBuffers.partBodyBuffer, 'binary');
                        // TEST ONLY (END)

                        callback(null, {
                            directive: null,
                            audioBuffer: partBuffers.partBodyBuffer
                        });
                    }

                });

            });

            req.on('error', (e) => {
                console.log(e);
                //console.log(`problem with request: ${e.message}`);
            });

            req.write(reqBodyBuffer);

            req.end();

        }, // sendHttp2RequestToAVSv2()

        sendHttp2RequestToAVS: function(multiparts, config, callback) {

            var boundaryDelimiter = "--" + mutlipartBoundary + "\r\n";
            var endBoundaryDelimiter = "--" + mutlipartBoundary + "--" + "\r\n";

            // Part1 (JSON)
            var jsonPartHeadString = boundaryDelimiter +
                'Content-Disposition: form-data; name="metadata"' + '\r\n' + 
                'Content-Type: application/json; charset=UTF-8' + '\r\n' + 
                '\r\n';

            var jsonPartBodyString = JSON.stringify(multiparts.jsonPart.body) + '\r\n';

            var jsonPartBuffer = Buffer.from(jsonPartHeadString + jsonPartBodyString);

            // Part2 (Audio)
            var audioPartHeadString = boundaryDelimiter +
                'Content-Disposition: form-data; name="audio"' + '\r\n' + 
                'Content-Type: application/octet-stream' + '\r\n' + 
                '\r\n';
            var audioPartHeadBuffer = Buffer.from(audioPartHeadString);
            var audioPartBodyBuffer = multiparts.audioPart.bodyBuffer;

            // End delimiter
            var endDelimiterString = '\r\n' + endBoundaryDelimiter;
            var endDelimiterBuffer = Buffer.from(endDelimiterString);

            // Concatenate all buffer together to form bodyBuffer
            var reqBodyBuffer = Buffer.concat([jsonPartBuffer, audioPartHeadBuffer, audioPartBodyBuffer, endDelimiterBuffer], 
                jsonPartBuffer.length + audioPartHeadBuffer.length + audioPartBodyBuffer.length + endDelimiterBuffer.length);

            // Send request
            var accessToken = config.avsAPItokens.accessToken;
            var reqOptions = {
                hostname: avsAPIHostName,
                port: 443,
                path: avsAPIEventsEndpoint,
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    "Content-type": "multipart/form-data; boundary="+mutlipartBoundary
                }
            };

            var resBuffers = [];

            var req = http2.request(reqOptions, function(res) {

                console.log("res.statusCode");
                console.log(res.statusCode);

                console.log("res.headers");
                console.log(typeof res.headers);
                console.log(res.headers);

                //var writeStream = fs.createWriteStream('/home/jao/wavs/response2');
                //res.pipe(writeStream);

                res.on('data', function(chunk) {
                    console.log("on data");
                    //console.log(chunk);
                    //var textChunk = chunk.toString('utf8');
                    //console.log(textChunk);

                    resBuffers.push(chunk);

                });

                res.on('end', function() {
                    console.log('No more data in response.');

                    // Find the boundary string from headers
                    var boundary = avsResponseParser.getBoundaryFromHeader(res.headers);

                    console.log("boundary");
                    console.log(boundary);

                    // Concatenate all chunk buffers
                    var responseBodyBuffer = Buffer.concat(resBuffers);

                    // Find each part's index
                    var partIndices = avsResponseParser.getPartIndices(responseBodyBuffer, boundary);

                    console.log("partIndices");
                    console.log(partIndices);


                    // Get JSON part buffer
                    partBuffers = avsResponseParser.getPartHeadAndBodyBuffer(responseBodyBuffer, partIndices[0]);

                    var testString = partBuffers.partHeaderBuffer.toString();
                    console.log("testString");
                    console.log(testString);

                    testString = partBuffers.partBodyBuffer.toString();
                    console.log("testString");
                    console.log(testString);

                    // Get audio part buffer (if it exists)
                    if(partIndices.length > 1) {

                        partBuffers = avsResponseParser.getPartHeadAndBodyBuffer(responseBodyBuffer, partIndices[1]);

                        testString = partBuffers.partHeaderBuffer.toString();
                        console.log("testString");
                        console.log(testString);

                        testString = partBuffers.partBodyBuffer.toString();
                        console.log("testString");
                        //console.log(testString);

                        var localFullPath = config.response.storage.localFullPath;

                        if(localFullPath) {
                            fs.writeFileSync(localFullPath, partBuffers.partBodyBuffer, 'binary');
                        }

                        callback(null, {
                            directive: null,
                            audioBuffer: partBuffers.partBodyBuffer
                        });
                    }

                });

            });

            req.on('error', (e) => {
                console.log(e);
                //console.log(`problem with request: ${e.message}`);
            });

            //console.log("reqBodyBuffer");
            //console.log(reqBodyBuffer.toString());

            req.write(reqBodyBuffer);

            req.end();

        }, // sendHttp2RequestToAVS()

        parseResponseFromAVS: function(responseBuffer) {

        }, // parseResponseFromAVS()

        establishDownChannelStream: function(config, callback) {

            var accessToken = config.avsAPItokens.accessToken;

            var options = {
                hostname: avsAPIHostName,
                port: 443,
                path: avsAPIDirectivesEndpoint,
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + accessToken
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

            req.on('socket', (socket) => {
                console.log("establishDownChannelStream socket");
                console.log(socket);
                //console.log(`problem with request: ${e.message}`);
            });

            req.on('error', (e) => {
                console.log(e);
                //console.log(`problem with request: ${e.message}`);
            });

            req.end();


        }



    }


}