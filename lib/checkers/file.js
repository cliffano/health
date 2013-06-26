var fs = require('fs'),
  Result = require('../result');

function check(setup, cb) {
  fs.lstat(setup.uri.replace(/^file\:\/\//, ''), function (err, stats) {
    var result = new Result();
    if (err) {
      result.addError(err.message);
    } else {
      var modeString = parseInt(stats.mode.toString(8), 10).toString();
      var mode = modeString.slice(modeString.length - 3, modeString.length);
    }
    result.setStatusByStats();
    cb(null, result);
  });
}
/*
function _checkMode(result, stats, setup) {
  var modeString = parseInt(stats.mode.toString(8), 10).toString(),
    mode = modeString.slice(modeString.length - 3, modeString.length);

}
*/
exports.check = check;