"use strict";
import _ from "lodash";
import fs from "fs";
import jazz from "jazz";
import p from "path";
import { fileURLToPath } from "url";

const DIRNAME = p.dirname(fileURLToPath(import.meta.url));

/**
 * Format health check results into HTML using Bootstrap CDN.
 *
 * @param {Object} results: an array of result objects containing:
 * - name: resource name
 * - status: ok or fail
 * - uri: the resource that was checked
 * - desc: result description, e.g. failure explanation
 * - duration: check response time in milliseconds
 * @return {String} a HTML string
 */
function format(results) {
  function _escape(data, cb) {
    if (typeof data === "object") {
      data = JSON.stringify(data);
    }
    data = data.replace(/\r?\n/g, "<br/>");
    data = _.escape(data);
    cb(data);
  }

  const text = fs
    .readFileSync(p.join(DIRNAME, "../../views/html.jazz"))
    .toString();
  const template = jazz.compile(text);
  const params = { results: results, escape: _escape };
  let applied;

  // jazz's compiled template invokes its callback synchronously as long as
  // every custom template function (e.g. escape above) does the same.
  template.process(params, function (result) {
    applied = result;
  });

  return applied;
}

const exports = {
  format: format,
};

export { exports as default };
