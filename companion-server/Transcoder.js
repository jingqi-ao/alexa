
var child_process = require('child_process');

module.exports = function()  {


    return {
        threeGPPtoWav: function(threeGPPFileFullPath, wavFileFullPath) {

            // e.g. avconv -i inputfile.3gpp outputfile.wav
            var command = "avconv -i " + 
                threeGPPFileFullPath + ' ' + 
                wavFileFullPath;

            // Note: no error handling
            child_process.execSync(command);


            console.log("threeGPPtoWav done");
            console.log(threeGPPFileFullPath);
            console.log(wavFileFullPath);
        }
    }

}