"use strict";

QUnit.module("ws_ws");

QUnit.test(
  "run the websocket server on localhost, or copy `test.html` and `assess.ws.js` into `worksheet/webpages/` and load the page from your server.",

  function(assert) {

    var address = "ws://localhost:8080/";

    if (window.location.hostname != "") {
      address = "ws://" + window.location.hostname + ":" + (window.location.port || 80) + "/";
    }

    var ws = new WebSocket(address);

    ws.onmessage = function(e) {
      window.lastcoord.textContent = e.data;
    };


    var done = assert.async(2);

    setTimeout(checkMessage, 1500);
    setTimeout(checkMessage, 3000);

    var oldMessage = 'none yet';
    function checkMessage() {
      assert.notEqual(
        window.lastcoord.textContent.trim(),
        oldMessage,
        "The message should be changing."
      );
      oldMessage = window.lastcoord.textContent;
      done();
    }

    setTimeout(function() { window.lastcoord.parentElement.classList.add("done"); }, 3100);
  }
);
