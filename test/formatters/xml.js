var buster = require('buster'),
  xml = require('../../lib/formatters/xml');

buster.testCase('text - format', {
  'should format xml properly when desc exists': function () {
    var result = xml.format([{ uri: 'http://somehost', status: 'OK', desc: 'somedesc' }]);
    assert.equals(result, '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n  <item>\n    <uri>http://somehost</uri>\n    <status>OK</status>\n    <desc>somedesc</desc>\n  </item>\n</results>\n');
  },
  'should exclude desc from xml when it does not exist': function () {
    var result = xml.format([{ uri: 'http://somehost', status: 'OK' }]);
    assert.equals(result, '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n  <item>\n    <uri>http://somehost</uri>\n    <status>OK</status>\n  </item>\n</results>\n');
  },
  'should format xml with multiple results properly': function () {
    var result = xml.format([
      { uri: 'http://somehost1', status: 'OK', desc: 'somedesc1' },
      { uri: 'http://somehost2', status: 'FAIL', desc: 'somedesc2' }
    ]);
    assert.equals(result, '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n  <item>\n    <uri>http://somehost1</uri>\n    <status>OK</status>\n    <desc>somedesc1</desc>\n  </item>\n  <item>\n    <uri>http://somehost2</uri>\n    <status>FAIL</status>\n    <desc>somedesc2</desc>\n  </item>\n</results>\n');
  }
});