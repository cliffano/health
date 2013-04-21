var bag = require('bagofholding'),
  validator = require('validator'),
  check = validator.check;

/**
 * Check 
 *
 * @param {Object} setup: http check setup with fields:
 * - uri:
 * - statusCodes: an array of acceptable status codes, either one matches is OK
 * - texts: an array of texts that should exist in the response body, all of them should exist
 * @param {Function} cb: standard cb(err, result) callback
 */
function _check(setup, cb) {
  var method = setup.method || 'get',
    opts = { handlers: {} };

  function _catchAll(result, cb) {
    var _result = { uri: setup.uri };
    try {

      if (setup.statusCodes) {
        check(result.statusCode.toInt(), 'Status code ' + result.statusCode + ' does not match the expected ' + setup.statusCodes.join(', ')).isIn(setup.statusCodes);
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
      cb(null, { uri: setup.uri, status: 'FAIL', desc: err.message });
    } else {
      cb(null, result);
    }
  });
}

exports.check = _check;