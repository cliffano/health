"use strict";
/* eslint no-unused-vars: 0 */
import bag from "bagofcli";
import referee from "@sinonjs/referee";
import sinon from "sinon";
import cli from "../lib/cli.js";
import Health from "../lib/health.js";
import cliFormatter from "../lib/formatters/cli.js";
const assert = referee.assert;

describe("cli - exec", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should contain commands with actions", function (done) {
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

  it("should contain init command and delegate to health init when exec is called", function (done) {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands.init.action();
    });
    sinon.stub(Health.prototype, "init").callsFake(function (cb) {
      assert.equals(typeof cb, "function");
      done();
    });
    cli.exec();
  });
});

describe("cli - check", function () {
  beforeEach(function () {
    this.mockConsole = sinon.mock(console);
    this.mockFormatter = sinon.mock(cliFormatter);
    this.mockProcess = sinon.mock(process);
  });

  afterEach(function () {
    this.mockConsole.verify();
    this.mockFormatter.verify();
    this.mockProcess.verify();
    sinon.restore();
  });

  it("should log array items line by line", function () {
    this.mockConsole.expects("log").once().withExactArgs("someresult");
    this.mockProcess.expects("exit").twice().withExactArgs(0);
    this.mockFormatter
      .expects("format")
      .once()
      .withExactArgs([{ status: "success", name: "someapp", desc: "somedesc" }])
      .returns(["someresult"]);
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands.check.action({});
    });
    sinon.stub(bag, "lookupFile").callsFake(function (file) {
      assert.equals(file, "health.json");
      return '[ { "name": "gmail", "uri": "http://google.com" } ]';
    });
    sinon.stub(Health.prototype, "check").callsFake(function (cb) {
      cb(null, [{ status: "success", name: "someapp", desc: "somedesc" }]);
    });
    cli.exec();
  });

  it("should log string result as-is", function () {
    this.mockConsole.expects("log").once().withExactArgs("someresult");
    this.mockProcess.expects("exit").twice().withExactArgs(0);
    this.mockFormatter
      .expects("format")
      .once()
      .withExactArgs([{ status: "success", name: "someapp", desc: "somedesc" }])
      .returns("someresult");
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands.check.action({});
    });
    sinon.stub(bag, "lookupFile").callsFake(function (file) {
      assert.equals(file, "health.json");
      return '[ { "name": "gmail", "uri": "http://google.com" } ]';
    });
    sinon.stub(Health.prototype, "check").callsFake(function (cb) {
      cb(null, [{ status: "success", name: "someapp", desc: "somedesc" }]);
    });
    cli.exec();
  });

  it("should exit process with the number of non-ok result", function () {
    this.mockConsole.expects("log").once().withExactArgs("someresult");
    this.mockProcess.expects("exit").once().withExactArgs(0);
    this.mockProcess.expects("exit").once().withExactArgs(2);
    this.mockFormatter.expects("format").once().returns("someresult");
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands.check.action({});
    });
    sinon.stub(bag, "lookupFile").callsFake(function (file) {
      assert.equals(file, "health.json");
      return '[ { "name": "gmail", "uri": "http://google.com" } ]';
    });
    sinon.stub(Health.prototype, "check").callsFake(function (cb) {
      cb(null, [
        { status: "fail", name: "someapp1", desc: "somedesc1" },
        { status: "success", name: "someapp2", desc: "somedesc2" },
        { status: "fail", name: "someapp3", desc: "somedesc3" },
      ]);
    });
    cli.exec();
  });
});
