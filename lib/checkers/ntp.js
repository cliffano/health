"use strict";
/**
 * NTP (SNTP) checker, built on the core dgram module.
 *
 * Clock offset and round-trip delay are computed per RFC 4330:
 *
 * - offset = ((T2 - T1) + (T3 - T4)) / 2
 * - delay = (T4 - T1) - (T3 - T2)
 *
 * @module checkers/ntp
 */
import dgram from "dgram";

import util from "../util.js";

const DEFAULT_PORT = 123;
const DEFAULT_TIMEOUT = 3000;
const PACKET_SIZE = 48;
// seconds between 1900-01-01 (NTP epoch) and 1970-01-01 (Unix epoch)
const NTP_EPOCH_OFFSET = 2208988800;
const FRACTION = 0x100000000;

/**
 * Write a Unix millisecond time as a 64-bit NTP timestamp.
 *
 * @param {Buffer} buf - buffer to write to
 * @param {Number} offset - byte offset
 * @param {Number} ms - Unix time in milliseconds
 * @private
 */
function _writeTimestamp(buf, offset, ms) {
  const secs = Math.floor(ms / 1000) + NTP_EPOCH_OFFSET;
  const frac = Math.round(((ms % 1000) / 1000) * FRACTION);
  buf.writeUInt32BE(secs >>> 0, offset);
  buf.writeUInt32BE(frac >>> 0, offset + 4);
}

/**
 * Read a 64-bit NTP timestamp as Unix milliseconds.
 *
 * @param {Buffer} buf - buffer to read from
 * @param {Number} offset - byte offset
 * @return {Number} Unix time in milliseconds
 * @private
 */
function _readTimestamp(buf, offset) {
  const secs = buf.readUInt32BE(offset);
  const frac = buf.readUInt32BE(offset + 4);
  return (secs - NTP_EPOCH_OFFSET) * 1000 + (frac / FRACTION) * 1000;
}

/**
 * Decode an NTP server response.
 *
 * @param {Buffer} msg - response packet
 * @param {Number} t1 - client transmit time
 * @param {Number} t4 - client receive time
 * @return {Object} result
 * @private
 */
function _decode(msg, t1, t4) {
  if (msg.length < PACKET_SIZE) {
    return { responded: true, valid: false, bytesReceived: msg.length };
  }
  const mode = msg[0] & 0x7;
  const stratum = msg[1];
  const t2 = _readTimestamp(msg, 32);
  const t3 = _readTimestamp(msg, 40);
  const offset = Math.round((t2 - t1 + (t3 - t4)) / 2);
  return {
    responded: true,
    valid: mode === 4 && stratum > 0 && stratum < 16,
    leapIndicator: (msg[0] >> 6) & 0x3,
    version: (msg[0] >> 3) & 0x7,
    mode,
    stratum,
    offset,
    offsetAbs: Math.abs(offset),
    delay: Math.round(t4 - t1 - (t3 - t2)),
    serverTime: new Date(t3).toISOString(),
    bytesReceived: msg.length,
    responseTime: t4 - t1,
  };
}

/**
 * Query an NTP server.
 *
 * @param {Object} req - request definition
 * @param {String} req.host - NTP server, e.g. pool.ntp.org
 * @param {Number} [req.port=123] - NTP port
 * @param {Number} [req.timeout=3000] - time to wait for a response
 * @param {Function} cb - standard cb(err, result) callback
 */
function check(req, cb) {
  if (!req.host) {
    cb(new Error('ntp check requires "host"'));
    return;
  }
  const timeout = req.timeout ?? DEFAULT_TIMEOUT;
  const done = util.once(cb);
  const socket = dgram.createSocket("udp4");

  function finish(err, result) {
    clearTimeout(timer);
    socket.close();
    done(err, result);
  }

  const timer = setTimeout(function () {
    finish(null, { responded: false, responseTime: timeout });
  }, timeout);
  timer.unref?.();

  // 48-byte SNTP request: LI=0, VN=4, Mode=3 (client), with T1 in the
  // transmit timestamp field so the server echoes it back
  const packet = Buffer.alloc(PACKET_SIZE);
  packet[0] = 0x23;
  const t1 = Date.now();
  _writeTimestamp(packet, 40, t1);

  socket.on("message", function (msg) {
    finish(null, _decode(msg, t1, Date.now()));
  });
  socket.on("error", finish);
  socket.send(packet, req.port ?? DEFAULT_PORT, req.host, function (err) {
    if (err) {
      finish(err);
    }
  });
}

export default { check };
