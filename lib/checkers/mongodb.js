"use strict";
import { MongoClient } from "mongodb";
import Result from "../result.js";

/**
 * Health check a mongodb resource.
 *
 * @param {Object} setup: http check setup with fields:
 * - uri: a resource URI to check
 * - timeout: MongoDB connect timeout in milliseconds
 * @param {Function} cb: standard cb(err, result) callback
 */
function check(setup, cb) {
  const TIMEOUT = 2000;
  const opts = {
    connectTimeoutMS: setup.timeout || TIMEOUT,
  };

  MongoClient.connect(setup.uri, opts).then(
    function (client) {
      const result = new Result();
      client.close();
      result.setStatusByStats();
      cb(null, result);
    },
    function (err) {
      const result = new Result();
      result.addError(err.message);
      result.setStatusByStats();
      cb(null, result);
    },
  );
}

const exports = {
  check: check,
};

export { exports as default };
