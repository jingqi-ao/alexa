var Transcoder = require("../Transcoder.js");

var transcoder = Transcoder();

var threeGPPFileFullPath = '/tmp/upload_fd20be9644fc01f425f4a241892b8cf3';
var wavFileFullPath = '/tmp/upload_fd20be9644fc01f425f4a241892b8cf3.wav';

transcoder.threeGPPtoWav(threeGPPFileFullPath, wavFileFullPath);