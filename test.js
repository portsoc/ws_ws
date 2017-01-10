'use strict';

require('./logger').setupLogging(QUnit, test);

var fs = require('fs');
var WebSocket = require('ws');

/**
 * Simple WebSocket coordinates generator.
 *
 * Create a server (in `worksheet/server.js`) that accepts WebSocket
 * connections on port 8080 and twice a second (every 500ms) generates
 * a pair of XY coordinates and sends them to every client currently connected.
 *
 * Both coordinates must be in the range 0..100, and an example might
 * look like this: { x: 345, y: 42 }
 */
test(
  "`server.js` should exist in `worksheet/`",
  function () {
    try {
      fs.accessSync('worksheet/server.js', fs.F_OK);
      ok(true, "server.js created");
    } catch (e) {
      ok(false, "worksheet/server.js is missing - please create it");
    }
  }
);

test(
  "server should accept web socket connections on 8080",
  function () {
    // start the server
    console.log('starting server, if you see EADDRINUSE errors, something is blocking port 8080.');
    require('./worksheet/server');
    stop(); // stop qunit so it waits for asynchrony

    const NUM = 3; // how many connections we'll try
    const DELAY = 5000;
    const MSG_PER_SEC = 2;
    const MSG_DELAY = 1000 / MSG_PER_SEC;

    const EXP = Math.round(DELAY / 1000 * MSG_PER_SEC);
    const D = 1; // expecting EXPECTED_MSG ± D messages from each connection

    const wss = [];
    const opened = [];
    const received = [];

    let lastTime = 0;
    let lastMsg = null;

    let jsonErrMax = 2;
    let sameErrMax = 3;
    let diffErrMax = 2;
    let numsErrMax = 1;

    // give the server time to start
    setTimeout(() => {

      for (let i=0; i<NUM; i++) {
        wss[i] = new WebSocket('ws://localhost:8080/path');

        wss[i].on('open', function () {
          opened[i] = true;
          console.log(`opened connection ${i}`);
        });

        wss[i].on('message', function(data, flags) {
          received[i] = (received[i] || 0) + 1;
          console.log(`received ${data} on connection ${i}`);

          try {
            var coords = JSON.parse(data);

            let withinBounds =
              (coords.x >= 0) &&
              (coords.x <= 100) &&
              (coords.y >= 0) &&
              (coords.y <= 100);
            if (!withinBounds && (numsErrMax-- > 0)) {
              ok(false, `coordinates ${coords.x},${coords.y} out of 0..100 bounds`);
            }

          } catch (e) {
            if (jsonErrMax-- > 0) ok(false, 'coordinates should be sent as JSON strings');
          }

          let now = Date.now();
          if ((now - lastTime < (MSG_DELAY*.9)) && (data != lastMsg) && (diffErrMax-- > 0)) {
            equal(data, lastMsg, `coordinates received within ${MSG_DELAY*.9}ms should be the same`);
          } else
          if ((now - lastTime >= (MSG_DELAY*.9)) && (data == lastMsg) && (sameErrMax-- > 0)) {
            notEqual(data, lastMsg, `subsequent coordinates should not be the same`);
          }
          lastTime = now;
          lastMsg = data;
        });
      }

    }, 100);

    // check the results
    setTimeout(function() {

      let successfullyOpened = 0;
      for (let i=0; i<NUM; i++) {
        if (opened[i]) successfullyOpened++;
      }
      equal(successfullyOpened, NUM, `expecting all ${NUM} connections to successfully open`);

      for (let i=0; i<NUM; i++) {
        ok((received[i] >= EXP - D) && (received[i] <= EXP + D), `expecting between ${EXP - D} and ${EXP + D} messages from connection ${i}, got ${received[i]}`);
      }

      // close all the connections so we don't get any more messages
      for (let i = 0; i<NUM; i++) {
        wss[i].close();
      }

      // start qunit again after all the asynchrony
      start();
    }, DELAY);
  }
)
