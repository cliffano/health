var buster = require('buster'),
  checker = require('../../lib/checkers/file'),
  fs = require('fs');

buster.testCase('file - check', {
  setUp: function () {
    this.mockFs = this.mock(fs);
  }/*,
  'should have fail status when an error occurs while stat-ing the file': function (done) {
    this.mockFs.expects('stat').once().withExactArgs('/tmp').callsArgWith(1, new Error('some error'));
    var setup = { uri: 'file:///tmp' };
    function cb(err, result) {
      assert.isNull(err);
      assert.equals(result.isError());
      assert.equals(result.getErrors(), ['some error']);
      done();
    }
    checker.check(setup, cb);
  },
  'should have success status when there is no error while stat-ing the file': function () {
    var mockStat = {};
    this.mockFs.expects('stat').once().withExactArgs('/tmp').callsArgWith(1, null, mockStat);
    var setup = { uri: 'file:///tmp' };
    function cb(err, result) {
      assert.isNull(err);
      assert.equals(result.isSuccess());
      done();
    }
    checker.check(setup, cb);
  },
  'should have fail status when mode does not match expectation': function (done) {

  },
  'should have success status when mode matches expectation': function (done) {

  }*/
});