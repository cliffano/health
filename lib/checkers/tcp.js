"use strict";
/**
 * TCP checker, built on the core net module. Opens a connection, optionally
 * sends a payload, and captures whatever the server sends back.
 *
 * @module checkers/tcp
 */
import net from "net";

import util from "../util.js";

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_READ_TIMEOUT = 2000;

/**
 * Connect to a TCP port and capture the response.
 *
 * @param {Object} req - request definition
 * @param {String} req.host - host to connect to
 * @param {Number} req.port - port to connect to
 * @param {String} [req.send] - text payload to send after connecting
 * @param {String} [req.sendHex] - payload as hex string, takes precedence
 * @param {Number} [req.timeout=5000] - connect timeout in milliseconds
 * @param {Number} [req.readTimeout=2000] - time to collect data after connecting
 * @param {String} [req.encoding=utf8] - encoding of the returned data string
 * @param {Function} cb - standard cb(err, result) callback
 */
function check(req, cb) {
  if (!req.host || !req.port) {
    cb(new Error('tcp check requires "host" and "port"'));
    return;
  }
  const timeout = req.timeout ?? DEFAULT_TIMEOUT;
  const readTimeout = req.readTimeout ?? DEFAULT_READ_TIMEOUT;
  const encoding = req.encoding || "utf8";
  const start = performance.now();
  const done = util.once(cb);
  const chunks = [];
  let connectTime;
  let remoteAddress;
  let remoteFamily;

  const socket = net.connect({ host: req.host, port: req.port, timeout });

  function finish() {
    socket.destroy();
    const data = Buffer.concat(chunks);
    done(null, {
      connected: connectTime !== undefined,
      connectTime,
      responseTime: util.elapsed(start),
      remoteAddress,
      remoteFamily,
      data: data.toString(encoding),
      dataHex: data.toString("hex"),
      bytesReceived: data.length,
    });
  }

  socket.on("connect", function () {
    connectTime = util.elapsed(start);
    remoteAddress = socket.remoteAddress;
    remoteFamily = socket.remoteFamily;
    const payload = util.payload(req.sendHex, req.send);
    if (payload !== undefined) {
      socket.write(payload);
    }
    setTimeout(finish, readTimeout).unref?.();
  });
  socket.on("data", function (chunk) {
    chunks.push(chunk);
  });
  socket.on("end", finish);
  socket.on("timeout", function () {
    if (connectTime === undefined) {
      socket.destroy();
      done(
        new Error(
          `tcp connect timeout after ${timeout}ms (${req.host}:${req.port})`,
        ),
      );
    } else {
      finish();
    }
  });
  socket.on("error", done);
}

export default { check };
