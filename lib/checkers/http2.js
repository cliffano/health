"use strict";
/**
 * HTTP/2 checker, built on the core http2 module. Supports https:// (h2 over
 * TLS, negotiated via ALPN) and http:// (plaintext h2c).
 *
 * @module checkers/http2
 */
import http2 from "http2";

import util from "../util.js";

const MAX_BODY = 5 * 1024 * 1024;
const DEFAULT_TIMEOUT = 10000;

/**
 * Perform an HTTP/2 request and capture the response.
 *
 * @param {Object} req - request definition
 * @param {String} req.url - request URL, http:// or https://
 * @param {String} [req.method=GET] - request method
 * @param {Object} [req.headers] - request headers
 * @param {String} [req.body] - request body
 * @param {Number} [req.timeout=10000] - timeout in milliseconds
 * @param {Boolean} [req.rejectUnauthorized=true] - verify TLS certificates
 * @param {Function} cb - standard cb(err, result) callback
 */
function check(req, cb) {
  if (!req.url) {
    cb(new Error('http2 check requires "url"'));
    return;
  }
  let target;
  try {
    target = new URL(req.url);
  } catch (err) {
    cb(err);
    return;
  }
  const timeout = req.timeout ?? DEFAULT_TIMEOUT;
  const start = performance.now();
  const done = util.once(cb);

  const client = http2.connect(target.origin, {
    rejectUnauthorized: req.rejectUnauthorized !== false,
  });
  function fail(err) {
    clearTimeout(timer);
    client.close();
    done(err);
  }
  const timer = setTimeout(function () {
    fail(new Error(`http2 timeout after ${timeout}ms`));
  }, timeout);
  timer.unref?.();
  client.on("error", fail);

  const request = client.request({
    ":method": req.method || "GET",
    ":path": `${target.pathname}${target.search}`,
    ...(req.headers || {}),
  });
  request.on("error", fail);

  let status;
  let headers = {};
  request.on("response", function (responseHeaders) {
    status = responseHeaders[":status"];
    headers = Object.fromEntries(
      Object.entries(responseHeaders).filter(([k]) => !k.startsWith(":")),
    );
  });

  const chunks = [];
  let size = 0;
  request.on("data", function (chunk) {
    if (size < MAX_BODY) {
      chunks.push(chunk);
      size += chunk.length;
    }
  });
  request.on("end", function () {
    clearTimeout(timer);
    const alpnProtocol = client.socket?.alpnProtocol || undefined;
    client.close();
    const body = Buffer.concat(chunks).toString("utf8");
    done(null, {
      url: req.url,
      status,
      httpVersion: "2.0",
      alpnProtocol,
      headers,
      body,
      bodyLength: Buffer.byteLength(body),
      json: util.parseJson(body),
      responseTime: util.elapsed(start),
    });
  });

  if (req.body !== undefined) {
    request.write(req.body);
  }
  request.end();
}

export default { check };
