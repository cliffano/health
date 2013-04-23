/*jshint esnext: true */
var mongodb = require('mongodb');

/**
 * Health check a mongodb resource.
 *
 * @param {Object} setup: http check setup with fields:
 * - uri: a resource URI
 * - connectTimeout: MongoDB connect timeout in milliseconds
 * - TODO databases: an array of database names that should exist, OK when all databases exist
 * @param {Function} cb: standard cb(err, result) callback
 */
function check(setup, cb) {
  const CONNECT_TIMEOUT = 2000;
  var result = { uri: setup.uri },
    opts = {
      server: {
        socketOptions: {
          connectTimeoutMS: setup.connectTimeout || CONNECT_TIMEOUT
        }
      }
    };
  mongodb.MongoClient.connect(setup.uri , opts, function(err, conn) {
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