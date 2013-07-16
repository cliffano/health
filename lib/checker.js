/**
 * All items must pass check function.
 * All successes and failures will be added to Result.
 *
 * @param {Array} items: an array of items to be checked
 * @param {Function} check: check function
 * @param {Object} result: check Result
 */
function allMustPass(items, check, result) {
  items.forEach(function (item) {
    try {
      result.addSuccess(check(item));
    } catch (e) {
      result.addFailure(e.message);
    }
  });
}

/**
 * At least one item must pass check function.
 * All successes will be added to Result.
 * Failures will only be added to Result if there's no success.
 *
 * @param {Array} items: an array of items to be checked
 * @param {Function} check: check function
 * @param {Object} result: check Result
 */
function oneMustPass(items, check, result) {
  var failures = [];
  items.forEach(function (item) {
    try {
      result.addSuccess(check(item));
    } catch (e) {
      failures.push(e.message);
    }
  });
  if (!result.hasSuccess()) {
    result.addFailures(failures);
  }
}

exports.allMustPass = allMustPass;
exports.oneMustPass = oneMustPass;