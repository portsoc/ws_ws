'use strict';

/* global QUnit */
/* eslint-disable no-restricted-globals */
const test = QUnit.test;



const fs = require('fs');
const WebSocket = require('ws');
const fetch = require('node-fetch');

/**
 * Simple WebSocket coordinates generator.
 *
 * Create a server (in `worksheet/server.js`) that accepts WebSocket
 * connections on port 8080 and twice a second (every 500ms) generates
 * a pair of XY coordinates and sends them to every client currently connected.
 *
 * Both coordinates must be in the range 0..100, and an example might
 * look like this: { x: 95, y: 42 }.  You should, of course, use JSON to
 * send the coordinates object.
 *
 *
 * To serve web pages, include `app.use(express.static(__dirname + '/webpages'))`
 * in your express setup.
 *
 * Make sure to export the result of http.createServer,
 * e.g. if you have `const server = http.createServer(app)`
 * then write `module.exports = server;`
 *
 * When you have the server, start it and test it:
 *  1) run `npm test`
 *  2) open `test.html` in your browser, or copy `test.html` and `assess.ws.js`
 *     into `worksheet/webpages` and then go to http://your-ip/test.html
 *
 *
 * Further, create a web page in `worksheet/webpages/index.html` that is
 * a WebSocket client and displays the last 10 of the coordinates as some
 * symbols (circles, crosses, diamonds or anything) on a canvas.
 *
 * Test that if you open http://your-ip/ in two browser windows, they both
 * show the same coordinates as they are generated.
 *
 * As a bonus, the client page should reconnect if it loses connection to the
 * WebSocket server. You can try that by running the page, restarting the server,
 * and checking that the client page continues to update the coordinates.
 */
QUnit.test(
  "`server.js` should exist in `worksheet/`",
  (assert) => {
    try {
      fs.accessSync('worksheet/server.js', fs.F_OK);
      assert.ok(true, "server.js created");
    } catch (e) {
      assert.ok(false, "worksheet/server.js is missing - please create it");
    }
  }
);

test(
  "`index.html` should exist in `worksheet/webpages/`",
  (assert) => {
    try {
      fs.accessSync('worksheet/webpages/index.html', fs.F_OK);
      assert.ok(true, "index.html created");
    } catch (e) {
      assert.ok(false, "worksheet/webpages/index.html is missing - please create it");
    }
  }
);

test(
  "QUnit.server should serve HTML on GET /",
  async function (assert) {
    // start the server
    console.log('starting server, if you see EADDRINUSE errors, something is blocking port 8080.');
    try {
      require('./worksheet/server');
    } catch (e) {
      console.error(e.stack);
      assert.ok(false, 'tests will show up when `worksheet/server.js` is there');
      return;
    }

    var options = {
      host: 'localhost',
      port: '8080',
      method: 'GET',
      path: '/',
      timeout: 1000,
    };

    const start = assert.async();

    var response = await fetch('http://localhost:8080/', {timeout: 1000});
    if (!response.ok) {
      console.log(e.stack || e.message || e);
      assert.ok(false, 'server should serve the content of worksheet/webpages/index.html on /');
      start();
      return;
    }
    assert.equal(response.status, 200, 'request to / should return status code 200');
    if (!('' + response.headers.get('content-type')).startsWith('text/html')) {
      assert.ok(false, 'request to / should return HTML content, instead returns ' + response.headers['content-type']);
    }
    var str = await response.text();
    var indexhtml = fs.readFileSync('worksheet/webpages/index.html', 'utf8');
    assert.ok(str.trim() == indexhtml.trim(), 'request to / should return the content of worksheet/webpages/index.html');
    start();
    // req.on('timeout', function (e) {
    //   req.abort();
    //   assert.ok(false, 'server timed out, your HTTP server is not responding to requests');
    //   start();
    // });
  }
);

test(
  "QUnit.server should accept web socket connections on 8080",
  (assert) => {
    let server;
    try {
      server = require('./worksheet/server');
    } catch (e) {
      assert.ok(false, 'tests will show up when `worksheet/server.js` is there');
      return;
    }
    const start = assert.async(); // stop qunit so it waits for asynchrony

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
              assert.ok(false, `coordinates ${coords.x},${coords.y} out of 0..100 bounds`);
            }

          } catch (e) {
            if (jsonErrMax-- > 0) assert.ok(false, 'coordinates should be sent as JSON strings');
          }

          let now = Date.now();
          if ((now - lastTime < (MSG_DELAY*.9)) && (data != lastMsg) && (diffErrMax-- > 0)) {
            assert.equal(data, lastMsg, `coordinates received within ${MSG_DELAY*.9}ms should be the same`);
          } else
          if ((now - lastTime >= (MSG_DELAY*.9)) && (data == lastMsg) && (sameErrMax-- > 0)) {
            assert.notEqual(data, lastMsg, `subsequent coordinates should not be the same`);
          }
          lastTime = now;
          lastMsg = data;
        });

        wss[i].on('error', (e) => {
          console.error(e.stack);
          assert.ok(false, 'tests will show up when `worksheet/server.js` does WebSockets');
        });
      }
    }, 100);

    // check the results
    setTimeout(function() {

      let successfullyOpened = 0;
      for (let i=0; i<NUM; i++) {
        if (opened[i]) successfullyOpened++;
      }
      assert.equal(successfullyOpened, NUM, `expecting all ${NUM} connections to successfully open`);

      for (let i=0; i<NUM; i++) {
        assert.ok((received[i] >= EXP - D) && (received[i] <= EXP + D), `expecting between ${EXP - D} and ${EXP + D} messages from connection ${i}, got ${received[i]}`);
      }

      // close all the connections so we don't get any more messages
      for (let i = 0; i<NUM; i++) {
        wss[i].close();
      }

      // start qunit again after all the asynchrony
      start();
      if (server.close) {
        server.close();
      } else {
        console.log(`If this does not quit, server.js probably needs to export the server.\nPress ctrl-c to end the test.`);
      }
    }, DELAY);
  }
)
