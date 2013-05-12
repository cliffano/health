var bag = require('bagofholding'),
  Health = require('./health');

function _init() {
  new Health().init(bag.cli.exit);
}

function _check(args) {
  var setup = JSON.parse(bag.cli.lookupFile(args.setupFile || 'health.json')),
    opts = {
      setup: setup,
      formatter: args.formatter || 'text'
    };
  new Health(opts).check(bag.cli.exitCb(null, function (result) {
    if (Array.isArray(result)) {
      result.forEach(function (line) {
        console.log(line);
      });
    } else {
      console.log(result);
    }
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