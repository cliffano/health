var buster = require('buster'),
  checker = require('../../lib/checkers/file'),
  fs = require('fs');

buster.testCase('file - check', {
  setUp: function () {
    this.mockFs = this.mock(fs);
    this.mockStats = this.mock(fs.Stats);
  },
  'should have fail status when an error occurs while stat-ing the file': function (done) {
    this.mockFs.expects('lstat').once().withArgs('/tmp').callsArgWith(1, new Error('some error'));
    var setup = { uri: 'file:///tmp' };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isError());
      assert.equals(result.getErrors(), ['some error']);
      done();
    }
    checker.check(setup, cb);
  },
  'should have success status when there is no error while stat-ing the file': function (done) {
    this.mockFs.expects('lstat').once().withArgs('/tmp').callsArgWith(1, null, this.mockStats);
    var setup = { uri: 'file:///tmp' };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isSuccess());
      done();
    }
    checker.check(setup, cb);
  },
  'should have fail status when mode does not match expectation': function (done) {
    this.mockStats.mode = 98765;
    this.mockFs.expects('lstat').once().withArgs('/tmp').callsArgWith(1, null, this.mockStats);
    var setup = { uri: 'file:///tmp', mode: '777' };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isFail());
      assert.equals(result.getFailures(), ['Mode 715 does not match the expected 777']);
      done();
    }
    checker.check(setup, cb);
  },
  'should have success status when mode matches expectation': function (done) {
    this.mockStats.mode = 16895;
    this.mockFs.expects('lstat').once().withArgs('/tmp').callsArgWith(1, null, this.mockStats);
    var setup = { uri: 'file:///tmp', mode: '777' };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isSuccess());
      assert.equals(result.getSuccesses(), ['Mode 777 as expected']);
      done();
    }
    checker.check(setup, cb);
  }
});