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
  var coords = JSON.stringify(newCoords());
  wss.clients.forEach( (client) => {
    client.send(coords, (e) => {});
  });
}, 500);


server.listen(8080, function () { console.log('Server started.'); });



// fancy-pants walking coords

function r() { return Math.random()*30+5; }

let x = 10;
let y = 10;
let dx = r();
let dy = r();

function newCoords () {
  x+=dx;
  y+=dy;

  if (x>=100) { x = 100; dx = -r(); }
  if (y>=100) { y = 100; dy = -r(); }
  if (x<=0)   { x = 0;   dx = r(); }
  if (y<=0)   { y = 0;   dy = r(); }

  if (Math.random() < .01) dx = -dx;
  if (Math.random() < .01) dy = -dy;

  return {x: x, y: y};
}
