var bag = require('bagofrequest'),
  checker = require('../checker'),
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

  var method = setup.method || 'get',
    opts = {
      handlers: {},
      timeout: setup.timeout
    };

  function _catchAll(response, cb) {
    var result = new Result();

    checker.checkAttribute('statusCode', setup, _checkStatusCode(response.statusCode), result);
    checker.checkAttribute('text', setup, _checkText(response.body), result);

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

function _checkStatusCode(actual) {
  return function (expected) {
    if (validator.matches(actual, new RegExp(expected))) {
      return 'Status code ' + expected + ' as expected';
    } else {
      throw new Error('Status code ' + actual + ' does not match the expected ' + expected);
    }
  };
}

function _checkText(actual) {
  return function (expected) {
    if (validator.matches(actual, new RegExp(expected))) {
      return 'Text ' + expected + ' exists in response body';
    } else {
      throw new Error('Text ' + expected + ' does not exist in response body');
    }
  };
}

exports.check = check;
