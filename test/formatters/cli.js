var buster = require('buster-node'),
  cli = require('../../lib/formatters/cli'),
  Result = require('../../lib/result'),
  referee = require('referee'),
  assert = referee.assert;

buster.testCase('cli - format', {
  setUp: function () {
    this.mock({});
  },
  'should format cli line properly when desc exists': function () {
    var result = new Result();
    result.setUri('http://somehost');
    result.addSuccess('somesuccess');
    result.setDuration(20);
    result.success();

    var out = cli.format([ result ]);
    assert.equals(out, [
      'success'.green + ' - ' + 'http://somehost'.cyan + ' - 20ms',
      ' * somesuccess',
      ''
    ]);
  },
  'should format cli line properly when name exists': function () {
    var result = new Result();
    result.setUri('http://somehost');
    result.setName('someapp');
    result.setDuration(20);
    result.success();

    var out = cli.format([ result ]);
    assert.equals(out, [
      'success'.green + ' - someapp - ' + 'http://somehost'.cyan + ' - 20ms',
      ''
    ]);
  },
  'should colourise status and uri and exclude name and desc from cli line when they do not exist': function () {
    var result = new Result();
    result.setUri('http://somehost');
    result.setDuration(20);
    result.success();

    var out = cli.format([ result ]);
    assert.equals(out, [
      'success'.green + ' - ' + 'http://somehost'.cyan + ' - 20ms',
      ''
    ]);
  }
});