var async = require('async'),
  bag = require('bagofholding'),
  cache = require('memory-cache');

function Health(opts) {
  opts = opts || {};

  this.opts = {
    setupFile: opts.setupFile || 'health.json',
    setup: opts.setup,
    reporter: opts.reporter || 'console'
  }
}

Health.prototype.check = function (cb) {
  this.opts.setup = this.opts.setup || JSON.parse(bag.cli.lookupFile(this.opts.setupFile));

  var tasks = [],
    self = this;

  this.opts.setup.forEach(function (setup) {
    tasks.push(function (cb) {

      var checker = self._checker(setup.uri);
      if (checker) {

        var cached = cache.get(setup.uri);
        if (cached === null) {

          checker.check(setup, function (err, result) {
            if (err) {
              cb(err);
            } else {
              cache.put(setup.uri, result, setup.ttl || 10000);
              cb(null, result);
            }
          });

        } else {
          console.log('Cache hit', cached);
          cb(null, cached);
        }
      } else {
        cb(new Error('Unknown checker for uri ' + setup.uri));
      }
    });
  });

  async.parallel(tasks, function (err, result) {
    if (err) {
      cb(err);
    } else {
      require('./reporters/' + self.opts.reporter).report(result);
      cb();
    }
  });
};

Health.prototype._checker = function (uri) {
  var checker;

  if (uri.match(/^https?:\/\//)) {
    checker = require('./checkers/http');
  }

  return checker;
}

module.exports = Health;