
module.exports = function() {

    return {

        getPartIndices: function(buffer, boundary) {

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
        }, // getPartIndices()

        getPartHeadAndBodyBuffer: function(buffer, partInfo) {

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

        }, // getPartHeadAndBodyBuffer()


        getBoundaryFromHeader: function(headerObj) {

            var contentType = headerObj["content-type"];

            console.log("contentType");
            console.log(contentType);

            if(!contentType.startsWith("multipart")) {
                return null;
            }

            var startIdx = contentType.indexOf("boundary=") + 9;

            var semiColonPos = contentType.indexOf(";", startIdx);

            var boundary = null;
            if(semiColonPos == -1) {
                // No semicolon, meaning "boundary=" is the last element
                boundary = contentType.substring(startIdx);
            } else {
                // There are other elements after the "boundary=", e.g.
                //'content-type': 'multipart/related;boundary=1aec552c-6d03-4a87-bc77-418921aab301;start=metadata.1467748734097;type="application/json"'
                boundary = contentType.substring(startIdx, semiColonPos);
            }

            return boundary;
        }

    } // return 

}