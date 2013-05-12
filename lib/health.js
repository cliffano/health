/*jshint esnext: true */
var async = require('async'),
  bag = require('bagofholding'),
  cache = require('memory-cache'),
  fsx = require('fs.extra'),
  p = require('path');

/**
 * class Health
 *
 * @param {Object} opts: optional
 * - setup: health check setup, 
 *   if it's an object, each must have uri field, with optional ttl field (in milliseconds), and type-specific fields
 *   if it's a string, then it's a path to JSON setup file containing health check setup
 *   if unspecified, then it defaults to health.json that exists in either current directory or home directory
 * - formatter: result formatter,
 *   if it's a function, then results will be passed to the formatter function,
 *   otherwise, it's assumed to be built-in string formatter: text or xml
 *   if unspecified, then no formatting will be applied
 */
function Health(opts) {
  opts = opts || {};

  this.opts = {
    setup: opts.setup || 'health.json',
    formatter: opts.formatter
  };
}

/**
 * Create a sample health.json setup file in current working directory.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Health.prototype.init = function (cb) {
  console.log('Creating sample setup file: health.json');
  fsx.copy(p.join(__dirname, '../examples/health.json'), 'health.json', cb);
};

/**
 * Execute the checks contained in setup, in parallel.
 * Each result will be cached depends on TTL setting for each URI, 
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Health.prototype.check = function (cb) {
  const TTL = 10000;

  if (typeof this.opts.setup === 'string') {
    this.opts.setup = JSON.parse(bag.cli.lookupFile(this.opts.setup));
  }

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
              if (setup.name) {
                result.name = setup.name;
              }
              result.uri = setup.uri;

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