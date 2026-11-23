"use strict";
import referee from "@sinonjs/referee";
import checker from "../../lib/checkers/https.js";
const assert = referee.assert;

describe("https", function () {
  it("should have check method", function () {
    assert.isFunction(checker.check);
  });
});
