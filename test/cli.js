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
    this.mockProcess = this.mock(process);
  },
  'should contain init command and delegate to health init when exec is called': function () {
    this.mockConsole.expects('log').once().withExactArgs('someresult');
    this.mockProcess.expects('exit').once().withExactArgs(0);
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
      cb(null, 'someresult');
    });
    cli.exec();
  },
  'should log each line in array of texts': function () {
    this.mockConsole.expects('log').once().withExactArgs('line1');
    this.mockConsole.expects('log').once().withExactArgs('line2');
    this.mockProcess.expects('exit').once().withExactArgs(0);
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
      cb(null, ['line1', 'line2']);
    });
    cli.exec();
  }
});