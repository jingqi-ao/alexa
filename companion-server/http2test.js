
var http2 = require('http2');

var avsAPIHostName = "avs-alexa-na.amazon.com";

var tokenObj = {
    access_token: "Atza|IwEBIB3bMYxeQEuLhitf8ug2PU54NyKcZyxPPfmOmYzNmlFP-DlHVPIicGrVYvt8NDVeMo5gltb_58vNEzflS-H0nS9HUUOtq2fZAsF-ETV1o2glKNaL-D9Xjqqh9wkjkO59dYtDd0FIBo_Rg2BTRG9AqAWxUNO8Cu28l6-Q8aY6ZjUsqUjBx7FBUQvqBeds1sdFo_Fh_NAsjCCGkCyl55Nr5qtzls5rIWqFvfjTC6Buru5-JqXUiYorgHZ4LtCCURQ6Wr3BrzW-jDU8emfSlqYzp0QG6oJ0FDdNzIlsE9oE9BkKX9fSTJMUHgJO6jf9hcVX-IM4W3N-q6PkSNEiVtF8O0g_yFNj5bLxM622_njuo3HMhlJpY3VZGc-qNCkhfpkY5JGm-4g4HmD110LVgCX7sfD0gFoRu03lt8aFSPD1MlhJIXrf3jlQYkrzn2QL8Xt5e0r06xlxABRCty5XJF5nEZrHzTSuTzqVftMFlSyQdS3UiuRJ1PVOZpd4yWwyDX8kdwk"
}

    console.log("avsPing options");
    console.log(options);

    var options = {
        hostname: avsAPIHostName,
        port: 443,
        path: '/ping',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + tokenObj.access_token
        }
    };

    console.log("avsPing options");
    console.log(options);

    var req = http2.request(options, function(res) {

        console.log(res);

        res.on('data', function(chuck) {
            console.log(chunk);
        });

        res.on('end', function() {
            console.log('No more data in response.')
        });

        if(error) {
            console.log("Error happened");
            console.log(error);
            return;
        }

    });

    req.on('error', (e) => {
        console.log(e);
        //console.log(`problem with request: ${e.message}`);
    });

    req.end();