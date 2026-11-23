"use strict";
/**
 * HTTP/HTTPS checker, built on the core http and https modules.
 *
 * @module checkers/http
 */
import http from "http";
import https from "https";

import util from "../util.js";

const MAX_BODY = 5 * 1024 * 1024;
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_MAX_REDIRECTS = 5;

/**
 * Capture TLS handshake and certificate details from an https socket.
 *
 * @param {Object} socket - response socket
 * @return {Object} TLS details, undefined for plain http
 * @private
 */
function _tlsInfo(socket) {
  if (!socket || typeof socket.getPeerCertificate !== "function") {
    return undefined;
  }
  const cert = socket.getPeerCertificate() || {};
  const cipher = socket.getCipher?.();
  return {
    protocol: socket.getProtocol?.(),
    cipher: cipher?.name,
    authorized: socket.authorized,
    certSubject: cert.subject?.CN,
    certIssuer: cert.issuer?.CN,
    certValidFrom: cert.valid_from,
    certValidTo: cert.valid_to,
    certDaysRemaining: util.daysRemaining(cert.valid_to),
  };
}

/**
 * Send a single request without following redirects.
 *
 * @param {String} url - request URL
 * @param {Object} opts - method, headers, body, timeout, rejectUnauthorized
 * @param {Function} cb - standard cb(err, result) callback
 * @private
 */
function _requestOnce(url, opts, cb) {
  const done = util.once(cb);
  let target;
  try {
    target = new URL(url);
  } catch (err) {
    done(err);
    return;
  }
  const lib = target.protocol === "https:" ? https : http;
  const request = lib.request(
    target,
    {
      method: opts.method,
      headers: opts.headers,
      timeout: opts.timeout,
      rejectUnauthorized: opts.rejectUnauthorized,
    },
    function (res) {
      const chunks = [];
      let size = 0;
      res.on("data", function (chunk) {
        if (size < MAX_BODY) {
          chunks.push(chunk);
          size += chunk.length;
        }
      });
      res.on("end", function () {
        done(null, {
          status: res.statusCode,
          statusText: res.statusMessage,
          httpVersion: res.httpVersion,
          headers: res.headers,
          body: Buffer.concat(chunks).toString("utf8"),
          remoteAddress: res.socket?.remoteAddress,
          tls: _tlsInfo(res.socket),
        });
      });
      res.on("error", done);
    },
  );
  request.on("timeout", function () {
    request.destroy(new Error(`http timeout after ${opts.timeout}ms`));
  });
  request.on("error", done);
  if (opts.body !== undefined) {
    request.write(opts.body);
  }
  request.end();
}

/**
 * Perform an HTTP/HTTPS request, following redirects, and capture
 * everything verifiable about the final response.
 *
 * @param {Object} req - request definition
 * @param {String} req.url - request URL, http:// or https://
 * @param {String} [req.method=GET] - request method
 * @param {Object} [req.headers] - request headers
 * @param {String} [req.body] - request body
 * @param {Number} [req.timeout=10000] - timeout in milliseconds
 * @param {Boolean} [req.followRedirects=true] - follow 3xx redirects
 * @param {Number} [req.maxRedirects=5] - maximum redirects to follow
 * @param {Boolean} [req.rejectUnauthorized=true] - verify TLS certificates
 * @param {Function} cb - standard cb(err, result) callback
 */
function check(req, cb) {
  if (!req.url) {
    cb(new Error('http check requires "url"'));
    return;
  }
  const opts = {
    method: req.method || "GET",
    headers: req.headers || {},
    body: req.body,
    timeout: req.timeout ?? DEFAULT_TIMEOUT,
    rejectUnauthorized: req.rejectUnauthorized !== false,
  };
  const followRedirects = req.followRedirects !== false;
  const maxRedirects = req.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const start = performance.now();

  function _request(url, redirects) {
    _requestOnce(url, opts, function (err, res) {
      if (err) {
        cb(err);
        return;
      }
      const isRedirect =
        res.status >= 300 && res.status < 400 && res.headers.location;
      if (followRedirects && isRedirect && redirects < maxRedirects) {
        _request(new URL(res.headers.location, url).toString(), redirects + 1);
        return;
      }
      cb(null, {
        url,
        status: res.status,
        statusText: res.statusText,
        httpVersion: res.httpVersion,
        headers: res.headers,
        body: res.body,
        bodyLength: Buffer.byteLength(res.body),
        json: util.parseJson(res.body),
        redirects,
        responseTime: util.elapsed(start),
        remoteAddress: res.remoteAddress,
        tls: res.tls,
      });
    });
  }
  _request(req.url, 0);
}

export default { check };
