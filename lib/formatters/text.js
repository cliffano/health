var util = require('util');

function format(results) {
  var texts = [];

  results.forEach(function (result) {
    texts.push(util.format('%s | %s%s', result.status, result.uri, result.desc ? ' - ' + result.desc : ''));
  });

  return texts;
}

exports.format = format;