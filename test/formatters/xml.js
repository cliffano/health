var buster = require('buster'),
  xml = require('../../lib/formatters/xml');

buster.testCase('text - format', {
  'should format xml properly when desc exists': function () {
    var result = xml.format([{ uri: 'http://somehost', status: 'success', desc: 'somedesc', duration: 20 }]);
    assert.equals(result, '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n  <item>\n    <uri>http://somehost</uri>\n    <status>success</status>\n    <desc>somedesc</desc>\n    <duration>20</duration>\n  </item>\n</results>\n');
  },
  'should format xml properly when name exists': function () {
    var result = xml.format([{ uri: 'http://somehost', status: 'success', name: 'someapp', duration: 20 }]);
    assert.equals(result, '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n  <item>\n    <uri>http://somehost</uri>\n    <status>success</status>\n    <name>someapp</name>\n    <duration>20</duration>\n  </item>\n</results>\n');
  },
  'should exclude name and desc from xml when they do not exist': function () {
    var result = xml.format([{ uri: 'http://somehost', status: 'success', duration: 20 }]);
    assert.equals(result, '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n  <item>\n    <uri>http://somehost</uri>\n    <status>success</status>\n    <duration>20</duration>\n  </item>\n</results>\n');
  },
  'should format xml with multiple results properly': function () {
    var result = xml.format([
      { name: 'someapp1', uri: 'http://somehost1', status: 'success', successes: ['somedesc1'], duration: 20 },
      { name: 'someapp2', uri: 'http://somehost2', status: 'fail', failures: ['somedesc2'], duration: 20 }
    ]);
    assert.equals(result, '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n  <item>\n    <name>someapp1</name>\n    <uri>http://somehost1</uri>\n    <status>success</status>\n    <successes>\n      <item>somedesc1</item>\n    </successes>\n    <duration>20</duration>\n  </item>\n  <item>\n    <name>someapp2</name>\n    <uri>http://somehost2</uri>\n    <status>fail</status>\n    <failures>\n      <item>somedesc2</item>\n    </failures>\n    <duration>20</duration>\n  </item>\n</results>\n');
  }
});