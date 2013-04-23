var buster = require('buster'),
  checker = require('../../lib/checkers/https');

buster.testCase('https', {
  'should have check method': function () {
    assert.defined(checker.check);
  }
});