var bag = require('bagofrequest'),
  buster = require('buster'),
  checker = require('../../lib/checkers/http');

buster.testCase('http - check', {
  'should have fail status when an error occurs while sending the request': function (done) {
    function mockRequest(method, url, opts, cb) {
      cb(new Error('some error'));
    }
    this.stub(bag, 'request', mockRequest);
    var setup = { uri: 'http://somehost' };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isError());
      assert.equals(result.getErrors(), ['some error']);
      done();
    }
    checker.check(setup, cb);
  },
  'should have success status when request is successful and there is no checking involved': function (done) {
    function mockRequest(method, url, opts, cb) {
      assert.equals(opts.timeout, 8000);
      opts.handlers.xxx({ statusCode: '200' }, cb);
    }
    this.stub(bag, 'request', mockRequest);
    var setup = { uri: 'http://somehost', timeout: 8000 };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isSuccess());
      assert.equals(result.getFailures(), []);
      assert.equals(result.getSuccesses(), []);
      done();
    }
    checker.check(setup, cb);
  },
  'should have success status when request is successful and status code matches': function (done) {
    function mockRequest(method, url, opts, cb) {
      opts.handlers.xxx({ statusCode: '200' }, cb);
    }
    this.stub(bag, 'request', mockRequest);
    var setup = { uri: 'http://somehost', statusCodes: [ 200, 301 ] };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isSuccess());
      assert.equals(result.getSuccesses(), ['Status code 200 as expected']);
      assert.equals(result.getFailures(), []);
      done();
    }
    checker.check(setup, cb);
  },
  'should have success status when request is successful and texts exist in request body': function (done) {
    function mockRequest(method, url, opts, cb) {
      opts.handlers.xxx({ statusCode: '200', body: 'foobar blah' }, cb);
    }
    this.stub(bag, 'request', mockRequest);
    var setup = { uri: 'http://somehost', texts: [ 'foo', 'blah' ] };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isSuccess());
      assert.equals(result.getSuccesses(), ['Text foo exists in response body', 'Text blah exists in response body']);
      assert.equals(result.getFailures(), []);
      done();
    }
    checker.check(setup, cb);
  },
  'should have success status when request is successful, status code matches, and texts exist in request body': function (done) {
    function mockRequest(method, url, opts, cb) {
      opts.handlers.xxx({ statusCode: '200', body: 'foobar blah' }, cb);
    }
    this.stub(bag, 'request', mockRequest);
    var setup = { uri: 'http://somehost', statusCodes: [ 200, 301 ], texts: [ 'foo', 'blah' ] };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isSuccess());
      assert.equals(result.getSuccesses(), [
        'Status code 200 as expected',
        'Text foo exists in response body',
        'Text blah exists in response body'
      ]);
      assert.equals(result.getFailures(), []);
      done();
    }
    checker.check(setup, cb);
  },
  'should have fail status when status code does not match': function (done) {
    function mockRequest(method, url, opts, cb) {
      opts.handlers.xxx({ statusCode: '400' }, cb);
    }
    this.stub(bag, 'request', mockRequest);
    var setup = { uri: 'http://somehost', statusCodes: [ 200, 301 ] };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isFail());
      assert.equals(result.getFailures(), ['Status code 400 does not match the expected 200, 301']);
      assert.equals(result.getSuccesses(), []);
      done();
    }
    checker.check(setup, cb);
  },
  'should have fail status when text does not exist in response body': function (done) {
    function mockRequest(method, url, opts, cb) {
      opts.handlers.xxx({ statusCode: '200', body: 'foobar blah' }, cb);
    }
    this.stub(bag, 'request', mockRequest);
    var setup = { uri: 'http://somehost', texts: [ 'xyz' ] };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isFail());
      assert.equals(result.getFailures(), ['Text xyz does not exist in response body']);
      assert.equals(result.getSuccesses(), []);
      done();
    }
    checker.check(setup, cb); 
  },
  'should have fail status when one text exists and another one does not': function (done) {
    function mockRequest(method, url, opts, cb) {
      opts.handlers.xxx({ statusCode: '200', body: 'foobar blah' }, cb);
    }
    this.stub(bag, 'request', mockRequest);
    var setup = { uri: 'http://somehost', texts: [ 'foobar', 'xyz' ] };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isFail());
      assert.equals(result.getFailures(), ['Text xyz does not exist in response body']);
      assert.equals(result.getSuccesses(), ['Text foobar exists in response body']);
      done();
    }
    checker.check(setup, cb); 
  },
  'should have fail status when checks result in both success and failure': function (done) {
    function mockRequest(method, url, opts, cb) {
      opts.handlers.xxx({ statusCode: '200', body: 'foobar blah' }, cb);
    }
    this.stub(bag, 'request', mockRequest);
    var setup = { uri: 'http://somehost', statusCodes: [200], texts: [ 'xyz' ] };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isFail());
      assert.equals(result.getFailures(), ['Text xyz does not exist in response body']);
      assert.equals(result.getSuccesses(), ['Status code 200 as expected']);
      done();
    }
    checker.check(setup, cb); 
  },
  'should execute all checks even though the first one fails': function (done) {
    function mockRequest(method, url, opts, cb) {
      opts.handlers.xxx({ statusCode: '200', body: 'foobar xyz' }, cb);
    }
    this.stub(bag, 'request', mockRequest);
    var setup = { uri: 'http://somehost', statusCodes: [201], texts: [ 'foobar', 'xyz', 'blah' ] };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isFail());
      assert.equals(result.getFailures(), ['Status code 200 does not match the expected 201', 'Text blah does not exist in response body']);
      assert.equals(result.getSuccesses(), ['Text foobar exists in response body', 'Text xyz exists in response body']);
      done();
    }
    checker.check(setup, cb); 
  },
  'should pass result headers and body as info': function (done) {
    function mockRequest(method, url, opts, cb) {
      opts.handlers.xxx({ statusCode: '200', headers: { someheader: 'somevalue' }, body: 'some body' }, cb);
    }
    this.stub(bag, 'request', mockRequest);
    var setup = { uri: 'http://somehost' };
    function cb(err, result) {
      assert.isNull(err);
      assert.isTrue(result.isSuccess());
      assert.equals(result.getFailures(), []);
      assert.equals(result.getSuccesses(), []);
      assert.equals(result.getInfo().headers.someheader, 'somevalue');
      assert.equals(result.getInfo().body, 'some body');
      done();
    }
    checker.check(setup, cb); 
  }
});