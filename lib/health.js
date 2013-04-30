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
 * - formatter: result formatter,
 *   if it's a function, then results will be passed to the formatter function,
 *   otherwise, it's assumed to be built-in string formatter: text or xml
 */
function Health(opts) {
  opts = opts || {};

  this.opts = {
    setupFile: opts.setupFile || 'health.json',
    setup: opts.setup,
    formatter: opts.formatter
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

        var cached = cache.get(setup.uri),
          startTime = Date.now();
        if (cached === null) {

          checker.check(setup, function (err, result) {
            if (err) {
              cb(err);
            } else {
              var endTime = Date.now();
              result.responseTime = endTime - startTime;
              cache.put(setup.uri, result, setup.ttl || TTL);
              cb(null, result);
            }
          });

        } else {
          cb(null, cached);
        }
      } else {
        cb(new Error('Unsupported protocol for URI ' + setup.uri));
      }
    });
  });

  async.parallel(tasks, function (err, results) {
    if (err) {
      cb(err);
    } else if (self.opts.formatter) {
      if (typeof self.opts.formatter === 'function') {
        cb(null, self.opts.formatter(results));
      } else {
        cb(null, require('./formatters/' + self.opts.formatter).format(results));
      }
    } else {
      cb(null, results);
    }
  });
};

Health.prototype._checker = function (uri) {
  var checker,
    protocol = uri.match(/^.+:\/\//);

  try {
    checker = require('./checkers/' + protocol[0].replace(/:\/\/$/, ''));
  } catch (e) {
    // unsupported protocol
  }

  return checker;
};

module.exports = Health;