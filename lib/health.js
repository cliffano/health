"use strict";
import _ from "lodash";
import async from "async";
import bag from "bagofcli";
import cache from "memory-cache";
import fsx from "fs-extra";
import i18n from "i18n";
import p from "path";
import url from "url";
import fileChecker from "./checkers/file.js";
import httpChecker from "./checkers/http.js";
import httpsChecker from "./checkers/https.js";
import mongodbChecker from "./checkers/mongodb.js";
import cliFormatter from "./formatters/cli.js";
import htmlFormatter from "./formatters/html.js";
import textFormatter from "./formatters/text.js";

const DIRNAME = p.dirname(url.fileURLToPath(import.meta.url));

const CHECKERS = {
  file: fileChecker,
  http: httpChecker,
  https: httpsChecker,
  mongodb: mongodbChecker,
};

const FORMATTERS = {
  cli: cliFormatter,
  html: htmlFormatter,
  text: textFormatter,
};

/**
 * class Health
 */
class Health {
  /**
   * Initialise Health.
   *
   * @param {Object} opts: optional
   * - setup: health check setup,
   *   if it's an object, each must have uri field, with optional ttl field (in milliseconds), and type-specific fields
   *   if it's a string, then it's a path to JSON setup file containing health check setup
   *   if unspecified, then it defaults to health.json that exists in either current directory or home directory
   * - formatter: result formatter,
   *   if it's a function, then results will be passed to the formatter function,
   *   otherwise, it's assumed to be built-in string formatter: cli, html, or text
   *   if unspecified, then no formatting will be applied
   */
  constructor(opts) {
    opts = opts || {};

    this.opts = {
      setup: opts.setup || "health.json",
      locale: opts.locale || "en",
      formatter: opts.formatter,
    };

    i18n.configure({
      locales: ["en", "id"],
      defaultLocale: "en",
      directory: p.join(DIRNAME, "../locales"),
      updateFiles: false,
    });
    i18n.setLocale(this.opts.locale);
  }

  /**
   * Create a sample health.json setup file in current working directory.
   *
   * @param {Function} cb: standard cb(err, result) callback
   */
  init(cb) {
    console.log("Creating sample setup file: health.json");
    fsx.copy(p.join(DIRNAME, "../examples/health.json"), "health.json", cb);
  }

  /**
   * Clear all cached check result for all resources.
   */
  clearCache() {
    cache.clear();
  }

  /**
   * Execute the checks contained in setup, in parallel.
   * Each result will be cached depends on TTL setting for each URI,
   *
   * @param {Function} cb: standard cb(err, result) callback
   */
  check(cb) {
    const TTL = 10000;

    if (typeof this.opts.setup === "string") {
      this.opts.setup = JSON.parse(bag.lookupFile(this.opts.setup));
    }

    const tasks = [];
    const self = this;

    this.opts.setup.forEach(function (setup) {
      tasks.push(function (cb) {
        const checker = self._checker(setup.uri);
        if (checker) {
          const cached = cache.get(setup.uri);
          const startTime = Date.now();
          if (cached === null) {
            checker.check(setup, function (err, result) {
              if (err) {
                cb(err);
              } else {
                const endTime = Date.now();
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
          cb(new Error(i18n.__("Unsupported protocol for URI %s", setup.uri)));
        }
      });
    });

    async.parallel(tasks, function (err, results) {
      if (err) {
        cb(err);
      } else if (self.opts.formatter) {
        // apply rules to multiple results
        results = self._multiResultsRules(results, self.opts.setup);

        if (typeof self.opts.formatter === "function") {
          cb(null, self.opts.formatter(results));
        } else {
          cb(null, FORMATTERS[self.opts.formatter].format(results));
        }
      } else {
        cb(null, results);
      }
    });
  }

  _singleResultRules(result, setup) {
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
    const parsedUri = url.parse(result.getUri());
    if (parsedUri.auth) {
      const userPass = parsedUri.auth.split(":");
      userPass[1] = userPass[1].replace(/./g, "*");
      parsedUri.auth = userPass.join(":");
      result.setUri(url.format(parsedUri));
    }

    return result;
  }

  _multiResultsRules(results, setup) {
    const groups = {};

    function addToGroup(result, group, index) {
      if (!groups[group]) {
        groups[group] = [];
      }
      // store index to avoid re-iterating the whole result
      // for each group when changing the status
      groups[group].push({ index: index, result: result });
    }

    for (let i = 0, ln = results.length; i < ln; i += 1) {
      if (setup[i].group) {
        addToGroup(results[i], setup[i].group, i);
      }
    }

    // threshold is specified as suffix in group name
    function _getThreshold(group) {
      let threshold;
      if (group.match(/-[0-9]{1,3}$/)) {
        const elems = group.split("-");
        threshold = parseInt(elems[elems.length - 1], 10);
      }
      return threshold;
    }

    function _isSuccess(members, threshold) {
      let successCount = 0;
      members.forEach(function (member) {
        if (member.isSuccess()) {
          successCount += 1;
        }
      });
      // if threshold is undefined, it's considered a success as
      // long as the calculated threshold is greater than 0 (at least one success).
      // if threshold is defined, then it's considered a success
      // when the calculated threshold is equal or greater to the threshold
      return threshold
        ? (successCount * 100) / members.length >= threshold
        : (successCount * 100) / members.length > 0;
    }

    Object.keys(groups).forEach(function (group) {
      const members = _.map(groups[group], "result");
      const indices = _.map(groups[group], "index");
      const isSuccess = _isSuccess(members, _getThreshold(group));

      indices.forEach(function (index) {
        const result = results[index];
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
  }

  _checker(uri) {
    const protocol = uri.match(/^.+:\/\//);
    return protocol ? CHECKERS[protocol[0].replace(/:\/\/$/, "")] : undefined;
  }
}

export { Health as default };
