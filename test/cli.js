"use strict";
import bag from "bagofcli";
import referee from "@sinonjs/referee";
import sinon from "sinon";

import cli from "../lib/cli.js";
import Health from "../lib/health.js";
import reporter from "../lib/reporter.js";
const assert = referee.assert;

describe("cli - exec", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should contain commands with actions when executed", function (done) {
    sinon.stub(bag, "command").value(function (base, actions) {
      assert.isString(base);
      assert.isFunction(actions.commands.init.action);
      assert.isFunction(actions.commands.check.action);
      done();
    });
    cli.exec();
  });
});

describe("cli - init", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should log created file and exit 0 when health init succeeds", function () {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands.init.action();
    });
    sinon.stub(Health.prototype, "init").callsArgWith(0, null, "health.yaml");
    const log = sinon.stub(console, "log");
    const exit = sinon.stub(process, "exit");
    cli.exec();
    assert.isTrue(
      log.calledWithExactly("Creating sample expectation file: health.yaml"),
    );
    assert.isTrue(exit.calledWithExactly(0));
  });
});

describe("cli - check", function () {
  beforeEach(function () {
    this.log = sinon.stub(console, "log");
    this.exit = sinon.stub(process, "exit");
  });

  afterEach(function () {
    sinon.restore();
  });

  function runCheck(args) {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands.check.action(args);
    });
    cli.exec();
  }

  it("should check health.yaml and exit 0 when no file is specified and all checks pass", function () {
    const reports = [{ file: "health.yaml", error: null, results: [] }];
    sinon.stub(Health.prototype, "checkFiles").callsFake(function (files, cb) {
      assert.equals(files, ["health.yaml"]);
      cb(null, reports);
    });
    sinon
      .stub(reporter, "report")
      .withArgs(reports, { verbose: false })
      .returns({ lines: ["line1", "line2"], passed: 1, failed: 0 });
    runCheck({ args: [] });
    assert.equals(this.log.callCount, 2);
    assert.isTrue(this.log.firstCall.calledWithExactly("line1"));
    assert.isTrue(this.exit.calledWithExactly(0));
  });

  it("should check specified files verbosely and exit 1 when a check fails", function () {
    sinon.stub(Health.prototype, "checkFiles").callsFake(function (files, cb) {
      assert.equals(files, ["a.yaml", "b.yaml"]);
      cb(null, []);
    });
    sinon
      .stub(reporter, "report")
      .withArgs([], { verbose: true })
      .returns({ lines: [], passed: 0, failed: 1 });
    runCheck({ args: ["a.yaml", "b.yaml"], verbose: true });
    assert.isTrue(this.exit.calledWithExactly(1));
  });

  it("should default to health.yaml when args are absent", function () {
    sinon.stub(Health.prototype, "checkFiles").callsFake(function (files, cb) {
      assert.equals(files, ["health.yaml"]);
      cb(null, []);
    });
    runCheck({});
    assert.isTrue(this.exit.calledWithExactly(0));
  });

  it("should exit with error when checks cannot be run", function () {
    sinon
      .stub(Health.prototype, "checkFiles")
      .callsArgWith(1, new Error("someerror"));
    const exitErr = sinon.stub(bag, "exit");
    runCheck({ args: ["a.yaml"] });
    assert.equals(exitErr.firstCall.args[0].message, "someerror");
  });
});
