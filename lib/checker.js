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

/**
 * Check whether an attribute exists in setup file.
 * - if <attribute> exists in setup, then all attribute values must pass the check
 * - if <attribute>-or exists in setup, then either one of the attribute values must pass the check
 *
 * @param {String} attribute: attribute name to check in the setup
 * @param {Object} setup: health setup
 * @param {Function} check: check function
 * @param {Object} result: check Result
 */
function checkAttribute(attribute, setup, check, result) {
  if (setup[attribute]) {
    if (!Array.isArray(setup[attribute])) {
      setup[attribute] = [setup[attribute]];
    }
    allMustPass(setup[attribute], check, result);
  }
  if (setup[attribute + '-or']) {
    oneMustPass(setup[attribute + '-or'], check, result);
  }
}

exports.allMustPass = allMustPass;
exports.oneMustPass = oneMustPass;
exports.checkAttribute = checkAttribute;