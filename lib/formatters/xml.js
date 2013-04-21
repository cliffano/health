var Js2Xml = require('js2xml').Js2Xml;

function format(results) {
  var js2xml = new Js2Xml('results', results);
  return js2xml.toString();
}

exports.format = format;