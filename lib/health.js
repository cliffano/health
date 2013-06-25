/*jshint esnext: true */
var _ = require('lodash'),
  async = require('async'),
  bag = require('bagofcli'),
  cache = require('memory-cache'),
  fsx = require('fs.extra'),
  p = require('path'),
  url = require('url');

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
    this.opts.setup = JSON.parse(bag.lookupFile(this.opts.setup));
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

              // check time in milliseconds
              var endTime = Date.now();
              result.setDuration(endTime - startTime);

              // apply rules to each single result
              result = self._singleResultRules(result, setup);

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

      // apply rules to multiple results
      results = self._multiResultsRules(results, self.opts.setup);

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

Health.prototype._singleResultRules = function (result, setup) {
  // basic info
  if (setup.name) {
    result.setName(setup.name);
  }
  result.setUri(setup.uri);

  // camouflage fail status as warn when lenient is true
  if (setup.lenient === true && (result.isFail() || result.isError())) {
    result.warning();
  }

  // mask password
  var parsedUri = url.parse(result.getUri());
  if (parsedUri.auth) {
    var userPass = parsedUri.auth.split(':');
    userPass[1] = userPass[1].replace(/./g, '*');
    parsedUri.auth = userPass.join(':');
    result.setUri(url.format(parsedUri));
  }

  return result;
};

Health.prototype._multiResultsRules = function (results, setup) {
  var groups = {};

  function addToGroup(result, group, index) {
    if (!groups[group]) {
      groups[group] = [];
    }
    // store index to avoid re-iterating the whole result
    // for each group when changing the status
    groups[group].push({ index: index, result: result });
  }

  for (var i = 0, ln = results.length; i < ln; i += 1) {
    if (setup[i].group) {
      addToGroup(results[i], setup[i].group, i);
    }
  }

  Object.keys(groups).forEach(function (group) {
    var members = _.pluck(groups[group], 'result'),
      indices = _.pluck(groups[group], 'index'),
      statuses = _.uniq(_.pluck(members, 'status')),
      hasSuccess = statuses.indexOf('success') !== -1;

    indices.forEach(function (index) {
      var status = results[index].status;
      // if there's a success in a group, change all error and fail to warning
      if (hasSuccess) {
        if (status === 'fail' || status === 'error') {
          results[index].status = 'warning';
        }
      // if there's no success in a group, change warning to fail
      } else {
        if (status === 'warning') {
          results[index].status = 'fail';
        }
      }
    });
  });

  return results;
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