"use strict";
/**
 * Expectation matcher.
 *
 * An expected value can be:
 *
 * - a scalar: strict equality
 * - an array: deep equality
 * - a plain object: partial deep match, only the listed keys are checked
 * - an operator object: every key starts with `$`
 *
 * Supported operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`,
 * `$contains`, `$matches`, `$exists`, `$in`, `$length`, `$not`, `$type`.
 *
 * @module matcher
 */

/**
 * Format a value for a failure message.
 *
 * @param {*} value - value to format
 * @return {String} formatted value
 * @private
 */
function _fmt(value) {
  return value === undefined ? "undefined" : JSON.stringify(value);
}

/**
 * Type name of a value, distinguishing arrays and null from objects.
 *
 * @param {*} value - value to inspect
 * @return {String} type name
 * @private
 */
function _typeOf(value) {
  if (Array.isArray(value)) {
    return "array";
  }
  return value === null ? "null" : typeof value;
}

/**
 * Deep equality of two values.
 *
 * @param {*} a - first value
 * @param {*} b - second value
 * @return {Boolean} true when both values are deeply equal
 * @private
 */
function _deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (_typeOf(a) !== _typeOf(b) || a === null || typeof a !== "object") {
    return false;
  }
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((v, i) => _deepEqual(v, b[i]));
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  return (
    keysA.length === keysB.length && keysA.every((k) => _deepEqual(a[k], b[k]))
  );
}

/**
 * Build a numeric comparison operator.
 *
 * @param {String} symbol - comparison symbol used in failure messages
 * @param {Function} compare - compare(actual, expected) predicate
 * @return {Function} operator function
 * @private
 */
function _comparison(symbol, compare) {
  return function (actual, arg) {
    return compare(Number(actual), arg)
      ? undefined
      : `expected ${symbol} ${arg}, got ${_fmt(actual)}`;
  };
}

/**
 * Operator implementations. Each returns a failure message, or undefined on
 * success. `$length` and `$not` recurse into match and receive the path and
 * failures list as well.
 *
 * @private
 */
const OPERATORS = {
  $eq: (actual, arg) =>
    _deepEqual(actual, arg)
      ? undefined
      : `expected ${_fmt(arg)}, got ${_fmt(actual)}`,
  $ne: (actual, arg) =>
    _deepEqual(actual, arg)
      ? `expected value different from ${_fmt(arg)}`
      : undefined,
  $gt: _comparison(">", (a, b) => a > b),
  $gte: _comparison(">=", (a, b) => a >= b),
  $lt: _comparison("<", (a, b) => a < b),
  $lte: _comparison("<=", (a, b) => a <= b),
  $contains: function (actual, arg) {
    if (Array.isArray(actual)) {
      return actual.some((v) => _deepEqual(v, arg))
        ? undefined
        : `expected array to contain ${_fmt(arg)}`;
    }
    if (typeof actual === "string") {
      return actual.includes(String(arg))
        ? undefined
        : `expected string to contain ${_fmt(arg)}`;
    }
    return `$contains not applicable to ${_typeOf(actual)}`;
  },
  $matches: function (actual, arg) {
    return typeof actual === "string" && new RegExp(arg).test(actual)
      ? undefined
      : `expected match for /${arg}/, got ${_fmt(actual)}`;
  },
  $exists: function (actual, arg) {
    const exists = actual !== undefined && actual !== null;
    return exists === Boolean(arg)
      ? undefined
      : `expected ${arg ? "present" : "absent"}, got ${_fmt(actual)}`;
  },
  $in: function (actual, arg) {
    return Array.isArray(arg) && arg.some((v) => _deepEqual(v, actual))
      ? undefined
      : `expected one of ${_fmt(arg)}, got ${_fmt(actual)}`;
  },
  $type: function (actual, arg) {
    return _typeOf(actual) === arg
      ? undefined
      : `expected type ${arg}, got ${_typeOf(actual)}`;
  },
  $length: function (actual, arg, path, failures) {
    const length =
      actual === undefined || actual === null ? undefined : actual.length;
    match(length, arg, `${path}.$length`, failures);
    return undefined;
  },
  $not: function (actual, arg, path) {
    return match(actual, arg, path, []).length === 0
      ? `expected NOT to match ${_fmt(arg)}`
      : undefined;
  },
};

/**
 * Check whether a value is an operator object, i.e. a non-empty plain
 * object whose keys are all known operators.
 *
 * @param {*} value - value to inspect
 * @return {Boolean} true when value is an operator object
 * @private
 */
function _isOperatorObject(value) {
  if (_typeOf(value) !== "object") {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((k) => Object.hasOwn(OPERATORS, k));
}

/**
 * Match an actual value against an expected value.
 *
 * @param {*} actual - actual value captured from the protocol response
 * @param {*} expected - expected value, see module description
 * @param {String} [path=""] - dotted path of the value, used in failures
 * @param {Array} [failures=[]] - list that failures are appended to
 * @return {Array} failures, each with path and message properties
 */
function match(actual, expected, path = "", failures = []) {
  if (_isOperatorObject(expected)) {
    Object.keys(expected).forEach(function (op) {
      const message = OPERATORS[op](actual, expected[op], path, failures);
      if (message) {
        failures.push({ path, message });
      }
    });
  } else if (_typeOf(expected) === "object") {
    if (actual === null || typeof actual !== "object") {
      failures.push({ path, message: `expected object, got ${_fmt(actual)}` });
    } else {
      Object.keys(expected).forEach(function (key) {
        match(
          actual[key],
          expected[key],
          path ? `${path}.${key}` : key,
          failures,
        );
      });
    }
  } else if (!_deepEqual(actual, expected)) {
    failures.push({
      path,
      message: `expected ${_fmt(expected)}, got ${_fmt(actual)}`,
    });
  }
  return failures;
}

export default { match };
