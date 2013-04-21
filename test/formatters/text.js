var buster = require('buster'),
  text = require('../../lib/formatters/text');

buster.testCase('text - format', {
  'should format text properly when desc exists': function () {
    var result = text.format([{ uri: 'http://somehost', status: 'OK', desc: 'somedesc' }]);
    assert.equals(result.length, 1);
    assert.equals(result[0], 'OK | http://somehost - somedesc');
  },
  'should exclude desc from text when it does not exist': function () {
    var result = text.format([{ uri: 'http://somehost', status: 'OK' }]);
    assert.equals(result.length, 1);
    assert.equals(result[0], 'OK | http://somehost');
  },
  'should format multiple texts properly': function () {
    var result = text.format([
      { uri: 'http://somehost1', status: 'OK', desc: 'somedesc1' },
      { uri: 'http://somehost2', status: 'FAIL', desc: 'somedesc2' }
    ]);
    assert.equals(result.length, 2);
    assert.equals(result[0], 'OK | http://somehost1 - somedesc1');
    assert.equals(result[1], 'FAIL | http://somehost2 - somedesc2');
  }
});