
var fs = require('fs');

var multipart2AudioBuffer = fs.readFileSync('/home/jao/wavs/response');

console.log("multipart2AudioBuffer");
console.log(multipart2AudioBuffer)

SIZE = 100;

var subBuff = Buffer.alloc(SIZE, 0, 'binary');

var i = 0;
for(i = 0; i < SIZE; i++) {
    subBuff[i] = multipart2AudioBuffer[i];
}

console.log("subBuff");
console.log(subBuff);

var boundary = "62412f65-17ec-419f-b9ad-b36c3f6ac713";
var delimiter = "--" + boundary;
var endDelimiter = "--" + boundary + "--";

var delimiterBuffer =  Buffer.from(delimiter,'utf-8');
var endDelimiterBuffer = Buffer.from(endDelimiter,'utf-8');
//var delimiterBuffer =  Buffer.from("abababca",'utf-8');
//var delimiterBuffer =  Buffer.from("abab",'utf-8');

console.log("delimiterBuffer");
console.log(delimiterBuffer);

// Create prefix table
/*
var prefixTable = [];
var idx = 0;
for(idx = 0; idx < delimiterBuffer.length; idx++) {

    if(idx == 0) {
        prefixTable.push(0);
        continue;
    }

    console.log("idx");
    console.log(idx);

    // sub buffer is from 0 to idx
    var prefixHead = 0;
    var prefixTail = idx-1;

    var suffixHead = 1;
    var suffixTail = idx;

    // Continue to compare each same-size prefix and subfix buffer until a mis-match happens
    var prefixLength = 0;
    var isPrefixAndSuffixMatched = true;
    while(suffixHead <= idx) {

        var prefixBuf = Buffer.alloc(prefixTail - prefixHead + 1, 0, 'binary');
        delimiterBuffer.copy(prefixBuf, 0, prefixHead, prefixTail+1);

        var suffixBuf = Buffer.alloc(suffixTail - suffixHead + 1, 0, 'binary');
        delimiterBuffer.copy(suffixBuf, 0, suffixHead, suffixTail+1);

        console.log("prefixBuf");
        console.log(prefixBuf);

        console.log("suffixBuf");
        console.log(suffixBuf);

        if(prefixBuf.compare(suffixBuf) === 0) {
            console.log("prefixBuf.compare(suffixBuf) === 0");
            prefixLength = prefixTail - prefixHead + 1;
            break;
        }

        prefixTail = prefixTail - 1;
        suffixHead = suffixHead + 1;

    }

        console.log("final prefixLength");
        console.log(prefixLength);

    prefixTable.push(prefixLength);

}

console.log(prefixTable);
console.log(boundary.length);
console.log(prefixTable.length);
*/

//var delimiterBuffer =  Buffer.from(delimiter,'utf-8');
//var endDelimiterBuffer = Buffer.from(endDelimiter,'utf-8');

// Brutal force match
var bodyBuffer = multipart2AudioBuffer;
var bodyIdx = 0;
var bodyLength = bodyBuffer.length;


var parts = [];

var delimiterIdx = 0;

while(bodyIdx < bodyLength) {

    if(bodyBuffer[bodyIdx] != delimiterBuffer[delimiterIdx]) {
        bodyIdx++;
        delimiterIdx = 0;
        continue;
    }

    if(delimiterIdx==(delimiterBuffer.length-1)) {
        console.log("found!");
        parts.push(bodyIdx-delimiterBuffer.length+1);
        //parts.push(bodyIdx);
    }

    delimiterIdx++;
    bodyIdx++;
}

console.log(parts);

var testBuf = Buffer.alloc(50, 0, 'binary');
multipart2AudioBuffer.copy(testBuf, 0, 0, 40);


console.log(testBuf);

// Part1
var part1Header = "Content-Type: application/json; charset=UTF-8";
var part1HeaderBuff = Buffer.from(part1Header);

var headIdx = parts[0]
    + delimiterBuffer.length + 2
    + part1HeaderBuff.length + 2
    + 2;

var tailIdx = parts[1] - 3;

var part1BUff = Buffer.alloc(tailIdx - headIdx + 1, 0, 'binary');

multipart2AudioBuffer.copy(part1BUff, 0, headIdx, tailIdx + 1);


var part1String = part1BUff.toString();

console.log("part1String");
console.log(part1String);

// Part2
i = 0;
var newlines = [];
for(i = parts[1]; i < multipart2AudioBuffer.length; i++) {
    if(multipart2AudioBuffer[i]===13 && multipart2AudioBuffer[i+1]===10) {
        newlines.push(i);
        if(newlines.length > 3) {
            break;
        }
    }
}

console.log("newlines");
console.log(newlines);

var testBuf = null;
var testString = null;

i = 0;
for(i = 0; i < 4; i++) {
    testBuf = Buffer.alloc(100, 0, 'binary');
    multipart2AudioBuffer.copy(testBuf, 0, newlines[i]-20, newlines[i]);
    testString = testBuf.toString();
    console.log("testString " + i);
    console.log(testString);
}

headIdx = newlines[3]+1;

tailIdx = parts[2] - 3;

var part2BUff = Buffer.alloc(tailIdx - headIdx + 1, 0, 'binary');

multipart2AudioBuffer.copy(part2BUff, 0, headIdx, tailIdx + 1);
testString = part2BUff.toString();
//console.log(testString);

//fs.writeFileSync('/home/jao/wavs/test1.wav', part2BUff, 'binary');