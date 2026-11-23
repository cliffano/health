"use strict";
import fs from "fs";
import validator from "validator";
import checker from "../checker.js";
import Result from "../result.js";

/**
 * Health check a file resource.
 *
 * @param {Object} setup: file check setup with fields:
 * - uri: a resource URI to check
 * - mode: a 3-digit file mode, e.g. 777, 644
 * @param {Function} cb: standard cb(err, result) callback
 */
function check(setup, cb) {
  fs.lstat(setup.uri.replace(/^file:\/\//, ""), function (err, stats) {
    const result = new Result();

    if (err) {
      result.addError(err.message);
    } else {
      const modeString = parseInt(stats.mode.toString(8), 10).toString();
      const mode = modeString.slice(modeString.length - 3, modeString.length);
      checker.checkAttribute("mode", setup, _checkMode(mode), result);
    }

    result.setStatusByStats();
    cb(null, result);
  });
}

function _checkMode(actual) {
  return function (expected) {
    if (validator.matches(actual, new RegExp(expected))) {
      return "Mode " + actual + " as expected";
    } else {
      throw new Error(
        "Mode " + actual + " does not match the expected " + expected,
      );
    }
  };
}

const exports = {
  check: check,
};

export { exports as default };
