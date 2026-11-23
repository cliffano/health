"use strict";
/**
 * UDP checker, built on the core dgram module.
 *
 * UDP is connectionless: no response may mean the service is down, the
 * packet was dropped, or the service never replies to that payload. The
 * result exposes `responded` so expectations can assert either way.
 *
 * @module checkers/udp
 */
import dgram from "dgram";

import util from "../util.js";

const DEFAULT_TIMEOUT = 3000;

/**
 * Send a datagram and wait for a response.
 *
 * @param {Object} req - request definition
 * @param {String} req.host - host to send to
 * @param {Number} req.port - port to send to
 * @param {String} [req.send=""] - text payload
 * @param {String} [req.sendHex] - payload as hex string, takes precedence
 * @param {Number} [req.timeout=3000] - time to wait for a response
 * @param {String} [req.type=udp4] - socket type, udp4 or udp6
 * @param {String} [req.encoding=utf8] - encoding of the returned data string
 * @param {Function} cb - standard cb(err, result) callback
 */
function check(req, cb) {
  if (!req.host || !req.port) {
    cb(new Error('udp check requires "host" and "port"'));
    return;
  }
  const timeout = req.timeout ?? DEFAULT_TIMEOUT;
  const encoding = req.encoding || "utf8";
  const start = performance.now();
  const done = util.once(cb);
  const socket = dgram.createSocket(req.type || "udp4");

  function finish(err, result) {
    clearTimeout(timer);
    socket.close();
    done(err, result);
  }

  const timer = setTimeout(function () {
    finish(null, {
      responded: false,
      responseTime: util.elapsed(start),
      data: "",
      dataHex: "",
      bytesReceived: 0,
    });
  }, timeout);
  timer.unref?.();

  socket.on("message", function (msg, rinfo) {
    finish(null, {
      responded: true,
      responseTime: util.elapsed(start),
      data: msg.toString(encoding),
      dataHex: msg.toString("hex"),
      bytesReceived: msg.length,
      remoteAddress: rinfo.address,
      remotePort: rinfo.port,
    });
  });
  socket.on("error", finish);

  const payload = util.payload(req.sendHex, req.send) || Buffer.alloc(0);
  socket.send(payload, req.port, req.host, function (err) {
    if (err) {
      finish(err);
    }
  });
}

export default { check };
