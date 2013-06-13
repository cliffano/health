/*jshint esnext: true */
var bag = require('bagofrequest'),
  validator = require('validator');

/**
 * Health check a http resource.
 *
 * @param {Object} setup: http check setup with fields:
 * - uri: a resource URI to check
 * - statusCodes: an array of acceptable status codes, OK when result matches any of these codes
 * - texts: an array of texts that should exist in the response body, OK when all texts exist
 * - timeout: request timeout in milliseconds, if unspecified defaults to bagofholding's default timeout
 * @param {Function} cb: standard cb(err, result) callback
 */
function check(setup, cb) {

  const CHECKERS = [ _checkStatusCodes, _checkTexts ];

  var method = setup.method || 'get',
    opts = {
      handlers: {},
      timeout: setup.timeout
    };

  function _catchAll(result, cb) {
    var status,
      successes = [],
      failures = [];

    CHECKERS.forEach(function (checker) {
      var _result = checker(result, setup);
      successes = successes.concat(_result.successes);
      failures = failures.concat(_result.failures);
    });

    cb(null, {
      status: (failures.length > 0) ? 'fail' : 'success',
      successes: successes,
      failures: failures });
  }

  opts.handlers.xxx = _catchAll;

  bag.request(method, setup.uri, opts, function (err, result) {
    if (err) {
      cb(null, { status: 'error', errors: [err.message] });
    } else {
      cb(null, result);
    }
  });
}

function _checkStatusCodes(result, setup) {
  var successes = [], failures = [];
  try {
    if (setup.statusCodes) {
      // convert to string because check#isIn does not work with number
      for (var i = 0, ln = setup.statusCodes.length; i < ln; i += 1) {
        setup.statusCodes[i] = setup.statusCodes[i].toString();
      }
      validator.check(result.statusCode, 'Status code ' + result.statusCode + ' does not match the expected ' + setup.statusCodes.join(', ')).isIn(setup.statusCodes);
      successes.push('Status code ' + result.statusCode + ' as expected');
    }
  } catch (e) {
    failures.push(e.message);
  }
  return { successes: successes, failures: failures };
}

function _checkTexts(result, setup) {
  var successes = [], failures = [];
  if (setup.texts) {
    setup.texts.forEach(function (text) {
      try {
        validator.check(result.body, 'Text ' + text + ' does not exist in response body').is(new RegExp(text));
        successes.push('Text ' + text + ' exists in response body');
      } catch (e) {
        failures.push(e.message);
      }
    });
  }
  return { successes: successes, failures: failures };
}

exports.check = check;