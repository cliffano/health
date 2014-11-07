var buster = require('buster-node'),
  checker = require('../../lib/checkers/https'),
  referee = require('referee'),
  assert = referee.assert;

buster.testCase('https', {
  setUp: function () {
    this.mock({});
  },
  'should have check method': function () {
    assert.defined(checker.check);
  }
});