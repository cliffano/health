var bag = require('bagofcli'),
  buster = require('buster'),
  cache = require('memory-cache'),
  fsx = require('fs.extra'),
  Health = require('../lib/health');

buster.testCase('health - health', {
  'should set opts if specified via constructor': function () {
    var health = new Health({
      setup: { uri: 'http://somehost' },
      formatter: 'json'
    });
    assert.equals(health.opts.setup, { uri: 'http://somehost' });
    assert.equals(health.opts.formatter, 'json');
  },
  'should set default opts if unspecified via constructor': function () {
    var health = new Health();
    assert.equals(health.opts.setup, 'health.json');
    assert.equals(health.opts.formatter, undefined);
  }
});

buster.testCase('health - init', {
  setUp: function () {
    this.mockConsole = this.mock(console);
  },
  'should copy sample health.js file to current directory when init is called': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Creating sample setup file: health.json');
    this.stub(fsx, 'copy', function (src, dest, cb) {
      assert.isTrue(src.match(/\/examples\/health.json$/).length === 1);
      assert.equals(dest, 'health.json');
      cb();
    });
    var health = new Health();
    health.init(function (err, result) {
      assert.equals(err, undefined);
      done();
    });
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
      setup: '/some/path/health.json'
    });
    this.stub(bag, 'lookupFile', function (file) {
      assert.equals(file, '/some/path/health.json');
      return '[{ "uri": "httpx://somehost" }]';
    });
    function cb(err, results) {
      assert.equals(err.message, 'Unsupported protocol for URI httpx://somehost');
      assert.equals(results, undefined);
      done();
    }
    health.check(cb);
  },
  'should pass result with cached data when result is already cached (cache hit)': function (done) {
    this.mockCache.expects('get').once().withExactArgs('http://somehost').returns({ uri: 'http://somehost', status: 'success', duration: 15 });
    var health = new Health({
      setup: [{ uri: 'http://somehost' }]
    });
    function cb(err, results) {
      assert.isNull(err);
      assert.equals(results.length, 1);
      assert.equals(results[0].uri, 'http://somehost');
      assert.equals(results[0].status, 'success');
      assert.equals(results[0].duration, 15);
      done();
    }
    health.check(cb);
  },
  'should pass result with check result when it is not already cached (cache miss) and the result is then cached': function (done) {
    var result = { status: 'success' };
    this.mockCache.expects('get').once().withExactArgs('http://somehost').returns(null);
    this.mockCache.expects('put').once().withExactArgs('http://somehost', result, 10000);
    var health = new Health({
      setup: [{ name: 'someapp', uri: 'http://somehost' }]
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
      assert.equals(results[0].name, 'someapp');
      assert.equals(results[0].uri, 'http://somehost');
      assert.equals(results[0].status, 'success');
      assert.defined(results[0].duration);
      done();
    }
    health.check(cb);
  },
  'should format data when formatter opt string is specified': function (done) {
    var result = { uri: 'http://somehost', status: 'success' },
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
      assert.equals(results[0], 'success - http://somehost - 0ms');
      done();
    }
    health.check(cb);
  },
  'should pass error when an error occurs while checking a resource': function (done) {
    var result = { uri: 'http://somehost', status: 'success' };
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
    var result = { uri: 'http://somehost', status: 'success' },
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
      assert.equals(result, 'http://somehost: success\n');
      done();
    }
    health.check(cb);
  }
});

buster.testCase('health - _singleResultRules', {
  setUp: function () {
    this.health = new Health();
  },
  'should set name if it exists': function () {
    var result = {},
      setup = { name: 'somename', uri: 'http://somehost' },
      checker = this.health._singleResultRules(result, setup);
    assert.equals(result.name, 'somename');
  },
  'should set status to warning when result is fail and lenient is true': function () {
    var result = { status: 'fail' },
      setup = { name: 'somename', uri: 'http://somehost', lenient: true },
      checker = this.health._singleResultRules(result, setup);
    assert.equals(result.status, 'warning');
  },
  'should set status to warning when result is error and lenient is true': function () {
    var result = { status: 'error' },
      setup = { name: 'somename', uri: 'http://somehost', lenient: true },
      checker = this.health._singleResultRules(result, setup);
    assert.equals(result.status, 'warning');
  },
  'should mask password with asterisks': function () {
    var result = {},
      setup = { name: 'somename', uri: 'http://user:pass@somehost' },
      checker = this.health._singleResultRules(result, setup);
    assert.equals(result.uri, 'http://user:****@somehost/');
  }
});

buster.testCase('health - _multiResultsRules', {
  setUp: function () {
    this.health = new Health();
  },
  'should leave all results as-is when there is no specified group': function () {
    var results = [
        { name: 'somename1', uri: 'http://somehost1', status: 'fail' },
        { name: 'somename2', uri: 'http://somehost2', status: 'success' },
        { name: 'somename3', uri: 'http://somehost3', status: 'error' },
        { name: 'somename4', uri: 'http://somehost4', status: 'warning' }
      ],
      setup = [
        { name: 'somename1', uri: 'http://somehost1' },
        { name: 'somename2', uri: 'http://somehost2' },
        { name: 'somename3', uri: 'http://somehost3' },
        { name: 'somename4', uri: 'http://somehost4' }
      ];
    results = this.health._multiResultsRules(results, setup);
    assert.equals(results[0].status, 'fail');
    assert.equals(results[1].status, 'success');
    assert.equals(results[2].status, 'error');
    assert.equals(results[3].status, 'warning');
  },
  'should change status fail and error to warning when not all group members have non-success status': function () {
    var results = [
        { name: 'somename1', uri: 'http://somehost1', status: 'fail' },
        { name: 'somename2', uri: 'http://somehost2', status: 'success' },
        { name: 'somename3', uri: 'http://somehost3', status: 'error' },
        { name: 'somename4', uri: 'http://somehost4', status: 'warning' }
      ],
      setup = [
        { name: 'somename1', uri: 'http://somehost1', group: 'somegroup' },
        { name: 'somename2', uri: 'http://somehost2', group: 'somegroup' },
        { name: 'somename3', uri: 'http://somehost3', group: 'somegroup' },
        { name: 'somename4', uri: 'http://somehost4', group: 'somegroup' }
      ];
    results = this.health._multiResultsRules(results, setup);
    assert.equals(results[0].status, 'warning');
    assert.equals(results[1].status, 'success');
    assert.equals(results[2].status, 'warning');
    assert.equals(results[3].status, 'warning');
  },
  'should change status warning to fail when all group members have non-success status': function () {
    var results = [
        { name: 'somename1', uri: 'http://somehost1', status: 'fail' },
        { name: 'somename2', uri: 'http://somehost2', status: 'fail' },
        { name: 'somename3', uri: 'http://somehost3', status: 'warning' },
        { name: 'somename4', uri: 'http://somehost4', status: 'error' }
      ],
      setup = [
        { name: 'somename1', uri: 'http://somehost1', group: 'somegroup' },
        { name: 'somename2', uri: 'http://somehost2', group: 'somegroup' },
        { name: 'somename3', uri: 'http://somehost3', group: 'somegroup' },
        { name: 'somename4', uri: 'http://somehost4', group: 'somegroup' }
      ];
    results = this.health._multiResultsRules(results, setup);
    assert.equals(results[0].status, 'fail');
    assert.equals(results[1].status, 'fail');
    assert.equals(results[2].status, 'fail');
    assert.equals(results[3].status, 'error');
  },
  'should change and keep status accordingly when there are multiple groups': function () {
    var results = [
        { name: 'somename1', uri: 'http://somehost1', status: 'fail' },
        { name: 'somename2', uri: 'http://somehost2', status: 'fail' },
        { name: 'somename3', uri: 'http://somehost3', status: 'warning' },
        { name: 'somename4', uri: 'http://somehost4', status: 'error' },
        { name: 'somename5', uri: 'http://somehost5', status: 'fail' },
        { name: 'somename6', uri: 'http://somehost6', status: 'success' },
        { name: 'somename7', uri: 'http://somehost7', status: 'error' },
        { name: 'somename8', uri: 'http://somehost8', status: 'warning' }
      ],
      setup = [
        { name: 'somename1', uri: 'http://somehost1', group: 'somegroupA' },
        { name: 'somename2', uri: 'http://somehost2', group: 'somegroupA' },
        { name: 'somename3', uri: 'http://somehost3', group: 'somegroupA' },
        { name: 'somename4', uri: 'http://somehost4', group: 'somegroupA' },
        { name: 'somename5', uri: 'http://somehost5', group: 'somegroupB' },
        { name: 'somename6', uri: 'http://somehost6', group: 'somegroupB' },
        { name: 'somename7', uri: 'http://somehost7', group: 'somegroupB' },
        { name: 'somename8', uri: 'http://somehost8', group: 'somegroupB' }
      ];
    results = this.health._multiResultsRules(results, setup);
    assert.equals(results[0].status, 'fail');
    assert.equals(results[1].status, 'fail');
    assert.equals(results[2].status, 'fail');
    assert.equals(results[3].status, 'error');
    assert.equals(results[4].status, 'warning');
    assert.equals(results[5].status, 'success');
    assert.equals(results[6].status, 'warning');
    assert.equals(results[7].status, 'warning');
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