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
  var texts = [];

  results.forEach(function (result) {

    texts.push(util.format(
      '%s - %s%s - %dms',
      result.getStatus(),
      result.getName() ? result.getName() + ' - ' : '',
      result.getUri(),
      result.getDuration()
    ));
    
    var messages = [].concat(result.getSuccesses(), result.getFailures(), result.getErrors());
    messages.forEach(function (message) {
      texts.push(util.format(' * %s', message));
    });
    
  });

  return texts;
}

exports.format = format;
