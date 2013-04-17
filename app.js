var fs = require('fs');
var express = require('express');

var app = express();

app.get('/', function (req, res) {
    res.set('Content-Type', 'text/html');
    fs.readFile('./index.html', function (err, data) {
        if (err) {
            res.send(500, err);
        }
        res.send(data);
    });
});

app.listen(8080);
console.log('Listening on port 8080.');
