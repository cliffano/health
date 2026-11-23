"use strict";
import referee from "@sinonjs/referee";
import checker from "../lib/checker.js";
import Result from "../lib/result.js";
const assert = referee.assert;

describe("checker - allMustPass", function () {
  beforeEach(function () {
    this.result = new Result();
  });

  it("should have successes and no failure when all items pass checking", function () {
    function check(item) {
      return item + " success";
    }
    const items = ["foo", "bar"];
    checker.allMustPass(items, check, this.result);
    assert.isTrue(this.result.hasSuccess());
    assert.isFalse(this.result.hasFailure());
    assert.equals(this.result.getSuccesses(), ["foo success", "bar success"]);
  });

  it("should have successes and failures when some items pass and some items fail checking", function () {
    function check(item) {
      if (item === "foo") {
        return item + " success";
      } else {
        throw new Error(item + " failure");
      }
    }
    const items = ["foo", "bar"];
    checker.allMustPass(items, check, this.result);
    assert.isTrue(this.result.hasSuccess());
    assert.isTrue(this.result.hasFailure());
    assert.equals(this.result.getSuccesses(), ["foo success"]);
    assert.equals(this.result.getFailures(), ["bar failure"]);
  });

  it("should have failures and no success when all items fail checking", function () {
    function check(item) {
      throw new Error(item + " failure");
    }
    const items = ["foo", "bar"];
    checker.allMustPass(items, check, this.result);
    assert.isFalse(this.result.hasSuccess());
    assert.isTrue(this.result.hasFailure());
    assert.equals(this.result.getFailures(), ["foo failure", "bar failure"]);
  });
});

describe("checker - oneMustPass", function () {
  beforeEach(function () {
    this.result = new Result();
  });

  it("should have successes and no failure when all items pass checking", function () {
    function check(item) {
      return item + " success";
    }
    const items = ["foo", "bar"];
    checker.oneMustPass(items, check, this.result);
    assert.isTrue(this.result.hasSuccess());
    assert.isFalse(this.result.hasFailure());
    assert.equals(this.result.getSuccesses(), ["foo success", "bar success"]);
  });

  it("should have successes and no failure when some items pass and some items fail checking", function () {
    function check(item) {
      if (item === "foo") {
        return item + " success";
      } else {
        throw new Error(item + " failure");
      }
    }
    const items = ["foo", "bar"];
    checker.oneMustPass(items, check, this.result);
    assert.isTrue(this.result.hasSuccess());
    assert.isFalse(this.result.hasFailure());
    assert.equals(this.result.getSuccesses(), ["foo success"]);
  });

  it("should have failures and no success when all items fail checking", function () {
    function check(item) {
      throw new Error(item + " failure");
    }
    const items = ["foo", "bar"];
    checker.oneMustPass(items, check, this.result);
    assert.isFalse(this.result.hasSuccess());
    assert.isTrue(this.result.hasFailure());
    assert.equals(this.result.getFailures(), ["foo failure", "bar failure"]);
  });
});

describe("checker - checkAttribute", function () {
  beforeEach(function () {
    this.result = new Result();
  });

  it("should have successes and no failure when all items pass checking", function () {
    function check(item) {
      return item + " success";
    }
    const setup = { someattribute: ["foo", "bar"] };
    checker.checkAttribute("someattribute", setup, check, this.result);
    assert.isTrue(this.result.hasSuccess());
    assert.isFalse(this.result.hasFailure());
    assert.equals(this.result.getSuccesses(), ["foo success", "bar success"]);
  });

  it("should have successes and no failure when all items pass checking and attribute is a single value", function () {
    function check(item) {
      return item + " success";
    }
    const setup = { someattribute: "foo" };
    checker.checkAttribute("someattribute", setup, check, this.result);
    assert.isTrue(this.result.hasSuccess());
    assert.isFalse(this.result.hasFailure());
    assert.equals(this.result.getSuccesses(), ["foo success"]);
  });

  it("should have successes and no failure when attribute has -or prefix and only one expectation matches", function () {
    function check(item) {
      if (item === "foo") {
        return item + " success";
      } else {
        throw new Error(item + " failure");
      }
    }
    const setup = { "someattribute-or": ["foo", "bar"] };
    checker.checkAttribute("someattribute", setup, check, this.result);
    assert.isTrue(this.result.hasSuccess());
    assert.isFalse(this.result.hasFailure());
    assert.equals(this.result.getSuccesses(), ["foo success"]);
  });

  it("should have no success and no failure when attribute does not exist in setup", function () {
    function check(item) {
      if (item === "foo") {
        return item + " success";
      } else {
        throw new Error(item + " failure");
      }
    }
    const setup = {};
    checker.checkAttribute("someattribute", setup, check, this.result);
    assert.isFalse(this.result.hasSuccess());
    assert.isFalse(this.result.hasFailure());
  });
});
