"use strict";
/**
 * Turns check reports into human readable CLI output lines.
 *
 * @module reporter
 */
import nodeUtil from "util";

/**
 * Apply a terminal style, styleText drops it when stdout is not a TTY.
 *
 * @param {String} format - util.styleText format, e.g. green
 * @param {String} text - text to style
 * @return {String} styled text
 * @private
 */
function _style(format, text) {
  return nodeUtil.styleText(format, text);
}

/**
 * Indent every line of a block of text.
 *
 * @param {String} text - text to indent
 * @param {String} indent - indentation prefix
 * @return {String} indented text
 * @private
 */
function _indent(text, indent) {
  return text.replace(/^/gm, indent);
}

/**
 * Build the output lines for a single check result.
 *
 * @param {Object} result - check result from Health#check
 * @param {Boolean} verbose - include the full captured result
 * @return {Array} output lines
 * @private
 */
function _resultLines(result, verbose) {
  const lines = [];
  if (result.ok) {
    const time =
      result.result?.responseTime !== undefined
        ? ` ${_style("dim", `(${result.result.responseTime}ms)`)}`
        : "";
    lines.push(`  ${_style("green", "✓")} ${result.name}${time}`);
  } else {
    lines.push(`  ${_style("red", `✗ ${result.name}`)}`);
    result.failures.forEach(function (failure) {
      const path = failure.path ? `${failure.path}: ` : "";
      lines.push(`      ${_style("red", `${path}${failure.message}`)}`);
    });
  }
  if (verbose && result.result) {
    lines.push(
      _style("dim", _indent(JSON.stringify(result.result, null, 2), "      ")),
    );
  }
  return lines;
}

/**
 * Report check results of multiple files.
 *
 * @param {Array} reports - list of { file, error, results } from Health#checkFiles
 * @param {Object} [opts] - optional settings
 * @param {Boolean} [opts.verbose=false] - include each check's full result
 * @return {Object} { lines, passed, failed }, failed includes unreadable files
 */
function report(reports, opts) {
  const verbose = (opts && opts.verbose) === true;
  const lines = [];
  let passed = 0;
  let failed = 0;
  reports.forEach(function (fileReport) {
    lines.push(_style("dim", fileReport.file));
    if (fileReport.error) {
      failed += 1;
      lines.push(
        `  ${_style("red", `✗ could not run file: ${fileReport.error.message}`)}`,
      );
    }
    fileReport.results.forEach(function (result) {
      if (result.ok) {
        passed += 1;
      } else {
        failed += 1;
      }
      lines.push(..._resultLines(result, verbose));
    });
  });
  lines.push("", `${passed} passed, ${failed} failed`);
  return { lines, passed, failed };
}

export default { report };
