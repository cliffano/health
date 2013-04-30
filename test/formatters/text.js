var buster = require('buster'),
  text = require('../../lib/formatters/text');

buster.testCase('text - format', {
  'should format text properly when desc exists': function () {
    var result = text.format([{ uri: 'http://somehost', status: 'OK', desc: 'somedesc' }]);
    assert.equals(result.length, 1);
    assert.equals(result[0], 'OK | http://somehost - somedesc');
  },
  'should format text properly when name exists': function () {
    var result = text.format([{ uri: 'http://somehost', status: 'OK', name: 'someapp' }]);
    assert.equals(result.length, 1);
    assert.equals(result[0], 'OK | someapp - http://somehost');
  },
  'should exclude name and desc from text when they do not exist': function () {
    var result = text.format([{ uri: 'http://somehost', status: 'OK' }]);
    assert.equals(result.length, 1);
    assert.equals(result[0], 'OK | http://somehost');
  },
  'should format multiple texts properly': function () {
    var result = text.format([
      { name: 'someapp1', uri: 'http://somehost1', status: 'OK', desc: 'somedesc1' },
      { name: 'someapp2', uri: 'http://somehost2', status: 'FAIL', desc: 'somedesc2' }
    ]);
    assert.equals(result.length, 2);
    assert.equals(result[0], 'OK | someapp1 - http://somehost1 - somedesc1');
    assert.equals(result[1], 'FAIL | someapp2 - http://somehost2 - somedesc2');
  }
});