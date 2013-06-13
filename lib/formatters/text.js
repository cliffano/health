/*jshint esnext: true */
var util = require('util');

/**
 * Format health check results into an array of texts.
 *
 * @param {Object} results: an array of result objects containing:
 * - name: resource name
 * - status: ok or fail
 * - uri: the resource that was checked
 * - desc: result description, e.g. failure explanation
 * - responseTime: check response time in milliseconds
 * @return {Array} an array of result strings
 */
function format(results) {
  const TYPES = [
    'successes',
    'failures',
    'errors'
  ];

  var texts = [];

  results.forEach(function (result) {
    texts.push(util.format(
      '%s - %s%s - %dms',
      result.status,
      result.name ? result.name + ' - ' : '',
      result.uri,
      result.duration
    ));
    TYPES.forEach(function (type) {
      if (result[type]) {
        result[type].forEach(function (message) {
          texts.push(util.format(' * %s', message));
        });
      }
    });
  });

  return texts;
}

exports.format = format;