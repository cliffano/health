var buster = require('buster'),
  xml = require('../../lib/formatters/xml');

buster.testCase('text - format', {
  'should format xml properly when desc exists': function () {
    var result = xml.format([{ uri: 'http://somehost', status: 'ok', desc: 'somedesc', responseTime: 20 }]);
    assert.equals(result, '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n  <item>\n    <uri>http://somehost</uri>\n    <status>ok</status>\n    <desc>somedesc</desc>\n    <responseTime>20</responseTime>\n  </item>\n</results>\n');
  },
  'should format xml properly when name exists': function () {
    var result = xml.format([{ uri: 'http://somehost', status: 'ok', name: 'someapp', responseTime: 20 }]);
    assert.equals(result, '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n  <item>\n    <uri>http://somehost</uri>\n    <status>ok</status>\n    <name>someapp</name>\n    <responseTime>20</responseTime>\n  </item>\n</results>\n');
  },
  'should exclude name and desc from xml when they do not exist': function () {
    var result = xml.format([{ uri: 'http://somehost', status: 'ok', responseTime: 20 }]);
    assert.equals(result, '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n  <item>\n    <uri>http://somehost</uri>\n    <status>ok</status>\n    <responseTime>20</responseTime>\n  </item>\n</results>\n');
  },
  'should format xml with multiple results properly': function () {
    var result = xml.format([
      { name: 'someapp1', uri: 'http://somehost1', status: 'ok', desc: 'somedesc1', responseTime: 20 },
      { name: 'someapp2', uri: 'http://somehost2', status: 'fail', desc: 'somedesc2', responseTime: 20 }
    ]);
    assert.equals(result, '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n  <item>\n    <name>someapp1</name>\n    <uri>http://somehost1</uri>\n    <status>ok</status>\n    <desc>somedesc1</desc>\n    <responseTime>20</responseTime>\n  </item>\n  <item>\n    <name>someapp2</name>\n    <uri>http://somehost2</uri>\n    <status>fail</status>\n    <desc>somedesc2</desc>\n    <responseTime>20</responseTime>\n  </item>\n</results>\n');
  }
});