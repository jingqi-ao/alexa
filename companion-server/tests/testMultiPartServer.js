var express = require('express');
var app = express();

var PORT = 5000;

var formidable = require('formidable');

app.get('/', function (req, res) {
    res.send('Multipart test server is running');
});

app.post('/events', function(req, res) {

    var form = new formidable.IncomingForm();
    //form.encoding = 'utf-8';
    form.encoding = 'binary';
    form.uploadDir = "./";

    form.parse(req, function(err, fields, files) {

        console.log("err");
        console.log(err);

        console.log("fields");
        console.log(fields);

        console.log("files");
        console.log(files);
    });

});

app.listen(PORT, function () {
    console.log('Multipart test server starts on port: ' + PORT);
});

