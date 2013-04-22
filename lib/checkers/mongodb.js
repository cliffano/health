var mongodb = require('mongodb');

function check(setup, cb) {
  var result = { uri: setup.uri };
  mongodb.MongoClient.connect(setup.uri , function(err, db) {
    if (err) {
      result.status = 'FAIL';
      result.desc = err.message;
    } else {
      db.close();
      result.status = 'OK';
    }
    cb(null, result);
  });
}

exports.check = check;