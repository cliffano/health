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
    fail: 'red'
  };
  var texts = [];

  results.forEach(function (result) {
    texts.push(util.format(
      '%s | %s%s - %dms%s',
      result.status[COLORS[result.status] || 'grey'],
      result.name ? result.name + ' - ' : '',
      result.uri.cyan,
      result.duration,
      result.desc ? ' - ' + result.desc : ''
    ));
  });

  return texts;
}

exports.format = format;