/*jshint esnext: true */
var async = require('async'),
  bag = require('bagofholding'),
  cache = require('memory-cache');

/**
 * class Health
 *
 * @param {Object} opts: optional
 * - setupFile: path to JSON setup file containing health check setup, default: health.json 
 * - setup: health check setup object, if unspecified then use setup in setupFile
 *   a setup must have uri field, with optional ttl field (in milliseconds), and type-specific fields
 * - format: result format, support text and XML, if unspecified then default to result object
 */
function Health(opts) {
  opts = opts || {};

  this.opts = {
    setupFile: opts.setupFile || 'health.json',
    setup: opts.setup,
    format: opts.format
  };
}

/**
 * Execute the checks contained in setup, in parallel.
 * Each result will be cached depends on TTL setting for each URI, 
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Health.prototype.check = function (cb) {
  const TTL = 10000;
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
              cache.put(setup.uri, result, setup.ttl || TTL);
              cb(null, result);
            }
          });

        } else {
          cb(null, cached);
        }
      } else {
        cb(new Error('Unsupported checker for uri ' + setup.uri));
      }
    });
  });

  async.parallel(tasks, function (err, results) {
    if (err) {
      cb(err);
    } else if (self.opts.format) {
      cb(null, require('./formatters/' + self.opts.format).format(results));
    } else {
      cb(null, results);
    }
  });
};

Health.prototype._checker = function (uri) {
  var checker;

  if (uri.match(/^https?:\/\//)) {
    checker = require('./checkers/http');
  } else if (uri.match(/^mongodb:\/\//)) {
    checker = require('./checkers/mongodb');
  }

  return checker;
};

module.exports = Health;