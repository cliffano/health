/*jshint esnext: true */
var bag = require('bagofrequest'),
  Result = require('../result'),
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

  const CHECKS = [ _checkStatusCodes, _checkTexts ];

  var method = setup.method || 'get',
    opts = {
      handlers: {},
      timeout: setup.timeout
    };

  function _catchAll(response, cb) {
    var result = new Result();

    CHECKS.forEach(function (check) {
      check(result, response, setup);
    });

    result.addInfo('headers', response.headers);
    result.addInfo('body', response.body);
    cb(null, result);
  }

  opts.handlers.xxx = _catchAll;

  bag.request(method, setup.uri, opts, function (err, result) {
    result = result || new Result();
    if (err) {
      result.addError(err.message);
    }
    result.setStatusByStats();
    cb(null, result);
  });
}

function _checkStatusCodes(result, response, setup) {
  try {
    if (setup.statusCodes) {
      // convert to string because check#isIn does not work with number
      for (var i = 0, ln = setup.statusCodes.length; i < ln; i += 1) {
        setup.statusCodes[i] = setup.statusCodes[i].toString();
      }
      validator.check(response.statusCode, 'Status code ' + response.statusCode + ' does not match the expected ' + setup.statusCodes.join(', ')).isIn(setup.statusCodes);
      result.addSuccess('Status code ' + response.statusCode + ' as expected');
    }
  } catch (e) {
    result.addFailure(e.message);
  }
}

function _checkTexts(result, response, setup) {
  if (setup.texts) {
    setup.texts.forEach(function (text) {
      try {
        validator.check(response.body, 'Text ' + text + ' does not exist in response body').is(new RegExp(text));
        result.addSuccess('Text ' + text + ' exists in response body');
      } catch (e) {
        result.addFailure(e.message);
      }
    });
  }
}

exports.check = check;