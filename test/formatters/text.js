"use strict";
import referee from "@sinonjs/referee";
import text from "../../lib/formatters/text.js";
import Result from "../../lib/result.js";
const assert = referee.assert;

describe("text - format", function () {
  it("should format text properly when desc exists", function () {
    const result = new Result();
    result.setUri("http://somehost");
    result.setDescription("somedesc");
    result.setDuration(20);
    result.success();

    const out = text.format([result]);
    assert.equals(out, ["success - http://somehost - 20ms"]);
  });

  it("should format text properly when name exists", function () {
    const result = new Result();
    result.setUri("http://somehost");
    result.setName("someapp");
    result.setDuration(20);
    result.success();

    const out = text.format([result]);
    assert.equals(out, ["success - someapp - http://somehost - 20ms"]);
  });

  it("should exclude name and desc from text when they do not exist", function () {
    const result = new Result();
    result.setUri("http://somehost");
    result.setDuration(20);
    result.success();

    const out = text.format([result]);
    assert.equals(out, ["success - http://somehost - 20ms"]);
  });

  it("should format multiple texts properly", function () {
    const result1 = new Result();
    const result2 = new Result();

    result1.setUri("http://somehost1");
    result1.setName("someapp1");
    result1.addSuccess("somedesc1");
    result1.setDuration(20);
    result1.success();

    result2.setUri("http://somehost2");
    result2.setName("someapp2");
    result2.addFailure("somedesc2");
    result2.setDuration(20);
    result2.fail();

    const out = text.format([result1, result2]);
    assert.equals(out, [
      "success - someapp1 - http://somehost1 - 20ms",
      " * somedesc1",
      "fail - someapp2 - http://somehost2 - 20ms",
      " * somedesc2",
    ]);
  });
});
