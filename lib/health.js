var _ = require('lodash'),
  async = require('async'),
  bag = require('bagofcli'),
  cache = require('memory-cache'),
  fsx = require('fs.extra'),
  i18n = require('i18n'),
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
    locale: opts.locale || 'en',
    formatter: opts.formatter
  };

  i18n.configure({
    locales: ['en', 'id'],
    defaultLocale: 'en',
    directory: p.join(__dirname,'../locales'),
    updateFiles: false
  });
  i18n.setLocale(opts.locale);
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
 * Clear all cached check result for all resources.
 */
Health.prototype.clearCache = function () {
  cache.clear();
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

              var endTime = Date.now();
              result.setDuration(endTime - startTime);
              result.setTimestamp(new Date(endTime));

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
        cb(new Error(i18n.__('Unsupported protocol for URI %s', setup.uri)));
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

  // threshold is specified as suffix in group name
  function _getThreshold(group) {
    var threshold;
    if (group.match(/\-[0-9]{1,3}$/)) {
      var elems = group.split('-');
      threshold = parseInt(elems[elems.length - 1], 10);
    }
    return threshold;
  }

  function _isSuccess(members, threshold) {
    var successCount = 0;
    members.forEach(function (member) {
      if (member.isSuccess()) {
        successCount += 1;
      }
    });
    // if threshold is undefined, it's considered a success as
    // long as the calculated threshold is greater than 0 (at least one success).
    // if threshold is defined, then it's considered a success
    // when the calculated threshold is equal or greater to the threshold
    return threshold ?
      (successCount * 100 / members.length) >= threshold :
      (successCount * 100 / members.length) > 0;
  }

  Object.keys(groups).forEach(function (group) {
    var members = _.pluck(groups[group], 'result'),
      indices = _.pluck(groups[group], 'index'),
      isSuccess = _isSuccess(members, _getThreshold(group));

    indices.forEach(function (index) {
      var result = results[index];
      // if group check is considered a success, change all error and fail to warning
      if (isSuccess) {
        if (result.isFail() || result.isError()) {
          result.warning();
        }
      // if group check is not considered a success, change warning to fail
      } else {
        if (result.isWarning()) {
          result.fail();
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
