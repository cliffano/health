var bag = require('bagofholding'),
  buster = require('buster'),
  cli = require('../lib/cli'),
  Health = require('../lib/health');

buster.testCase('cli - exec', {
  'should contain commands with actions': function (done) {
    var mockCommand = function (base, actions) {
      assert.defined(base);
      assert.defined(actions.commands.init.action);
      assert.defined(actions.commands.check.action);
      done();
    };
    this.stub(bag, 'cli', { command: mockCommand });
    cli.exec();
  }
});

buster.testCase('cli - init', {
  'should contain init command and delegate to health init when exec is called': function (done) {
    this.stub(bag, 'cli', {
      command: function (base, actions) {
        actions.commands.init.action();
      },
      exit: bag.cli.exit
    });
    this.stub(Health.prototype, 'init', function (cb) {
      assert.equals(typeof cb, 'function');
      done();
    });
    cli.exec();
  }
});

buster.testCase('cli - check', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockFormatter = this.mock(require('../lib/formatters/cli'));
    this.mockProcess = this.mock(process);
  },
  'should log array items line by line': function () {
    this.mockConsole.expects('log').once().withExactArgs('someresult');
    this.mockProcess.expects('exit').twice().withExactArgs(0);
    this.mockFormatter.expects('format').once().withExactArgs([{ status: 'ok', name: 'someapp', desc: 'somedesc' }]).returns(['someresult']);
    this.stub(bag, 'cli', {
      command: function (base, actions) {
        actions.commands.check.action({});
      },
      exitCb: bag.cli.exitCb,
      lookupFile: function (file) {
        assert.equals(file, 'health.json');
        return '[ { "name": "gmail", "uri": "http://google.com" } ]';
      }
    });
    this.stub(Health.prototype, 'check', function (cb) {
      cb(null, [{ status: 'ok', name: 'someapp', desc: 'somedesc' }]);
    });
    cli.exec();
  },
  'should log string result as-is': function () {
    this.mockConsole.expects('log').once().withExactArgs('someresult');
    this.mockProcess.expects('exit').twice().withExactArgs(0);
    this.mockFormatter.expects('format').once().withExactArgs([{ status: 'ok', name: 'someapp', desc: 'somedesc' }]).returns('someresult');
    this.stub(bag, 'cli', {
      command: function (base, actions) {
        actions.commands.check.action({});
      },
      exitCb: bag.cli.exitCb,
      lookupFile: function (file) {
        assert.equals(file, 'health.json');
        return '[ { "name": "gmail", "uri": "http://google.com" } ]';
      }
    });
    this.stub(Health.prototype, 'check', function (cb) {
      cb(null, [{ status: 'ok', name: 'someapp', desc: 'somedesc' }]);
    });
    cli.exec();
  },
  'should exit process with the number of non-ok result': function () {
    this.mockConsole.expects('log').once().withExactArgs('someresult');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.mockProcess.expects('exit').once().withExactArgs(2);
    this.mockFormatter.expects('format').once().returns('someresult');
    this.stub(bag, 'cli', {
      command: function (base, actions) {
        actions.commands.check.action({});
      },
      exitCb: bag.cli.exitCb,
      lookupFile: function (file) {
        assert.equals(file, 'health.json');
        return '[ { "name": "gmail", "uri": "http://google.com" } ]';
      }
    });
    this.stub(Health.prototype, 'check', function (cb) {
      cb(null, [
        { status: 'fail', name: 'someapp1', desc: 'somedesc1' },
        { status: 'ok', name: 'someapp2', desc: 'somedesc2' },
        { status: 'fail', name: 'someapp3', desc: 'somedesc3' }
      ]);
    });
    cli.exec();
  }
});