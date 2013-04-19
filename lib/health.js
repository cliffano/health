var async = require('async'),
  bag = require('bagofholding'),
  cron = require('cron'),
  fsx = require('fs.extra'),
  NodeCache = require('node-cache');

function Health(opts) {
  opts = opts || {};

  this.opts = {
    setupFile: opts.setupFile || 'health.json',
    healthSetup: opts.healthSetup,
    cache: opts.cache,
    reporter: opts.reporter || 'console'
  }

  this.cache = new NodeCache();
}

Health.prototype.check = function (cb) {
  this.opts.healthSetup = this.opts.healthSetup || JSON.parse(bag.cli.lookupFile(this.opts.setupFile));

  var tasks = [],
    self = this;

  var cache = this.cache;

  this.opts.healthSetup.forEach(function (setup) {
    tasks.push(function (cb) {
      var checker = self._checker(setup.uri);
      if (checker) {
        cache.get(setup.uri, function (err, result) {
          if (err) {
            console.error('An error occured', err.message);
            cb(null, err.message);
          } else if (result === {}) {
            console.log('Cache miss, getting new value');
            checker.check(setup, function (err, result) {
              if (err) {
                cb(err);
              } else {
                console.log('Caching with TTL: ', setup.ttl || 10);
                cache.set(setup.uri, result, setup.ttl || 10, function (err, success) {
                  if (err) {
                    cb(err);
                  } else if (success) {
                    console.log('Successfully cache result', result);
                    cb(null, result);
                  } else {
                    console.error('Unable to cache result', result);
                    cb(new Error('Unable to cache'));
                  }
                });
              }
            });
          } else {
            console.log('Cache hit', result);
            cb(null, result);
          }
        });
      } else {
        // todo, log unsupported checker
        cb();
      }
    });
  });

  async.parallel(tasks, function (err, result) {
    require('./reporters/' + self.opts.reporter).report(result);
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