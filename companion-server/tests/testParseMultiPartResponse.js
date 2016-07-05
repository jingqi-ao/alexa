
var fs = require('fs');

var responseBuffer = fs.readFileSync('/home/jao/wavs/response');

function getPartIndices(buffer, boundary) {

    var bufferLength = buffer.length;

    var delimiter = "--" + boundary;
    var delimiterBuffer = Buffer.from(delimiter); // Assume the delimiter string is 'utf-8' encoded

    console.log(bufferLength);

    var bufferIdx = 0;
    var delimiterBufferIdx = 0;

    // StartIdx of each delimiter
    var delimiters = [];

    // startIdx and endIdx of each part
    var parts = [];

    // Brutal force search. Need optimization
    while(bufferIdx < bufferLength) {

        // Mismatch happens, restart the matching from the beginning of delimiterBuffer
        if(buffer[bufferIdx] != delimiterBuffer[delimiterBufferIdx]) {
            bufferIdx++;
            delimiterBufferIdx = 0;
            continue;
        }

        // Found a full match
        if(delimiterBufferIdx === (delimiterBuffer.length - 1)) {

            console.log("obtainParts(): delimiter found");

            delimiters.push(bufferIdx - delimiterBuffer.length + 1);

            delimiterBufferIdx = 0;

        } else {

            //console.log("obtainParts(): matching");
            delimiterBufferIdx++;

        }

        bufferIdx++;
    }

    console.log("delimiters");
    console.log(delimiters);

    var delimiterIdx = 0;
    var onePart = null;

    var partStartIdx = 0;
    var partEndIdx = 0; // Inclusive

    // Process the first (delimiters.length - 1) delimiters. The final delimiter is the closing delimiter
    for(delimiterIdx = 0; delimiterIdx < (delimiters.length - 1); delimiterIdx++) {

        partStartIdx = delimiters[delimiterIdx] + delimiterBuffer.length + 2; // Newline (ASCII: 13,10) after the delimiter
        partEndIdx = delimiters[delimiterIdx + 1] - 2; // Newline (ASCII: 13,10) before the next delimiter

        parts.push({
            partStartIdx: partStartIdx,
            partEndIdx: partEndIdx
        });

    }

    return parts;
}

// TEST ONLY
var boundary = "62412f65-17ec-419f-b9ad-b36c3f6ac713";
var parts = getPartIndices(responseBuffer, boundary);


var testBuf = null;
var testString = null;
var part = parts[0];
testBuf = Buffer.alloc(part.partEndIdx - part.partStartIdx + 1, 0, 'binary');
responseBuffer.copy(testBuf, 0, part.partStartIdx, part.partEndIdx + 1);
testString = testBuf.toString();
console.log("testString");
console.log(testString);

// TEST ONLY (END)

function getPartHeadAndBodyIndices(buffer, partInfo) {

    console.log("partInfo");
    console.log(partInfo)

    // Get part buffer
    //var partBuffer = Buffer.alloc(partInfo.partEndIdx - partInfo.partStartIdx + 1, 0, 'binary');
    //buffer.copy(partBuffer, 0, partInfo.partStartIdx, partInfo.partEndIdx + 1);

    var partBufferStartIdx = partInfo.partStartIdx;
    var partBufferEndIdx = partInfo.partEndIdx;

    var partBuffer = buffer;
    // The first newline-newline is the separator between part header and part body
    // For example: 
    // PART_HEADER
    // Content-ID: <WeatherPrompt.f256e3af-8159-4c7e-b8d9-0f47939ec9d4_1246228641>
    // Content-Type: application/octet-stream (Newline)
    // (Newline)
    // PART_BODY

    var partHeaderBuffer = null;
    var partBodyBuffer = null;

    // Newline: (ASCII: 13,10)
    var partBufferIdx = 0;
    var startIdx = 0;
    var endIdx = 0;

    var partIndices = {
        partHeaderBuffer: {
            startIdx: null,
            endIdx: null
        },
        partBodyBuffer: {
            startIdx: null,
            endIdx: null
        }
    };

    for(partBufferIdx = 0; partBufferIdx < (partBuffer.length-3); partBufferIdx++) {

            console.log("loop partBufferIdx");
            console.log(partBufferIdx);

        if(partBuffer[partBufferStartIdx + partBufferIdx]===13 && partBuffer[partBufferStartIdx + partBufferIdx+1]===10 && 
            partBuffer[partBufferStartIdx + partBufferIdx+2]===13 && partBuffer[partBufferStartIdx + partBufferIdx+3]===10) {

            // Found the separator, assume the header length is not 0

            console.log("partBufferIdx");
            console.log(partBufferIdx);

            // Copy the part head to an individual buffer
            endIdx = partBufferIdx - 1;

            console.log(startIdx);
            console.log(endIdx);

            //partHeaderBuffer = Buffer.alloc(tailIdx - headIdx + 1, 0, 'binary');
            //partBuffer.copy(partHeaderBuffer, 0, headIdx, tailIdx + 1);
            partIndices.partHeaderBuffer.startIdx = startIdx;
            partIndices.partHeaderBuffer.endIdx = endIdx;

            // Copy the part body to an individual buffer
            startIdx = partBufferIdx + 4;
            endIdx = partBuffer.length - 1;

            console.log(startIdx);
            console.log(endIdx);

            partIndices.partBodyBuffer.startIdx = startIdx;
            partIndices.partBodyBuffer.endIdx = endIdx;

            //partBodyBuffer = Buffer.alloc(tailIdx - headIdx + 1, 0, 'binary');
            //partBuffer.copy(partBodyBuffer, 0, headIdx, tailIdx + 1);

            break;
        }

    }

    return partIndices;

}

// TEST ONLY

var partIdx = 0;
var partBuffers = null;

    //partBuffers = getPartHeadAndBodyIndices(responseBuffer, parts[partIdx]);

    /*
    testString = partBuffers.partHeaderBuffer.toString();
    console.log("testString");
    console.log(testString);

    testString = partBuffers.partBodyBuffer.toString();
    console.log("testString");
    console.log(testString);*/


// TEST ONLY (END)


function getPartHeadAndBodyBuffer(buffer, partInfo) {

    console.log("partInfo");
    console.log(partInfo)

    // Get part buffer
    var partBuffer = Buffer.alloc(partInfo.partEndIdx - partInfo.partStartIdx + 1, 0, 'binary');
    buffer.copy(partBuffer, 0, partInfo.partStartIdx, partInfo.partEndIdx + 1);

    // The first newline-newline is the separator between part header and part body
    // For example: 
    // PART_HEADER
    // Content-ID: <WeatherPrompt.f256e3af-8159-4c7e-b8d9-0f47939ec9d4_1246228641>
    // Content-Type: application/octet-stream (Newline)
    // (Newline)
    // PART_BODY

    var partHeaderBuffer = null;
    var partBodyBuffer = null;

    // Newline: (ASCII: 13,10)
    var partBufferIdx = 0;
    var headIdx = 0;
    var tailIdx = 0;
    for(partBufferIdx = 0; partBufferIdx < (partBuffer.length-3); partBufferIdx++) {

        if(partBuffer[partBufferIdx]===13 && partBuffer[partBufferIdx+1]===10 && 
            partBuffer[partBufferIdx+2]===13 && partBuffer[partBufferIdx+3]===10) {

            // Found the separator, assume the header length is not 0

            console.log("partBufferIdx");
            console.log(partBufferIdx);

            // Copy the part head to an individual buffer
            tailIdx = partBufferIdx - 1;

            console.log(headIdx);
            console.log(tailIdx);

            partHeaderBuffer = Buffer.alloc(tailIdx - headIdx + 1, 0, 'binary');
            partBuffer.copy(partHeaderBuffer, 0, headIdx, tailIdx + 1);



            // Copy the part body to an individual buffer
            headIdx = partBufferIdx + 4;
            tailIdx = partBuffer.length - 1;

            console.log(headIdx);
            console.log(tailIdx);

            partBodyBuffer = Buffer.alloc(tailIdx - headIdx + 1, 0, 'binary');
            partBuffer.copy(partBodyBuffer, 0, headIdx, tailIdx + 1);

            break;
        }

    }

    return {
        partHeaderBuffer: partHeaderBuffer,
        partBodyBuffer: partBodyBuffer
    };

}


// TEST ONLY

var partIdx = 0;
var partBuffers = null;

    partBuffers = getPartHeadAndBodyBuffer(responseBuffer, parts[partIdx]);

    testString = partBuffers.partHeaderBuffer.toString();
    console.log("testString");
    console.log(testString);

    testString = partBuffers.partBodyBuffer.toString();
    console.log("testString");
    console.log(testString);



// TEST ONLY (END)

// TEST ONLY

    partIdx = 1;

    partBuffers = getPartHeadAndBodyBuffer(responseBuffer, parts[partIdx]);

    testString = partBuffers.partHeaderBuffer.toString();
    console.log("testString");
    console.log(testString);

    testString = partBuffers.partBodyBuffer.toString();
    console.log("testString");
    //console.log(testString);

    fs.writeFileSync('/home/jao/wavs/test2.wav', partBuffers.partBodyBuffer, 'binary');

// TEST ONLY (END)