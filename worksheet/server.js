'use strict';

const http = require('http');
const wsserver = require('ws').Server;
const express = require('express');

const server = http.createServer();
const wss = new wsserver({ server: server });
const app = express();
server.on('request', app);

app.use(express.static(__dirname + '/webpages', { extensions: ['html'] }));

wss.on('connection', (ws) => {
  console.log('got a connection');
  ws.on('close', function(message) {
    console.log('lost a connection');
  });
});

setInterval(() => {
  var newCoords = JSON.stringify({x: Math.random()*100, y: Math.random()*100});
  wss.clients.forEach( (client) => {
    client.send(newCoords, (e) => {});
  });
}, 500);


server.listen(8080, function () { console.log('Server started.'); });
