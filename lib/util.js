"use strict";
/**
 * Small helpers shared by the protocol checkers.
 *
 * @module util
 */

const DAY_MS = 86400000;

/**
 * Wrap a callback so that only its first invocation takes effect.
 * Network events can race (e.g. timeout vs. error vs. data), this guarantees
 * that a checker reports exactly one outcome.
 *
 * @param {Function} cb - standard cb(err, result) callback
 * @return {Function} callback that ignores every call after the first
 */
function once(cb) {
  let called = false;
  return function (err, result) {
    if (!called) {
      called = true;
      cb(err, result);
    }
  };
}

/**
 * Milliseconds elapsed since a performance.now() start mark, rounded.
 *
 * @param {Number} start - performance.now() value captured at the start
 * @return {Number} elapsed time in milliseconds
 */
function elapsed(start) {
  return Math.round(performance.now() - start);
}

/**
 * Parse text as JSON, returning undefined instead of throwing.
 *
 * @param {String} text - text to parse
 * @return {*} parsed value, or undefined when text is not valid JSON
 */
function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Number of whole days between now and a certificate expiry date.
 *
 * @param {String} validTo - certificate valid_to date string
 * @return {Number} days remaining (negative when expired), undefined when unknown
 */
function daysRemaining(validTo) {
  return validTo
    ? Math.floor((new Date(validTo) - Date.now()) / DAY_MS)
    : undefined;
}

/**
 * Build the bytes to send from either a hex string or a text payload.
 *
 * @param {String} [sendHex] - payload as hex string, takes precedence
 * @param {String} [send] - payload as text
 * @return {Buffer} payload, undefined when neither is specified
 */
function payload(sendHex, send) {
  if (sendHex !== undefined) {
    return Buffer.from(String(sendHex), "hex");
  }
  return send !== undefined ? Buffer.from(String(send)) : undefined;
}

export default { once, elapsed, parseJson, daysRemaining, payload };
