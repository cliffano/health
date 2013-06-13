var buster = require('buster'),
  text = require('../../lib/formatters/text');

buster.testCase('text - format', {
  'should format text properly when desc exists': function () {
    var result = text.format([{ uri: 'http://somehost', status: 'ok', desc: 'somedesc', duration: 20 }]);
    assert.equals(result, [
      'ok - http://somehost - 20ms'
      ]);
  },
  'should format text properly when name exists': function () {
    var result = text.format([{ uri: 'http://somehost', status: 'ok', name: 'someapp', duration: 20 }]);
    assert.equals(result.length, 1);
    assert.equals(result, [
      'ok - someapp - http://somehost - 20ms'
    ]);
  },
  'should exclude name and desc from text when they do not exist': function () {
    var result = text.format([{ uri: 'http://somehost', status: 'ok', duration: 20 }]);
    assert.equals(result, [
      'ok - http://somehost - 20ms'
    ]);
  },
  'should format multiple texts properly': function () {
    var result = text.format([
      { name: 'someapp1', uri: 'http://somehost1', status: 'ok', successes: ['somedesc1'], duration: 20 },
      { name: 'someapp2', uri: 'http://somehost2', status: 'fail', failures: ['somedesc2'], duration: 20 }
    ]);
    assert.equals(result, [
      'ok - someapp1 - http://somehost1 - 20ms',
      ' * somedesc1',
      'fail - someapp2 - http://somehost2 - 20ms',
      ' * somedesc2'
    ]);
  }
});