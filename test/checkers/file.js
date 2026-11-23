"use strict";
import fs from "fs";
import referee from "@sinonjs/referee";
import sinon from "sinon";
import checker from "../../lib/checkers/file.js";
const assert = referee.assert;

describe("file - check", function () {
  beforeEach(function () {
    this.mockFs = sinon.mock(fs);
    this.mockStats = sinon.mock(fs.Stats);
  });

  afterEach(function () {
    this.mockFs.verify();
    sinon.restore();
  });

  it("should have fail status when an error occurs while stat-ing the file", function (done) {
    this.mockFs
      .expects("lstat")
      .once()
      .withArgs("/tmp")
      .callsArgWith(1, new Error("some error"));
    const setup = { uri: "file:///tmp" };
    checker.check(setup, function (err, result) {
      assert.isNull(err);
      assert.isTrue(result.isError());
      assert.equals(result.getErrors(), ["some error"]);
      done();
    });
  });

  it("should have success status when there is no error while stat-ing the file", function (done) {
    const mockStats = { mode: 98765 };
    this.mockFs
      .expects("lstat")
      .once()
      .withArgs("/tmp")
      .callsArgWith(1, null, mockStats);
    const setup = { uri: "file:///tmp" };
    checker.check(setup, function (err, result) {
      assert.isNull(err);
      assert.isTrue(result.isSuccess());
      done();
    });
  });

  it("should have fail status when mode does not match expectation", function (done) {
    const mockStats = { mode: 98765 };
    this.mockFs
      .expects("lstat")
      .once()
      .withArgs("/tmp")
      .callsArgWith(1, null, mockStats);
    const setup = { uri: "file:///tmp", mode: "777" };
    checker.check(setup, function (err, result) {
      assert.isNull(err);
      assert.isTrue(result.isFail());
      assert.equals(result.getFailures(), [
        "Mode 715 does not match the expected 777",
      ]);
      done();
    });
  });

  it("should have success status when mode matches expectation", function (done) {
    const mockStats = { mode: 16895 };
    this.mockFs
      .expects("lstat")
      .once()
      .withArgs("/tmp")
      .callsArgWith(1, null, mockStats);
    const setup = { uri: "file:///tmp", mode: "777" };
    checker.check(setup, function (err, result) {
      assert.isNull(err);
      assert.isTrue(result.isSuccess());
      assert.equals(result.getSuccesses(), ["Mode 777 as expected"]);
      done();
    });
  });

  it("should have success status when mode matches expected regular expression", function (done) {
    const mockStats = { mode: 16895 };
    this.mockFs
      .expects("lstat")
      .once()
      .withArgs("/tmp")
      .callsArgWith(1, null, mockStats);
    const setup = { uri: "file:///tmp", mode: "7{3}" };
    checker.check(setup, function (err, result) {
      assert.isNull(err);
      assert.isTrue(result.isSuccess());
      assert.equals(result.getSuccesses(), ["Mode 777 as expected"]);
      done();
    });
  });

  it("should have success status when mode matches expectation and mode is an array with single item", function (done) {
    const mockStats = { mode: 16895 };
    this.mockFs
      .expects("lstat")
      .once()
      .withArgs("/tmp")
      .callsArgWith(1, null, mockStats);
    const setup = { uri: "file:///tmp", mode: ["777"] };
    checker.check(setup, function (err, result) {
      assert.isNull(err);
      assert.isTrue(result.isSuccess());
      assert.equals(result.getSuccesses(), ["Mode 777 as expected"]);
      done();
    });
  });

  it("should have fail status when mode expects multiple matches and only one actually matches", function (done) {
    const mockStats = { mode: 16895 };
    this.mockFs
      .expects("lstat")
      .once()
      .withArgs("/tmp")
      .callsArgWith(1, null, mockStats);
    const setup = { uri: "file:///tmp", mode: ["777", "666"] };
    checker.check(setup, function (err, result) {
      assert.isNull(err);
      assert.isTrue(result.isFail());
      assert.equals(result.getSuccesses(), ["Mode 777 as expected"]);
      assert.equals(result.getFailures(), [
        "Mode 777 does not match the expected 666",
      ]);
      done();
    });
  });

  it("should have success status when mode is either and it specifies multiple values and one matches", function (done) {
    const mockStats = { mode: 16895 };
    this.mockFs
      .expects("lstat")
      .once()
      .withArgs("/tmp")
      .callsArgWith(1, null, mockStats);
    const setup = { uri: "file:///tmp", "mode-or": ["777", "666"] };
    checker.check(setup, function (err, result) {
      assert.isNull(err);
      assert.isTrue(result.isSuccess());
      assert.equals(result.getSuccesses(), ["Mode 777 as expected"]);
      assert.equals(result.getFailures(), []);
      done();
    });
  });
});
