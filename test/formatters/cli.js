var buster = require('buster'),
  cli = require('../../lib/formatters/cli'),
  Result = require('../../lib/result');

buster.testCase('cli - format', {
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