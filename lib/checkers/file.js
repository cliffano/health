/*jshint esnext: true */
var fs = require('fs'),
  Result = require('../result'),
  validator = require('validator');

/**
 * Health check a file resource.
 *
 * @param {Object} setup: file check setup with fields:
 * - uri: a resource URI to check
 * - mode: a 3-digit file mode, e.g. 777, 644
 * @param {Function} cb: standard cb(err, result) callback
 */
function check(setup, cb) {

  const CHECKS = [ _checkMode ];

  fs.lstat(setup.uri.replace(/^file\:\/\//, ''), function (err, stats) {
    var result = new Result();

    if (err) {
      result.addError(err.message);
    } else {
      CHECKS.forEach(function (check) {
        check(result, stats, setup);
      });
    }

    result.setStatusByStats();
    cb(null, result);
  });
}

function _checkMode(result, stats, setup) {
  try {
    if (setup.mode) {
      var modeString = parseInt(stats.mode.toString(8), 10).toString(),
        mode = modeString.slice(modeString.length - 3, modeString.length);
      validator.check(mode, 'Mode ' + mode + ' does not match the expected ' + setup.mode).equals(setup.mode);
      result.addSuccess('Mode ' + mode + ' as expected');
    }
  } catch (e) {
    result.addFailure(e.message);
  }
}

exports.check = check;