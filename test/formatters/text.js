var buster = require('buster'),
  Result = require('../../lib/result'),
  text = require('../../lib/formatters/text');

buster.testCase('text - format', {
  'should format text properly when desc exists': function () {
    var result = new Result();
    result.setUri('http://somehost');
    result.setDescription('somedesc');
    result.setDuration(20);
    result.success();

    var out = text.format([ result ]);
    assert.equals(out, [
      'success - http://somehost - 20ms'
    ]);
  },
  'should format text properly when name exists': function () {
    var result = new Result();
    result.setUri('http://somehost');
    result.setName('someapp');
    result.setDuration(20);
    result.success();

    var out = text.format([ result ]);
    assert.equals(out, [
      'success - someapp - http://somehost - 20ms'
    ]);
  },
  'should exclude name and desc from text when they do not exist': function () {
    var result = new Result();
    result.setUri('http://somehost');
    result.setDuration(20);
    result.success();

    var out = text.format([ result ]);
    assert.equals(out, [
      'success - http://somehost - 20ms'
    ]);
  },
  'should format multiple texts properly': function () {
    var result1 = new Result();
    var result2 = new Result();

    result1.setUri('http://somehost1');
    result1.setName('someapp1');
    result1.addSuccess('somedesc1');
    result1.setDuration(20);
    result1.success();

    result2.setUri('http://somehost2');
    result2.setName('someapp2');
    result2.addFailure('somedesc2');
    result2.setDuration(20);
    result2.fail();

    var out = text.format([ result1, result2 ]);
    assert.equals(out, [
      'success - someapp1 - http://somehost1 - 20ms',
      ' * somedesc1',
      'fail - someapp2 - http://somehost2 - 20ms',
      ' * somedesc2'
    ]);
  }
});