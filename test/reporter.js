"use strict";
import nodeUtil from "util";

import referee from "@sinonjs/referee";

import reporter from "../lib/reporter.js";
const assert = referee.assert;

function plain(lines) {
  return lines.map((line) => nodeUtil.stripVTControlCharacters(line));
}

describe("reporter - report", function () {
  it("should list passed checks with response time when available", function () {
    const output = reporter.report([
      {
        file: "some.yaml",
        error: null,
        results: [
          { name: "web", ok: true, failures: [], result: { responseTime: 42 } },
          { name: "dns", ok: true, failures: [], result: {} },
        ],
      },
    ]);
    assert.equals(plain(output.lines), [
      "some.yaml",
      "  ✓ web (42ms)",
      "  ✓ dns",
      "",
      "2 passed, 0 failed",
    ]);
    assert.equals(output.passed, 2);
    assert.equals(output.failed, 0);
  });

  it("should list failures with and without path when checks fail", function () {
    const output = reporter.report([
      {
        file: "some.yaml",
        error: null,
        results: [
          {
            name: "web",
            ok: false,
            failures: [{ path: "status", message: "expected 200, got 500" }],
            result: { status: 500 },
          },
          {
            name: "tcp",
            ok: false,
            failures: [{ path: "", message: "check failed: ECONNREFUSED" }],
            result: null,
          },
        ],
      },
    ]);
    assert.equals(plain(output.lines), [
      "some.yaml",
      "  ✗ web",
      "      status: expected 200, got 500",
      "  ✗ tcp",
      "      check failed: ECONNREFUSED",
      "",
      "0 passed, 2 failed",
    ]);
    assert.equals(output.failed, 2);
  });

  it("should count unreadable file as failed when file has an error", function () {
    const output = reporter.report([
      { file: "missing.yaml", error: new Error("ENOENT"), results: [] },
    ]);
    assert.equals(plain(output.lines), [
      "missing.yaml",
      "  ✗ could not run file: ENOENT",
      "",
      "0 passed, 1 failed",
    ]);
    assert.equals(output.failed, 1);
  });

  it("should include full captured result when verbose is true", function () {
    const output = reporter.report(
      [
        {
          file: "some.yaml",
          error: null,
          results: [
            { name: "web", ok: true, failures: [], result: { status: 200 } },
            { name: "tcp", ok: false, failures: [], result: null },
          ],
        },
      ],
      { verbose: true },
    );
    assert.equals(plain(output.lines), [
      "some.yaml",
      "  ✓ web",
      '      {\n        "status": 200\n      }',
      "  ✗ tcp",
      "",
      "1 passed, 1 failed",
    ]);
  });
});
