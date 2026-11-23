"use strict";
/**
 * DNS checker, built on the core dns module.
 *
 * @module checkers/dns
 */
import dns from "dns";

import util from "../util.js";

const DEFAULT_TIMEOUT = 5000;

/**
 * Resolve DNS records for a name.
 *
 * @param {Object} req - request definition
 * @param {String} req.name - name to resolve
 * @param {String} [req.rrtype=A] - A, AAAA, CNAME, MX, NS, TXT, SOA, SRV, PTR, CAA
 * @param {String|Array} [req.server] - custom DNS server(s), e.g. 8.8.8.8
 * @param {Number} [req.timeout=5000] - timeout in milliseconds
 * @param {Function} cb - standard cb(err, result) callback
 */
function check(req, cb) {
  if (!req.name) {
    cb(new Error('dns check requires "name"'));
    return;
  }
  const rrtype = (req.rrtype || "A").toUpperCase();
  const resolver = new dns.Resolver({
    timeout: req.timeout ?? DEFAULT_TIMEOUT,
  });
  if (req.server) {
    try {
      resolver.setServers(
        Array.isArray(req.server) ? req.server : [req.server],
      );
    } catch (err) {
      cb(err);
      return;
    }
  }

  const start = performance.now();
  resolver.resolve(req.name, rrtype, function (err, raw) {
    if (err) {
      cb(err);
      return;
    }
    // TXT records arrive as arrays of chunks, join each record's chunks
    const records =
      rrtype === "TXT" ? raw.map((chunks) => chunks.join("")) : raw;
    cb(null, {
      name: req.name,
      rrtype,
      records,
      count: Array.isArray(records) ? records.length : 1,
      responseTime: util.elapsed(start),
    });
  });
}

export default { check };
