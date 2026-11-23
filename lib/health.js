"use strict";
/**
 * Health verifies networking protocol responses against YAML expectation
 * files.
 *
 * @module health
 */
import fs from "fs";
import p from "path";
import { fileURLToPath } from "url";

import async from "async";
import YAML from "yaml";

import dnsChecker from "./checkers/dns.js";
import httpChecker from "./checkers/http.js";
import http2Checker from "./checkers/http2.js";
import ntpChecker from "./checkers/ntp.js";
import tcpChecker from "./checkers/tcp.js";
import tlsChecker from "./checkers/tls.js";
import udpChecker from "./checkers/udp.js";
import websocketChecker from "./checkers/websocket.js";
import matcher from "./matcher.js";

const DIRNAME = p.dirname(fileURLToPath(import.meta.url));
const SAMPLE_FILE = "health.yaml";

const CHECKERS = {
  http: httpChecker,
  https: httpChecker,
  http2: http2Checker,
  tcp: tcpChecker,
  udp: udpChecker,
  dns: dnsChecker,
  tls: tlsChecker,
  websocket: websocketChecker,
  ws: websocketChecker,
  ntp: ntpChecker,
};

const PROTOCOLS = Object.keys(CHECKERS);

/**
 * Derive a check name from its protocol and request when none is given.
 *
 * @param {String} protocol - check protocol
 * @param {Object} request - check request definition
 * @return {String} check name
 * @private
 */
function _defaultName(protocol, request) {
  if (request.url) {
    return `${protocol} ${request.url}`;
  }
  if (request.name) {
    return `${protocol} ${request.name}`;
  }
  if (request.host) {
    return `${protocol} ${request.host}:${request.port ?? ""}`;
  }
  return String(protocol);
}

/**
 * Lowercase expected header names, Node.js always reports them lowercased.
 *
 * @param {Object} expect - check expectation
 * @return {Object} expectation with lowercased header names
 * @private
 */
function _normaliseExpect(expect) {
  if (!expect || typeof expect !== "object" || !expect.headers) {
    return expect;
  }
  const headers = Object.fromEntries(
    Object.entries(expect.headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return { ...expect, headers };
}

/**
 * Parse YAML text into a list of check definitions. An expectation file is
 * a single YAML document with a top-level `checks` array, each item being a
 * check of any protocol.
 *
 * @param {String} text - YAML text
 * @return {Array} check definitions
 * @private
 */
function _parseChecks(text) {
  const doc = YAML.parse(text);
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.checks)) {
    throw new Error('Expectation file must have a top-level "checks" array');
  }
  doc.checks.forEach(function (check, index) {
    if (!check || typeof check !== "object" || Array.isArray(check)) {
      throw new Error(`checks[${index}] must be a check object`);
    }
  });
  return doc.checks;
}

class Health {
  /**
   * Constructor for initialising Health.
   *
   * @param {Object} [opts] - optional settings, reserved for future use
   */
  constructor(opts) {
    this.opts = opts || {};
  }

  /**
   * Create a sample health.yaml expectation file in the current working
   * directory. An existing health.yaml is never overwritten.
   *
   * @param {Function} cb - standard cb(err, result) callback, result is the
   *   created file name
   */
  init(cb) {
    fs.copyFile(
      p.join(DIRNAME, "../examples", SAMPLE_FILE),
      SAMPLE_FILE,
      fs.constants.COPYFILE_EXCL,
      function (err) {
        if (err) {
          cb(err);
        } else {
          cb(null, SAMPLE_FILE);
        }
      },
    );
  }

  /**
   * Run a single check definition. A protocol failure (connection refused,
   * timeout, ...) is reported as a failed result, not as an error.
   *
   * @param {Object} check - check definition
   * @param {String} check.protocol - one of Health.PROTOCOLS
   * @param {String} [check.name] - check name, derived from request if omitted
   * @param {Object} [check.request] - protocol-specific request definition
   * @param {Object} [check.expect] - expectation to match the result against
   * @param {Function} cb - standard cb(err, result) callback, result has
   *   name, protocol, ok, failures, result, and error properties
   */
  check(check, cb) {
    const protocol = check.protocol;
    const request = check.request || {};
    const name = check.name ?? _defaultName(protocol, request);
    const checker = CHECKERS[protocol];
    if (!checker) {
      cb(
        new Error(
          `Unknown protocol "${protocol}" (supported: ${PROTOCOLS.join(", ")})`,
        ),
      );
      return;
    }
    checker.check(request, function (err, result) {
      if (err) {
        cb(null, {
          name,
          protocol,
          ok: false,
          error: err.message,
          failures: [{ path: "", message: `check failed: ${err.message}` }],
          result: null,
        });
      } else {
        const failures = matcher.match(
          result,
          _normaliseExpect(check.expect || {}),
        );
        cb(null, {
          name,
          protocol,
          ok: failures.length === 0,
          failures,
          result,
        });
      }
    });
  }

  /**
   * Run every check in the `checks` array of a YAML expectation file, in
   * parallel.
   *
   * @param {String} file - path to the YAML expectation file
   * @param {Function} cb - standard cb(err, result) callback, result is the
   *   list of check results in file order
   */
  checkFile(file, cb) {
    const self = this;
    fs.readFile(file, "utf8", function (err, text) {
      if (err) {
        cb(err);
        return;
      }
      let checks;
      try {
        checks = _parseChecks(text);
      } catch (parseErr) {
        cb(parseErr);
        return;
      }
      async.map(checks, self.check.bind(self), cb);
    });
  }

  /**
   * Run multiple YAML expectation files, one after another. An error in one
   * file (unreadable, invalid YAML, unknown protocol) is recorded against
   * that file and does not stop the remaining files.
   *
   * @param {Array} files - paths to YAML expectation files
   * @param {Function} cb - standard cb(err, result) callback, result is a
   *   list of { file, error, results } reports
   */
  checkFiles(files, cb) {
    const self = this;
    async.mapSeries(
      files,
      function (file, next) {
        self.checkFile(file, function (err, results) {
          next(null, { file, error: err || null, results: results || [] });
        });
      },
      cb,
    );
  }
}

Health.PROTOCOLS = PROTOCOLS;

export { Health as default };
