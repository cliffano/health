/*jshint esnext: true */
var colors = require('colors'),
  util = require('util');

/**
 * Format health check results into an array of texts.
 *
 * @param {Object} results: an array of result objects containing:
 * - name: resource name
 * - status: ok or fail
 * - uri: the resource that was checked
 * - desc: result description, e.g. failure explanation
 * - duration: check response time in milliseconds
 * @return {Array} an array of result strings
 */
function format(results) {
  const COLORS = {
    ok: 'green',
    fail: 'red',
    error: 'red'
  };
  const TYPES = [
    'successes',
    'failures',
    'errors'
  ];

  var texts = [];

  results.forEach(function (result) {
    texts.push(util.format(
      '%s - %s%s - %dms',
      result.status[COLORS[result.status] || 'grey'],
      result.name ? result.name + ' - ' : '',
      result.uri.cyan,
      result.duration
    ));
    TYPES.forEach(function (type) {
      if (result[type]) {
        result[type].forEach(function (message) {
          texts.push(util.format(' * %s', message));
        });
      }
    });
    texts.push('');
  });

  return texts;
}

exports.format = format;