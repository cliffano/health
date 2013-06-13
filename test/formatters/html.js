var buster = require('buster'),
  fs = require('fs'),
  text = require('../../lib/formatters/html');

buster.testCase('html - format', {
  setUp: function () {
    this.mockFs = this.mock(fs);
  },
  'should format text properly when desc exists': function () {
    this.mockFs.expects('readFileSync').returns(new Buffer('sometemplate'));
    var result = text.format([{ uri: 'http://somehost', status: 'ok', desc: 'somedesc', duration: 20 }]);
    assert.equals(result, 'sometemplate');
  }
});