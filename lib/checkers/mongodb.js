var mongodb = require('mongodb'),
  Result = require('../result');

/**
 * Health check a mongodb resource.
 *
 * @param {Object} setup: http check setup with fields:
 * - uri: a resource URI to check
 * - timeout: MongoDB connect timeout in milliseconds
 * @param {Function} cb: standard cb(err, result) callback
 */
function check(setup, cb) {
  const TIMEOUT = 2000;
  var opts = {
      server: {
        socketOptions: {
          connectTimeoutMS: setup.timeout || TIMEOUT
        }
      }
    };
  mongodb.MongoClient.connect(setup.uri , opts, function(err, conn) {
    var result = new Result();
    if (err) {
      result.addError(err.message);
    } else {
      conn.close();
    }
    result.setStatusByStats();
    cb(null, result);
  });
}

exports.check = check;
