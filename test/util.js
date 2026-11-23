"use strict";
import referee from "@sinonjs/referee";
import sinon from "sinon";

import util from "../lib/util.js";
const assert = referee.assert;

describe("util - once", function () {
  it("should only pass the first call through when called multiple times", function () {
    const cb = sinon.spy();
    const wrapped = util.once(cb);
    wrapped(null, "first");
    wrapped(new Error("second"));
    assert.equals(cb.callCount, 1);
    assert.isTrue(cb.calledWithExactly(null, "first"));
  });
});

describe("util - elapsed", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should return rounded milliseconds when given a start mark", function () {
    sinon.stub(performance, "now").returns(1000.6);
    assert.equals(util.elapsed(500), 501);
  });
});

describe("util - parseJson", function () {
  it("should return parsed value when text is valid JSON", function () {
    assert.equals(util.parseJson('{"a":1}'), { a: 1 });
  });

  it("should return undefined when text is not valid JSON", function () {
    assert.isUndefined(util.parseJson("<html>"));
  });
});

describe("util - daysRemaining", function () {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(function () {
    this.clock.restore();
  });

  it("should return whole days until expiry when date is specified", function () {
    assert.equals(util.daysRemaining("Jan 11 12:00:00 2026 GMT"), 10);
  });

  it("should return negative days when certificate has expired", function () {
    assert.equals(util.daysRemaining("Dec 30 00:00:00 2025 GMT"), -2);
  });

  it("should return undefined when date is unspecified", function () {
    assert.isUndefined(util.daysRemaining(undefined));
  });
});

describe("util - payload", function () {
  it("should prefer hex payload when both hex and text are specified", function () {
    assert.equals(util.payload("6869", "ignored").toString(), "hi");
  });

  it("should use text payload when hex is unspecified", function () {
    assert.equals(util.payload(undefined, "hello").toString(), "hello");
  });

  it("should return undefined when no payload is specified", function () {
    assert.isUndefined(util.payload(undefined, undefined));
  });
});
