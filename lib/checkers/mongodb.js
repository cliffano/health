var mongodb = require('mongodb');

/**
 * Health check a mongodb resource.
 *
 * @param {Object} setup: http check setup with fields:
 * - uri: a resource URI
 * - TODO databases: an array of database names that should exist, OK when all databases exist
 * @param {Function} cb: standard cb(err, result) callback
 */
function check(setup, cb) {
  var result = { uri: setup.uri };
  mongodb.MongoClient.connect(setup.uri , function(err, conn) {
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