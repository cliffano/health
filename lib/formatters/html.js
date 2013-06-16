var _ = require('lodash'),
  async = require('async'),
  bag = require('jazz'),
  fs = require('fs'),
  jazz = require('jazz'),
  p = require('path');

/**
 * Format health check results into HTML using Bootstrap CDN.
 *
 * @param {Object} results: an array of result objects containing:
 * - name: resource name
 * - status: ok or fail
 * - uri: the resource that was checked
 * - desc: result description, e.g. failure explanation
 * - duration: check response time in milliseconds
 * @return {String} a HTML string
 */
function format(results) {

  function _escape(data, cb) {
    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }
    data = data.replace(/\r?\n/g, '<br/>');
    data = _.escape(data);
    cb(data);
  }

  var text = fs.readFileSync(p.join(__dirname, '../../views/html.jazz')).toString(),
    template = jazz.compile(text),
    params = { results: results, escape: _escape },
    applied;

  async.whilst(
    function () { return applied === undefined; },
    function (cb) {
      template.process(params, function (result) {
        applied = result;
      });
      setTimeout(cb, 1);
    },
    function (err) {
    }
  );

  return applied;
}

exports.format = format;