var util = require('util');

/**
 * Format health check results into an array of texts.
 *
 * @param {Object} results: an array of result objects containing:
 * - status: OK or FAIL
 * - uri: the resource that was checked
 * - desc: result description, e.g. failure explanation
 * @return {Array} an array of result strings
 */
function format(results) {
  var texts = [];

  results.forEach(function (result) {
    texts.push(util.format('%s | %s%s', result.status, result.uri, result.desc ? ' - ' + result.desc : ''));
  });

  return texts;
}

exports.format = format;