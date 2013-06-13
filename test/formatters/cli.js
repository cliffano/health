var buster = require('buster'),
  cli = require('../../lib/formatters/cli');

buster.testCase('cli - format', {
  'should format cli line properly when desc exists': function () {
    var result = cli.format([{ uri: 'http://somehost', status: 'ok', desc: 'somedesc', duration: 20 }]);
    assert.equals(result.length, 1);
    assert.equals(result[0], 'ok'.green + ' | ' + 'http://somehost'.cyan + ' - 20ms - somedesc');
  },
  'should format cli line properly when name exists': function () {
    var result = cli.format([{ uri: 'http://somehost', status: 'ok', name: 'someapp', duration: 20 }]);
    assert.equals(result.length, 1);
    assert.equals(result[0], 'ok'.green + ' | someapp - ' + 'http://somehost'.cyan + ' - 20ms');
  },
  'should colourise status and uri and exclude name and desc from cli line when they do not exist': function () {
    var result = cli.format([{ uri: 'http://somehost', status: 'ok', duration: 20 }]);
    assert.equals(result.length, 1);
    assert.equals(result[0], 'ok'.green + ' | ' + 'http://somehost'.cyan + ' - 20ms');
  },
  'should colourise unknown status with grey colour': function () {
    var result = cli.format([{ uri: 'http://somehost', status: 'unknown', duration: 20 }]);
    assert.equals(result.length, 1);
    assert.equals(result[0], 'unknown'.grey + ' | ' + 'http://somehost'.cyan + ' - 20ms');
  }
});