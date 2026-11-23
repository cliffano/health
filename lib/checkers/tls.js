"use strict";
/**
 * TLS checker, built on the core tls module. Works against any TLS port
 * (HTTPS, SMTPS, IMAPS, LDAPS, databases, ...).
 *
 * `rejectUnauthorized` defaults to false so that invalid certificates can be
 * inspected and asserted on (`authorized: false`) instead of erroring out.
 *
 * @module checkers/tls
 */
import tls from "tls";

import util from "../util.js";

const DEFAULT_PORT = 443;
const DEFAULT_TIMEOUT = 5000;

/**
 * Summarise a peer certificate.
 *
 * @param {Object} cert - peer certificate from getPeerCertificate()
 * @return {Object} certificate details, undefined when no certificate
 * @private
 */
function _certInfo(cert) {
  if (!cert || Object.keys(cert).length === 0) {
    return undefined;
  }
  return {
    subject: cert.subject?.CN,
    issuer: cert.issuer?.CN,
    subjectAltName: cert.subjectaltname,
    validFrom: cert.valid_from,
    validTo: cert.valid_to,
    daysRemaining: util.daysRemaining(cert.valid_to),
    serialNumber: cert.serialNumber,
    fingerprint256: cert.fingerprint256,
  };
}

/**
 * Open a TLS connection and capture handshake and certificate details.
 *
 * @param {Object} req - request definition
 * @param {String} req.host - host to connect to
 * @param {Number} [req.port=443] - port to connect to
 * @param {String} [req.servername] - SNI name, defaults to host
 * @param {Array} [req.alpnProtocols] - ALPN protocols to offer, e.g. h2
 * @param {Number} [req.timeout=5000] - timeout in milliseconds
 * @param {Boolean} [req.rejectUnauthorized=false] - fail on invalid certificates
 * @param {Function} cb - standard cb(err, result) callback
 */
function check(req, cb) {
  if (!req.host) {
    cb(new Error('tls check requires "host"'));
    return;
  }
  const port = req.port ?? DEFAULT_PORT;
  const servername = req.servername || req.host;
  const timeout = req.timeout ?? DEFAULT_TIMEOUT;
  const start = performance.now();
  const done = util.once(cb);

  const socket = tls.connect({
    host: req.host,
    port,
    servername,
    ALPNProtocols: req.alpnProtocols,
    rejectUnauthorized: req.rejectUnauthorized === true,
    timeout,
  });

  socket.on("secureConnect", function () {
    const cipher = socket.getCipher();
    const result = {
      connected: true,
      authorized: socket.authorized,
      authorizationError: socket.authorizationError?.toString(),
      protocol: socket.getProtocol(),
      cipher: cipher?.name,
      cipherVersion: cipher?.version,
      alpnProtocol: socket.alpnProtocol || undefined,
      servername,
      responseTime: util.elapsed(start),
      cert: _certInfo(socket.getPeerCertificate()),
    };
    socket.end();
    done(null, result);
  });
  socket.on("timeout", function () {
    socket.destroy();
    done(
      new Error(`tls connect timeout after ${timeout}ms (${req.host}:${port})`),
    );
  });
  socket.on("error", done);
}

export default { check };
