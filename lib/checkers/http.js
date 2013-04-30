var bag = require('bagofholding'),
  validator = require('validator'),
  check = validator.check;

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
function _check(setup, cb) {
  var method = setup.method || 'get',
    opts = {
      handlers: {},
      timeout: setup.timeout
    };

  function _catchAll(result, cb) {
    var _result = {};
    try {

      if (setup.statusCodes) {
        // convert to string because check#isIn does not work with number
        for (var i = 0, ln = setup.statusCodes.length; i < ln; i += 1) {
          setup.statusCodes[i] = setup.statusCodes[i].toString();
        }
        check(result.statusCode, 'Status code ' + result.statusCode + ' does not match the expected ' + setup.statusCodes.join(', ')).isIn(setup.statusCodes);
        _result.desc = 'Status code ' + result.statusCode + ' as expected';
      }
      
      if (setup.texts) {
        setup.texts.forEach(function (text) {
          check(result.body, 'Text ' + text + ' does not exist in response body').is(new RegExp(text));
        });
        _result.desc = 'Text ' + setup.texts.join(', ') + ' exists in response body';
      }
      
      _result.status = 'OK';

    } catch (e) {
      _result.status = 'FAIL';
      _result.desc = e.message;
    }
    cb(null, _result);
  }

  opts.handlers.xxx = _catchAll;

  bag.http.request(method, setup.uri, opts, function (err, result) {
    if (err) {
      cb(null, { status: 'FAIL', desc: err.message });
    } else {
      cb(null, result);
    }
  });
}

exports.check = _check;