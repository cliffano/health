"use strict";
/**
 * Health command line interface.
 *
 * @module cli
 */
import p from "path";
import { fileURLToPath } from "url";

import bag from "bagofcli";

import Health from "./health.js";
import reporter from "./reporter.js";

const DIRNAME = p.dirname(fileURLToPath(import.meta.url));
const DEFAULT_FILE = "health.yaml";

/**
 * Create a sample health.yaml expectation file.
 *
 * @private
 */
function _init() {
  new Health().init(
    bag.exitCb(null, function (file) {
      console.log(`Creating sample expectation file: ${file}`);
    }),
  );
}

/**
 * Run the checks in the specified YAML files, default health.yaml, then
 * exit with code 0 when every check passes, 1 otherwise.
 *
 * @param {Object} args - parsed command options and positional args
 * @private
 */
function _check(args) {
  const files = args.args && args.args.length > 0 ? args.args : [DEFAULT_FILE];
  new Health().checkFiles(files, function (err, reports) {
    if (err) {
      bag.exit(err);
      return;
    }
    const output = reporter.report(reports, { verbose: args.verbose === true });
    output.lines.forEach(function (line) {
      console.log(line);
    });
    process.exit(output.failed > 0 ? 1 : 0);
  });
}

/**
 * Execute Health CLI.
 */
function exec() {
  const actions = {
    commands: {
      init: { action: _init },
      check: { action: _check },
    },
  };

  bag.command(DIRNAME, actions);
}

export default { exec };
