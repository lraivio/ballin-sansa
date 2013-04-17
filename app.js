var fs = require('fs');
var express = require('express');

var app = express();
var server = require('http').createServer(app);

// Serve the index view.
app.get('/', function (req, res) {
    res.set('Content-Type', 'text/html');
    fs.readFile('./index.html', function (err, data) {
        if (err) {
            res.send(500, err);
        }
        res.send(data);
    });
});

// Serve assets.
var assetGroups = require('./assets');
var assetManager = require('connect-assetmanager');
app.use(assetManager(assetGroups));

// Configure socket.io.
var io = require('socket.io').listen(server);
require('./socket')(io);

server.listen(8080);
console.log('Listening on port 8080.');
