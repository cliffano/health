var _ = require('underscore'),
  bag = require('bagofholding'),
  Health = require('./health'),
  util = require('util');

function _init() {
  new Health().init(bag.cli.exit);
}

function _check(args) {

  function log(result) {
    var formatted = require('./formatters/' + (args.formatter || 'cli')).format(result);
    if (Array.isArray(formatted)) {
      formatted.forEach(function (line) {
        console.log(line);
      });
    } else {
      console.log(formatted);
    }
  }

  function exit(result) {
    var numNonOk = _.countBy(result, function (item) {
      return (item.status === 'ok') ? 'ok' : 'non-ok';
    })['non-ok'];
    process.exit(numNonOk);
  }

  var setup = JSON.parse(bag.cli.lookupFile(args.setupFile || 'health.json'));
  new Health({ setup: setup }).check(bag.cli.exitCb(null, function (result) {
    log(result);
    exit(result);
  }));
}

/**
 * Execute Health CLI.
 */
function exec() {

  var actions = {
    commands: {
      init: { action: _init },
      check: { action: _check }
    }
  };

  bag.cli.command(__dirname, actions);
}

exports.exec = exec;
