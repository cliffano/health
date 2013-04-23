var buster = require('buster'),
  checker = require('../../lib/checkers/mongodb'),
  mongodb = require('mongodb');

buster.testCase('mongodb - check', {
  setUp: function () {
    this.mockMongoClient = this.mock(mongodb.MongoClient);
  },
  'should have FAIL status when an error occurs while connecting to MongoDB': function (done) {
    this.mockMongoClient.expects('connect').withArgs('mongodb://somehost:27017').callsArgWith(1, new Error('some error'));
    var setup = { uri: 'mongodb://somehost:27017' };
    function cb(err, result) {
      assert.isNull(err);
      assert.equals(result.status, 'FAIL');
      assert.equals(result.uri, 'mongodb://somehost:27017');
      assert.equals(result.desc, 'some error');
      done();
    }
    checker.check(setup, cb);
  },
  'should close connection and pass result with OK status when connection is successful': function (done) {
    var stubClose = this.stub(),
      mockConnection = { close: stubClose };
    this.mockMongoClient.expects('connect').withArgs('mongodb://somehost:27017').callsArgWith(1, null, mockConnection);
    var setup = { uri: 'mongodb://somehost:27017' };
    function cb(err, result) {
      assert.isTrue(stubClose.calledWith());
      assert.isNull(err);
      assert.equals(result.status, 'OK');
      assert.equals(result.uri, 'mongodb://somehost:27017');
      done();
    }
    checker.check(setup, cb);
  }
});