var Js2Xml = require('js2xml').Js2Xml;

/**
 * Format health check results into XML.
 *
 * @param {Object} results: an array of result objects containing:
 * - status: OK or FAIL
 * - uri: the resource that was checked
 * - desc: result description, e.g. failure explanation
 * @return {String} an XML string
 */
function format(results) {
  var js2xml = new Js2Xml('results', results);
  return js2xml.toString();
}

exports.format = format;