"use strict";
import bag from "bagofcli";
import cache from "memory-cache";
import fsx from "fs-extra";
import referee from "@sinonjs/referee";
import sinon from "sinon";
import Health from "../lib/health.js";
import Result from "../lib/result.js";
const assert = referee.assert;

describe("health - health", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should set opts if specified via constructor", function () {
    const health = new Health({
      setup: { uri: "http://somehost" },
      formatter: "json",
    });
    assert.equals(health.opts.setup, { uri: "http://somehost" });
    assert.equals(health.opts.formatter, "json");
  });

  it("should set default opts if unspecified via constructor", function () {
    const health = new Health();
    assert.equals(health.opts.setup, "health.json");
    assert.isUndefined(health.opts.formatter);
  });
});

describe("health - init", function () {
  beforeEach(function () {
    this.mockConsole = sinon.mock(console);
  });

  afterEach(function () {
    this.mockConsole.verify();
    sinon.restore();
  });

  it("should copy sample health.js file to current directory when init is called", function (done) {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Creating sample setup file: health.json");
    sinon.stub(fsx, "copy").callsFake(function (src, dest, cb) {
      assert.isTrue(src.match(/\/examples\/health.json$/).length === 1);
      assert.equals(dest, "health.json");
      cb();
    });
    const health = new Health();
    health.init(function (err) {
      assert.isUndefined(err);
      done();
    });
  });
});

describe("health - clearCache", function () {
  beforeEach(function () {
    this.mockCache = sinon.mock(cache);
  });

  afterEach(function () {
    this.mockCache.verify();
    sinon.restore();
  });

  it("should call clear", function () {
    this.mockCache.expects("clear").once().withExactArgs();
    const health = new Health();
    health.clearCache();
  });
});

describe("health - check", function () {
  beforeEach(function () {
    this.mockCache = sinon.mock(cache);
  });

  afterEach(function () {
    this.mockCache.verify();
    sinon.restore();
  });

  it("should pass error when uri has unsupported protocol", function (done) {
    const health = new Health({
      setup: [{ uri: "httpx://somehost" }],
    });
    health.check(function (err, results) {
      assert.equals(
        err.message,
        "Unsupported protocol for URI httpx://somehost",
      );
      assert.isUndefined(results);
      done();
    });
  });

  it("should pass error when uri has unsupported protocol and setup uses file", function (done) {
    const health = new Health({
      setup: "/some/path/health.json",
    });
    sinon.stub(bag, "lookupFile").callsFake(function (file) {
      assert.equals(file, "/some/path/health.json");
      return '[{ "uri": "httpx://somehost" }]';
    });
    health.check(function (err, results) {
      assert.equals(
        err.message,
        "Unsupported protocol for URI httpx://somehost",
      );
      assert.isUndefined(results);
      done();
    });
  });

  it("should pass result with cached data when result is already cached (cache hit)", function (done) {
    this.mockCache
      .expects("get")
      .once()
      .withExactArgs("http://somehost")
      .returns({ uri: "http://somehost", status: "success", duration: 15 });
    const health = new Health({
      setup: [{ uri: "http://somehost" }],
    });
    health.check(function (err, results) {
      assert.isNull(err);
      assert.equals(results.length, 1);
      assert.equals(results[0].uri, "http://somehost");
      assert.equals(results[0].status, "success");
      assert.equals(results[0].duration, 15);
      done();
    });
  });

  it("should pass result with check result when it is not already cached (cache miss) and the result is then cached", function (done) {
    const result = new Result();
    result.success();
    this.mockCache
      .expects("get")
      .once()
      .withExactArgs("http://somehost")
      .returns(null);
    this.mockCache
      .expects("put")
      .once()
      .withExactArgs("http://somehost", result, 10000);
    const health = new Health({
      setup: [{ name: "someapp", uri: "http://somehost" }],
    });
    health._checker = function () {
      return {
        check: function (setup, cb) {
          cb(null, result);
        },
      };
    };
    health.check(function (err, results) {
      assert.isNull(err);
      assert.equals(results.length, 1);
      assert.equals(results[0].getName(), "someapp");
      assert.equals(results[0].getUri(), "http://somehost");
      assert.isTrue(results[0].isSuccess());
      assert.isNumber(results[0].getDuration());
      assert.isObject(results[0].getTimestamp());
      done();
    });
  });

  it("should format data when formatter opt string is specified", function (done) {
    const result = new Result();
    sinon.useFakeTimers({ now: 0, toFake: ["Date"] });
    result.setUri("http://somehost");
    result.success();
    this.mockCache
      .expects("get")
      .once()
      .withExactArgs("http://somehost")
      .returns(null);
    this.mockCache
      .expects("put")
      .once()
      .withExactArgs("http://somehost", result, 5000);
    const health = new Health({
      setup: [{ uri: "http://somehost", ttl: 5000 }],
      formatter: "text",
    });
    health._checker = function () {
      return {
        check: function (setup, cb) {
          cb(null, result);
        },
      };
    };
    health.check(function (err, results) {
      assert.isNull(err);
      assert.equals(results.length, 1);
      assert.equals(results[0], "success - http://somehost - 0ms");
      done();
    });
  });

  it("should pass error when an error occurs while checking a resource", function (done) {
    this.mockCache
      .expects("get")
      .once()
      .withExactArgs("http://somehost")
      .returns(null);
    const health = new Health({
      setup: [{ uri: "http://somehost", ttl: 5000 }],
    });
    health._checker = function () {
      return {
        check: function (setup, cb) {
          cb(new Error("some error"));
        },
      };
    };
    health.check(function (err, results) {
      assert.equals(err.message, "some error");
      assert.isUndefined(results);
      done();
    });
  });

  it("should format data when formatter opt function is specified", function (done) {
    const result = new Result();
    sinon.useFakeTimers({ now: 0, toFake: ["Date"] });
    result.setUri("http://somehost");
    result.success();
    this.mockCache
      .expects("get")
      .once()
      .withExactArgs("http://somehost")
      .returns(null);
    this.mockCache
      .expects("put")
      .once()
      .withExactArgs("http://somehost", result, 5000);
    const health = new Health({
      setup: [{ uri: "http://somehost", ttl: 5000 }],
      formatter: function (results) {
        let formatted = "";
        results.forEach(function (result) {
          formatted = result.getUri() + ": " + result.getStatus() + "\n";
        });
        return formatted;
      },
    });
    health._checker = function () {
      return {
        check: function (setup, cb) {
          cb(null, result);
        },
      };
    };
    health.check(function (err, result) {
      assert.isNull(err);
      assert.equals(result, "http://somehost: success\n");
      done();
    });
  });
});

describe("health - _singleResultRules", function () {
  beforeEach(function () {
    this.health = new Health();
  });

  it("should set name if it exists", function () {
    const result = new Result();
    const setup = { name: "somename", uri: "http://somehost" };
    this.health._singleResultRules(result, setup);
    assert.equals(result.getName(), "somename");
  });

  it("should set status to warning when result is fail and lenient is true", function () {
    const result = new Result();
    const setup = { name: "somename", uri: "http://somehost", lenient: true };
    result.fail();
    this.health._singleResultRules(result, setup);
    assert.isTrue(result.isWarning());
  });

  it("should set status to warning when result is error and lenient is true", function () {
    const result = new Result();
    const setup = { name: "somename", uri: "http://somehost", lenient: true };
    result.error();
    this.health._singleResultRules(result, setup);
    assert.equals(result.status, "warning");
  });

  it("should mask password with asterisks", function () {
    const result = new Result();
    const setup = { name: "somename", uri: "http://user:pass@somehost" };
    this.health._singleResultRules(result, setup);
    assert.equals(result.getUri(), "http://user:****@somehost/");
  });
});

describe("health - _multiResultsRules", function () {
  beforeEach(function () {
    this.health = new Health();
  });

  it("should leave all results as-is when there is no specified group", function () {
    const result1 = new Result();
    const result2 = new Result();
    const result3 = new Result();
    const result4 = new Result();

    result1.setName("somename1");
    result1.setUri("http://somehost1");
    result1.fail();
    result2.setName("somename2");
    result2.setUri("http://somehost2");
    result2.success();
    result3.setName("somename3");
    result3.setUri("http://somehost3");
    result3.error();
    result4.setName("somename4");
    result4.setUri("http://somehost4");
    result4.warning();

    let results = [result1, result2, result3, result4];
    const setup = [
      { name: "somename1", uri: "http://somehost1" },
      { name: "somename2", uri: "http://somehost2" },
      { name: "somename3", uri: "http://somehost3" },
      { name: "somename4", uri: "http://somehost4" },
    ];
    results = this.health._multiResultsRules(results, setup);
    assert.isTrue(results[0].isFail());
    assert.isTrue(results[1].isSuccess());
    assert.isTrue(results[2].isError());
    assert.isTrue(results[3].isWarning());
  });

  it("should change status fail and error to warning when not all group members have non-success status", function () {
    const result1 = new Result();
    const result2 = new Result();
    const result3 = new Result();
    const result4 = new Result();

    result1.setName("somename1");
    result1.setUri("http://somehost1");
    result1.fail();
    result2.setName("somename2");
    result2.setUri("http://somehost2");
    result2.success();
    result3.setName("somename3");
    result3.setUri("http://somehost3");
    result3.error();
    result4.setName("somename4");
    result4.setUri("http://somehost4");
    result4.warning();

    let results = [result1, result2, result3, result4];
    const setup = [
      { name: "somename1", uri: "http://somehost1", group: "somegroup" },
      { name: "somename2", uri: "http://somehost2", group: "somegroup" },
      { name: "somename3", uri: "http://somehost3", group: "somegroup" },
      { name: "somename4", uri: "http://somehost4", group: "somegroup" },
    ];
    results = this.health._multiResultsRules(results, setup);
    assert.isTrue(results[0].isWarning());
    assert.isTrue(results[1].isSuccess());
    assert.isTrue(results[2].isWarning());
    assert.isTrue(results[3].isWarning());
  });

  it("should change status warning to fail when all group members have non-success status", function () {
    const result1 = new Result();
    const result2 = new Result();
    const result3 = new Result();
    const result4 = new Result();

    result1.setName("somename1");
    result1.setUri("http://somehost1");
    result1.fail();
    result2.setName("somename2");
    result2.setUri("http://somehost2");
    result2.fail();
    result3.setName("somename3");
    result3.setUri("http://somehost3");
    result3.warning();
    result4.setName("somename4");
    result4.setUri("http://somehost4");
    result4.error();

    let results = [result1, result2, result3, result4];
    const setup = [
      { name: "somename1", uri: "http://somehost1", group: "somegroup" },
      { name: "somename2", uri: "http://somehost2", group: "somegroup" },
      { name: "somename3", uri: "http://somehost3", group: "somegroup" },
      { name: "somename4", uri: "http://somehost4", group: "somegroup" },
    ];
    results = this.health._multiResultsRules(results, setup);
    assert.isTrue(results[0].isFail());
    assert.isTrue(results[1].isFail());
    assert.isTrue(results[2].isFail());
    assert.isTrue(results[3].isError());
  });

  it("should change status warning to fail when group is weighted and members do not pass the weight", function () {
    const result1 = new Result();
    const result2 = new Result();
    const result3 = new Result();
    const result4 = new Result();
    const result5 = new Result();

    result1.setName("somename1");
    result1.setUri("http://somehost1");
    result1.fail();
    result2.setName("somename2");
    result2.setUri("http://somehost2");
    result2.fail();
    result3.setName("somename3");
    result3.setUri("http://somehost3");
    result3.warning();
    result4.setName("somename4");
    result4.setUri("http://somehost4");
    result4.error();
    result5.setName("somename5");
    result5.setUri("http://somehost5");
    result5.success();

    let results = [result1, result2, result3, result4, result5];
    const setup = [
      { name: "somename1", uri: "http://somehost1", group: "somegroup-50" },
      { name: "somename2", uri: "http://somehost2", group: "somegroup-50" },
      { name: "somename3", uri: "http://somehost3", group: "somegroup-50" },
      { name: "somename4", uri: "http://somehost4", group: "somegroup-50" },
      { name: "somename5", uri: "http://somehost5", group: "somegroup-50" },
    ];
    results = this.health._multiResultsRules(results, setup);
    assert.isTrue(results[0].isFail());
    assert.isTrue(results[1].isFail());
    assert.isTrue(results[2].isFail());
    assert.isTrue(results[3].isError());
    assert.isTrue(results[4].isSuccess());
  });

  it("should change status fail and error to warning when group is weighted and members pass the weight", function () {
    const result1 = new Result();
    const result2 = new Result();
    const result3 = new Result();
    const result4 = new Result();
    const result5 = new Result();

    result1.setName("somename1");
    result1.setUri("http://somehost1");
    result1.fail();
    result2.setName("somename2");
    result2.setUri("http://somehost2");
    result2.fail();
    result3.setName("somename3");
    result3.setUri("http://somehost3");
    result3.warning();
    result4.setName("somename4");
    result4.setUri("http://somehost4");
    result4.error();
    result5.setName("somename5");
    result5.setUri("http://somehost5");
    result5.success();

    let results = [result1, result2, result3, result4, result5];
    const setup = [
      { name: "somename1", uri: "http://somehost1", group: "somegroup-20" },
      { name: "somename2", uri: "http://somehost2", group: "somegroup-20" },
      { name: "somename3", uri: "http://somehost3", group: "somegroup-20" },
      { name: "somename4", uri: "http://somehost4", group: "somegroup-20" },
      { name: "somename5", uri: "http://somehost5", group: "somegroup-20" },
    ];
    results = this.health._multiResultsRules(results, setup);
    assert.isTrue(results[0].isWarning());
    assert.isTrue(results[1].isWarning());
    assert.isTrue(results[2].isWarning());
    assert.isTrue(results[3].isWarning());
    assert.isTrue(results[4].isSuccess());
  });

  it("should change and keep status accordingly when there are multiple groups", function () {
    const result1 = new Result();
    const result2 = new Result();
    const result3 = new Result();
    const result4 = new Result();
    const result5 = new Result();
    const result6 = new Result();
    const result7 = new Result();
    const result8 = new Result();

    result1.setName("somename1");
    result1.setUri("http://somehost1");
    result1.fail();
    result2.setName("somename2");
    result2.setUri("http://somehost2");
    result2.fail();
    result3.setName("somename3");
    result3.setUri("http://somehost3");
    result3.warning();
    result4.setName("somename4");
    result4.setUri("http://somehost4");
    result4.error();
    result5.setName("somename5");
    result5.setUri("http://somehost5");
    result5.fail();
    result6.setName("somename6");
    result6.setUri("http://somehost6");
    result6.success();
    result7.setName("somename7");
    result7.setUri("http://somehost7");
    result7.error();
    result8.setName("somename8");
    result8.setUri("http://somehost8");
    result8.warning();

    let results = [
      result1,
      result2,
      result3,
      result4,
      result5,
      result6,
      result7,
      result8,
    ];
    const setup = [
      { name: "somename1", uri: "http://somehost1", group: "somegroupA" },
      { name: "somename2", uri: "http://somehost2", group: "somegroupA" },
      { name: "somename3", uri: "http://somehost3", group: "somegroupA" },
      { name: "somename4", uri: "http://somehost4", group: "somegroupA" },
      { name: "somename5", uri: "http://somehost5", group: "somegroupB" },
      { name: "somename6", uri: "http://somehost6", group: "somegroupB" },
      { name: "somename7", uri: "http://somehost7", group: "somegroupB" },
      { name: "somename8", uri: "http://somehost8", group: "somegroupB" },
    ];
    results = this.health._multiResultsRules(results, setup);
    assert.isTrue(results[0].isFail());
    assert.isTrue(results[1].isFail());
    assert.isTrue(results[2].isFail());
    assert.isTrue(results[3].isError());
    assert.isTrue(results[4].isWarning());
    assert.isTrue(results[5].isSuccess());
    assert.isTrue(results[6].isWarning());
    assert.isTrue(results[7].isWarning());
  });
});

describe("health - _checker", function () {
  beforeEach(function () {
    this.health = new Health();
  });

  it("should use http checker when URI has http protocol", function () {
    const checker = this.health._checker("http://somehost");
    assert.isObject(checker);
  });

  it("should use http checker when URI has https protocol", function () {
    const checker = this.health._checker("https://somehost");
    assert.isObject(checker);
  });

  it("should have undefined checker when URI has unsupported protocol", function () {
    const checker = this.health._checker("httpx://somehost");
    assert.isUndefined(checker);
  });
});
