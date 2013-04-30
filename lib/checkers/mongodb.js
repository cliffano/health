/*jshint esnext: true */
var mongodb = require('mongodb');

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
    var result = {};
    if (err) {
      result.status = 'FAIL';
      result.desc = err.message;
    } else {
      conn.close();
      result.status = 'OK';
    }
    cb(null, result);
  });
}

exports.check = check;