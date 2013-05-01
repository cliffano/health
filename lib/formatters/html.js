var bag = require('bagofholding'),
  fs = require('fs'),
  p = require('path');

/**
 * Format health check results into HTML using Bootstrap CDN.
 *
 * @param {Object} results: an array of result objects containing:
 * - name: resource name
 * - status: ok or fail
 * - uri: the resource that was checked
 * - desc: result description, e.g. failure explanation
 * - responseTime: check response time in milliseconds
 * @return {String} a HTML string
 */
function format(results) {
  var template = fs.readFileSync(p.join(__dirname, '../../views/html.jazz')).toString();
  return bag.text.apply(template, { results: results });
}

exports.format = format;