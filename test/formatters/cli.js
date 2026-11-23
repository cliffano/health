"use strict";
import "colors";
import referee from "@sinonjs/referee";
import cli from "../../lib/formatters/cli.js";
import Result from "../../lib/result.js";
const assert = referee.assert;

describe("cli - format", function () {
  it("should format cli line properly when desc exists", function () {
    const result = new Result();
    result.setUri("http://somehost");
    result.addSuccess("somesuccess");
    result.setDuration(20);
    result.success();

    const out = cli.format([result]);
    assert.equals(out, [
      "success".green + " - " + "http://somehost".cyan + " - 20ms",
      " * somesuccess",
      "",
    ]);
  });

  it("should format cli line properly when name exists", function () {
    const result = new Result();
    result.setUri("http://somehost");
    result.setName("someapp");
    result.setDuration(20);
    result.success();

    const out = cli.format([result]);
    assert.equals(out, [
      "success".green + " - someapp - " + "http://somehost".cyan + " - 20ms",
      "",
    ]);
  });

  it("should colourise status and uri and exclude name and desc from cli line when they do not exist", function () {
    const result = new Result();
    result.setUri("http://somehost");
    result.setDuration(20);
    result.success();

    const out = cli.format([result]);
    assert.equals(out, [
      "success".green + " - " + "http://somehost".cyan + " - 20ms",
      "",
    ]);
  });
});
