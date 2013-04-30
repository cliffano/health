var bag = require('bagofholding'),
  buster = require('buster'),
  cache = require('memory-cache'),
  Health = require('../lib/health');

buster.testCase('health - health', {
  'should set opts if specified via constructor': function () {
    var health = new Health({
      setupFile: '/some/path/health.json',
      setup: { uri: 'http://somehost' },
      formatter: 'json'
    });
    assert.equals(health.opts.setupFile, '/some/path/health.json');
    assert.equals(health.opts.setup, { uri: 'http://somehost' });
    assert.equals(health.opts.formatter, 'json');
  },
  'should set default opts if unspecified via constructor': function () {
    var health = new Health();
    assert.equals(health.opts.setupFile, 'health.json');
    assert.equals(health.opts.setup, undefined);
    assert.equals(health.opts.formatter, undefined);
  }
});

buster.testCase('health - check', {
  setUp: function () {
    this.mockCache = this.mock(cache);
  },
  'should pass error when uri has unsupported protocol': function (done) {
    var health = new Health({
      setup: [{ uri: 'httpx://somehost' }]
    });
    function cb(err, results) {
      assert.equals(err.message, 'Unsupported protocol for URI httpx://somehost');
      assert.equals(results, undefined);
      done();
    }
    health.check(cb);
  },
  'should pass error when uri has unsupported protocol and setup uses file': function (done) {
    var health = new Health({
      setupFile: '/some/path/health.json'
    });
    this.stub(bag, 'cli', { lookupFile: function (file) {
      assert.equals(file, '/some/path/health.json');
      return '[{ "uri": "httpx://somehost" }]';
    }});
    function cb(err, results) {
      assert.equals(err.message, 'Unsupported protocol for URI httpx://somehost');
      assert.equals(results, undefined);
      done();
    }
    health.check(cb);
  },
  'should pass result with cached data when result is already cached (cache hit)': function (done) {
    this.mockCache.expects('get').once().withExactArgs('http://somehost').returns({ uri: 'http://somehost', status: 'OK', responseTime: 15 });
    var health = new Health({
      setup: [{ uri: 'http://somehost' }]
    });
    function cb(err, results) {
      assert.isNull(err);
      assert.equals(results.length, 1);
      assert.equals(results[0].uri, 'http://somehost');
      assert.equals(results[0].status, 'OK');
      assert.equals(results[0].responseTime, 15);
      done();
    }
    health.check(cb);
  },
  'should pass result with check result when it is not already cached (cache miss) and the result is then cached': function (done) {
    var result = { uri: 'http://somehost', status: 'OK' };
    this.mockCache.expects('get').once().withExactArgs('http://somehost').returns(null);
    this.mockCache.expects('put').once().withExactArgs('http://somehost', result, 10000);
    var health = new Health({
      setup: [{ uri: 'http://somehost' }]
    });
    health._checker = function (uri) {
      return {
        check: function (setup, cb) {
          cb(null, result);
        }
      };
    };
    function cb(err, results) {
      assert.isNull(err);
      assert.equals(results.length, 1);
      assert.equals(results[0].uri, 'http://somehost');
      assert.equals(results[0].status, 'OK');
      assert.defined(results[0].responseTime);
      done();
    }
    health.check(cb);
  },
  'should format data when formatter opt string is specified': function (done) {
    var result = { uri: 'http://somehost', status: 'OK' },
      mockTimer = this.useFakeTimers(0, 'Date');
    this.mockCache.expects('get').once().withExactArgs('http://somehost').returns(null);
    this.mockCache.expects('put').once().withExactArgs('http://somehost', result, 5000);
    var health = new Health({
      setup: [{ uri: 'http://somehost', ttl: 5000 }],
      formatter: 'text'
    });
    health._checker = function (uri) {
      return {
        check: function (setup, cb) {
          cb(null, result);
        }
      };
    };
    function cb(err, results) {
      assert.isNull(err);
      assert.equals(results.length, 1);
      assert.equals(results[0], 'OK | http://somehost - 0ms');
      done();
    }
    health.check(cb);
  },
  'should pass error when an error occurs while checking a resource': function (done) {
    var result = { uri: 'http://somehost', status: 'OK' };
    this.mockCache.expects('get').once().withExactArgs('http://somehost').returns(null);
    var health = new Health({
      setup: [{ uri: 'http://somehost', ttl: 5000 }]
    });
    health._checker = function (uri) {
      return {
        check: function (setup, cb) {
          cb(new Error('some error'));
        }
      };
    };
    function cb(err, results) {
      assert.equals(err.message, 'some error');
      assert.equals(results, undefined);
      done();
    }
    health.check(cb);
  },
  'should format data when formatter opt function is specified': function (done) {
    var result = { uri: 'http://somehost', status: 'OK' },
      mockTimer = this.useFakeTimers(0, 'Date');
    this.mockCache.expects('get').once().withExactArgs('http://somehost').returns(null);
    this.mockCache.expects('put').once().withExactArgs('http://somehost', result, 5000);
    var health = new Health({
      setup: [{ uri: 'http://somehost', ttl: 5000 }],
      formatter: function (results) {
        var formatted = '';
        results.forEach(function (result) {
          formatted = result.uri + ': ' + result.status + '\n';
        });
        return formatted;
      }
    });
    health._checker = function (uri) {
      return {
        check: function (setup, cb) {
          cb(null, result);
        }
      };
    };
    function cb(err, result) {
      assert.isNull(err);
      assert.equals(result, 'http://somehost: OK\n');
      done();
    }
    health.check(cb);
  }
});

buster.testCase('health - _checker', {
  setUp: function () {
    this.health = new Health();
  },
  'should use http checker when URI has http protocol': function () {
    var checker = this.health._checker('http://somehost');
    assert.defined(checker);
  },
  'should use http checker when URI has https protocol': function () {
    var checker = this.health._checker('https://somehost');
    assert.defined(checker);
  },
  'should have undefined checker when URI has unsupported protocol': function () {
    var checker = this.health._checker('httpx://somehost');
    assert.equals(checker, undefined);
  }
});