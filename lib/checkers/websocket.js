"use strict";
/**
 * WebSocket checker, built on the global WebSocket client (Node.js >= 22).
 * Opens a connection, optionally sends a payload, and captures the first
 * message received.
 *
 * @module checkers/websocket
 */
import util from "../util.js";

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_MESSAGE_TIMEOUT = 2000;

/**
 * Open a WebSocket connection and capture the first message.
 *
 * @param {Object} req - request definition
 * @param {String} req.url - ws:// or wss:// URL
 * @param {String|Array} [req.subprotocols] - subprotocols to offer
 * @param {String} [req.send] - payload to send once the connection is open
 * @param {Number} [req.timeout=5000] - connect timeout in milliseconds
 * @param {Number} [req.messageTimeout=2000] - time to wait for the first message
 * @param {Function} cb - standard cb(err, result) callback
 */
function check(req, cb) {
  if (!req.url) {
    cb(new Error('websocket check requires "url"'));
    return;
  }
  const WebSocketClient = globalThis.WebSocket;
  if (typeof WebSocketClient === "undefined") {
    cb(new Error("global WebSocket is unavailable, Node.js >= 22 required"));
    return;
  }
  const timeout = req.timeout ?? DEFAULT_TIMEOUT;
  const messageTimeout = req.messageTimeout ?? DEFAULT_MESSAGE_TIMEOUT;
  const start = performance.now();
  const done = util.once(cb);
  let connectTime;
  let ws;
  try {
    ws = new WebSocketClient(req.url, req.subprotocols);
  } catch (err) {
    cb(err);
    return;
  }

  const connectTimer = setTimeout(function () {
    ws.close();
    done(
      new Error(`websocket connect timeout after ${timeout}ms (${req.url})`),
    );
  }, timeout);
  connectTimer.unref?.();

  function finish(message) {
    clearTimeout(connectTimer);
    const result = {
      connected: true,
      connectTime,
      protocol: ws.protocol || undefined,
      extensions: ws.extensions || undefined,
      messageReceived: message !== undefined,
      message: message !== undefined ? String(message) : "",
      responseTime: util.elapsed(start),
    };
    ws.close();
    done(null, result);
  }

  ws.addEventListener("open", function () {
    clearTimeout(connectTimer);
    connectTime = util.elapsed(start);
    if (req.send !== undefined) {
      ws.send(req.send);
    }
    setTimeout(finish, messageTimeout).unref?.();
  });
  ws.addEventListener("message", function (event) {
    finish(event.data);
  });
  ws.addEventListener("error", function () {
    clearTimeout(connectTimer);
    done(new Error(`websocket connection failed (${req.url})`));
  });
}

export default { check };
