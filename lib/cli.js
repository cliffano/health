"use strict";
import _ from "lodash";
import bag from "bagofcli";
import p from "path";
import { fileURLToPath } from "url";
import Health from "./health.js";
import cliFormatter from "./formatters/cli.js";
import htmlFormatter from "./formatters/html.js";
import textFormatter from "./formatters/text.js";

const DIRNAME = p.dirname(fileURLToPath(import.meta.url));

const FORMATTERS = {
  cli: cliFormatter,
  html: htmlFormatter,
  text: textFormatter,
};

function _init() {
  new Health().init(bag.exit);
}

function _check(args) {
  function log(result) {
    const formatted = FORMATTERS[args.formatter || "cli"].format(result);
    if (Array.isArray(formatted)) {
      formatted.forEach(function (line) {
        console.log(line);
      });
    } else {
      console.log(formatted);
    }
  }

  // determine exit code using the number of non-success status
  function exit(result) {
    const numNonSuccess =
      _.countBy(result, function (item) {
        return item.status === "success" ? "success" : "non-success";
      })["non-success"] || 0;
    process.exit(numNonSuccess);
  }

  const setup = JSON.parse(bag.lookupFile(args.setupFile || "health.json"));
  new Health({ setup: setup }).check(
    bag.exitCb(null, function (result) {
      log(result);
      exit(result);
    }),
  );
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

const exports = {
  exec: exec,
};

export { exports as default };
