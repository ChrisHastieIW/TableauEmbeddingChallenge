
var express = require('express');
var bodyParser = require("body-parser");
var fs = require('fs');
var app = express();

app.use('/public', express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));

// configure express to use the bodyParser - this is needed in order to be able to process POST requests
// extend the size limit on the parser to allow for very large requests
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb', extended: true }));

var tableauAPI = require("./tableauAPI.js")(app);

// Enable CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    //res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

app.get('/', function (req, res) {
    res.send('Hello World!');
});

//***********************
// Instantiate the server
//***********************


var server = app.listen(3002, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Node http server listening at http://%s:%s", host, port);
})
server.timeout = 0;  // do not time out

/*

const https = require('https');

const options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
};

https.createServer(options, app).listen(3001, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Node https server listening at http://%s:%s", host, port);
}).timeout = 0;  // do not time out
*/
