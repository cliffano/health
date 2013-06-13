var buster = require('buster'),
  checker = require('../../lib/checkers/mongodb'),
  mongodb = require('mongodb');

buster.testCase('mongodb - check', {
  setUp: function () {
    this.mockMongoClient = this.mock(mongodb.MongoClient);
  },
  'should have fail status when an error occurs while connecting to MongoDB': function (done) {
    this.mockMongoClient.expects('connect').withArgs('mongodb://somehost:27017', {
        server: {
          socketOptions: {
            connectTimeoutMS: 2000
          }
        }
      }).callsArgWith(2, new Error('some error'));
    var setup = { uri: 'mongodb://somehost:27017' };
    function cb(err, result) {
      assert.isNull(err);
      assert.equals(result.status, 'error');
      assert.equals(result.errors, ['some error']);
      done();
    }
    checker.check(setup, cb);
  },
  'should close connection and pass result with ok status when connection is successful': function (done) {
    var stubClose = this.stub(),
      mockConnection = { close: stubClose };
    this.mockMongoClient.expects('connect').withArgs('mongodb://somehost:27017', {
      server: {
        socketOptions: {
          connectTimeoutMS: 2000
        }
      }
    }).callsArgWith(2, null, mockConnection);
    var setup = { uri: 'mongodb://somehost:27017' };
    function cb(err, result) {
      assert.isTrue(stubClose.calledWith());
      assert.isNull(err);
      assert.equals(result.status, 'ok');
      done();
    }
    checker.check(setup, cb);
  },
  'should set connect timeout server socket option when setup contains timeout': function (done) {
    var stubClose = this.stub(),
      mockConnection = { close: stubClose };
    this.mockMongoClient.expects('connect').withArgs('mongodb://somehost:27017', {
      server: {
        socketOptions: {
          connectTimeoutMS: 1234
        }
      }
    }).callsArgWith(2, null, mockConnection);
    var setup = { uri: 'mongodb://somehost:27017', timeout: 1234 };
    function cb(err, result) {
      assert.isTrue(stubClose.calledWith());
      assert.isNull(err);
      assert.equals(result.status, 'ok');
      done();
    }
    checker.check(setup, cb);
  }
});