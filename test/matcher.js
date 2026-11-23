"use strict";
import referee from "@sinonjs/referee";

import matcher from "../lib/matcher.js";
const assert = referee.assert;

function pass(actual, expected) {
  assert.equals(matcher.match(actual, expected), []);
}

function fail(actual, expected, message) {
  const failures = matcher.match(actual, expected);
  assert.equals(failures.length, 1);
  if (message) {
    assert.equals(failures[0].message, message);
  }
}

describe("matcher - match scalars and arrays", function () {
  it("should pass when scalars are strictly equal", function () {
    pass(200, 200);
    pass("OK", "OK");
    pass(true, true);
  });

  it("should fail when scalars differ", function () {
    fail(200, 404, "expected 404, got 200");
    fail("200", 200, 'expected 200, got "200"');
    fail(undefined, 1, "expected 1, got undefined");
  });

  it("should deep compare when expected is an array", function () {
    pass(["a", { b: 1 }], ["a", { b: 1 }]);
    fail(["a"], ["a", "b"]);
    fail(["a", { b: 1 }], ["a", { b: 2 }]);
  });
});

describe("matcher - match objects", function () {
  it("should partially match when expected is a plain object", function () {
    pass({ a: 1, b: 2, c: { d: 3, e: 4 } }, { a: 1, c: { d: 3 } });
  });

  it("should fail with dotted path when a nested key differs", function () {
    const failures = matcher.match(
      { headers: { server: "nginx" } },
      { headers: { server: "apache" } },
    );
    assert.equals(failures, [
      { path: "headers.server", message: 'expected "apache", got "nginx"' },
    ]);
  });

  it("should fail when expected object but actual is not an object", function () {
    fail(null, { a: 1 }, "expected object, got null");
    fail("text", { a: 1 }, 'expected object, got "text"');
  });

  it("should treat an empty object as a partial match of anything object-like", function () {
    pass({ a: 1 }, {});
  });
});

describe("matcher - match equality operators", function () {
  it("should deep compare when $eq is used", function () {
    pass({ a: [1] }, { $eq: { a: [1] } });
    fail(
      { a: [1], b: 2 },
      { $eq: { a: [1] } },
      'expected {"a":[1]}, got {"a":[1],"b":2}',
    );
  });

  it("should require difference when $ne is used", function () {
    pass(3, { $ne: 2 });
    fail(2, { $ne: 2 }, "expected value different from 2");
  });
});

describe("matcher - match comparison operators", function () {
  it("should pass when numbers are within bounds", function () {
    pass(500, { $gt: 100, $lt: 1000 });
    pass(5, { $gte: 5, $lte: 5 });
    pass("42", { $gt: 41 });
  });

  it("should fail with a message per operator when out of bounds", function () {
    fail(1, { $gt: 1 }, "expected > 1, got 1");
    fail(0, { $gte: 1 }, "expected >= 1, got 0");
    fail(1, { $lt: 1 }, "expected < 1, got 1");
    fail(2, { $lte: 1 }, "expected <= 1, got 2");
    fail(undefined, { $gt: 0 }, "expected > 0, got undefined");
  });
});

describe("matcher - match $contains", function () {
  it("should check substring when actual is a string", function () {
    pass("hello world", { $contains: "world" });
    fail("hello", { $contains: "world" }, 'expected string to contain "world"');
  });

  it("should check membership when actual is an array", function () {
    pass(["a", "b"], { $contains: "b" });
    pass([{ x: 1 }], { $contains: { x: 1 } });
    fail(["a"], { $contains: "b" }, 'expected array to contain "b"');
  });

  it("should fail when actual is neither string nor array", function () {
    fail(42, { $contains: 4 }, "$contains not applicable to number");
  });
});

describe("matcher - match $matches", function () {
  it("should test regular expression when actual is a string", function () {
    pass("SSH-2.0-OpenSSH", { $matches: "^SSH-2\\.0" });
    fail(
      "HTTP/1.1",
      { $matches: "^SSH" },
      'expected match for /^SSH/, got "HTTP/1.1"',
    );
  });

  it("should fail when actual is not a string", function () {
    fail(200, { $matches: "200" });
  });
});

describe("matcher - match $exists", function () {
  it("should check presence when $exists is true", function () {
    pass("value", { $exists: true });
    pass(0, { $exists: true });
    fail(undefined, { $exists: true }, "expected present, got undefined");
    fail(null, { $exists: true });
  });

  it("should check absence when $exists is false", function () {
    pass(undefined, { $exists: false });
    fail("value", { $exists: false }, 'expected absent, got "value"');
  });
});

describe("matcher - match $in, $type, $length, $not", function () {
  it("should check membership when $in is used", function () {
    pass("TLSv1.3", { $in: ["TLSv1.2", "TLSv1.3"] });
    fail(
      "SSLv3",
      { $in: ["TLSv1.2"] },
      'expected one of ["TLSv1.2"], got "SSLv3"',
    );
    fail("TLSv1.3", { $in: "TLSv1.3" });
  });

  it("should check type when $type is used", function () {
    pass([1, 2], { $type: "array" });
    pass({}, { $type: "object" });
    pass("x", { $type: "string" });
    fail(null, { $type: "object" }, "expected type object, got null");
  });

  it("should match length with nested matcher when $length is used", function () {
    pass([1, 2, 3], { $length: { $gte: 2 } });
    pass("abc", { $length: 3 });
    const failures = matcher.match([1], { $length: { $gte: 2 } }, "records");
    assert.equals(failures, [
      { path: "records.$length", message: "expected >= 2, got 1" },
    ]);
  });

  it("should fail $length when actual is null or undefined", function () {
    fail(null, { $length: 0 });
    fail(undefined, { $length: 0 });
  });

  it("should negate nested matcher when $not is used", function () {
    pass(200, { $not: 500 });
    pass(3, { $not: { $in: [1, 2] } });
    fail(500, { $not: 500 }, "expected NOT to match 500");
  });
});

describe("matcher - match mixed keys", function () {
  it("should treat an object mixing operators and plain keys as partial match", function () {
    pass({ $gt: 0, a: 1, b: 2 }, { $gt: 0, a: 1 });
    fail({ a: 1 }, { $gt: 0, a: 1 }, "expected 0, got undefined");
  });
});
