"use strict";
import fs from "fs";

import referee from "@sinonjs/referee";
import sinon from "sinon";

import dnsChecker from "../lib/checkers/dns.js";
import httpChecker from "../lib/checkers/http.js";
import tcpChecker from "../lib/checkers/tcp.js";
import Health from "../lib/health.js";
const assert = referee.assert;

describe("health - constructor", function () {
  it("should set opts when specified", function () {
    const health = new Health({ some: "opt" });
    assert.equals(health.opts, { some: "opt" });
  });

  it("should default opts to empty object when unspecified", function () {
    assert.equals(new Health().opts, {});
  });

  it("should expose supported protocols", function () {
    assert.equals(Health.PROTOCOLS, [
      "http",
      "https",
      "http2",
      "tcp",
      "udp",
      "dns",
      "tls",
      "websocket",
      "ws",
      "ntp",
    ]);
  });
});

describe("health - init", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should copy sample health.yaml without overwriting when called", function (done) {
    sinon.stub(fs, "copyFile").callsFake(function (src, dest, mode, cb) {
      assert.isTrue(/\/examples\/health\.yaml$/.test(src));
      assert.equals(dest, "health.yaml");
      assert.equals(mode, fs.constants.COPYFILE_EXCL);
      cb(null);
    });
    new Health().init(function (err, result) {
      assert.isNull(err);
      assert.equals(result, "health.yaml");
      done();
    });
  });

  it("should pass error to callback when sample file cannot be copied", function (done) {
    sinon.stub(fs, "copyFile").callsArgWith(3, new Error("EEXIST"));
    new Health().init(function (err, result) {
      assert.equals(err.message, "EEXIST");
      assert.isUndefined(result);
      done();
    });
  });
});

describe("health - check", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should pass error to callback when protocol is unknown", function (done) {
    new Health().check({ protocol: "gopher" }, function (err, result) {
      assert.equals(
        err.message,
        'Unknown protocol "gopher" (supported: http, https, http2, tcp, udp, dns, tls, websocket, ws, ntp)',
      );
      assert.isUndefined(result);
      done();
    });
  });

  it("should report ok result when expectation matches", function (done) {
    sinon.stub(httpChecker, "check").callsFake(function (request, cb) {
      assert.equals(request, { url: "https://somehost" });
      cb(null, { status: 200, headers: { "content-type": "text/html" } });
    });
    new Health().check(
      {
        name: "somecheck",
        protocol: "https",
        request: { url: "https://somehost" },
        expect: { status: 200, headers: { "Content-Type": "text/html" } },
      },
      function (err, result) {
        assert.isNull(err);
        assert.equals(result, {
          name: "somecheck",
          protocol: "https",
          ok: true,
          failures: [],
          result: { status: 200, headers: { "content-type": "text/html" } },
        });
        done();
      },
    );
  });

  it("should report failures when expectation does not match", function (done) {
    sinon.stub(httpChecker, "check").callsArgWith(1, null, { status: 500 });
    new Health().check(
      {
        protocol: "http",
        request: { url: "http://somehost" },
        expect: { status: 200 },
      },
      function (err, result) {
        assert.isNull(err);
        assert.equals(result.name, "http http://somehost");
        assert.isFalse(result.ok);
        assert.equals(result.failures, [
          { path: "status", message: "expected 200, got 500" },
        ]);
        done();
      },
    );
  });

  it("should report failed result instead of error when checker fails", function (done) {
    sinon.stub(tcpChecker, "check").callsArgWith(1, new Error("ECONNREFUSED"));
    new Health().check(
      { protocol: "tcp", request: { host: "somehost", port: 1 } },
      function (err, result) {
        assert.isNull(err);
        assert.equals(result, {
          name: "tcp somehost:1",
          protocol: "tcp",
          ok: false,
          error: "ECONNREFUSED",
          failures: [{ path: "", message: "check failed: ECONNREFUSED" }],
          result: null,
        });
        done();
      },
    );
  });

  it("should pass when no expectation and no request are specified", function (done) {
    sinon.stub(tcpChecker, "check").callsFake(function (request, cb) {
      assert.equals(request, {});
      cb(null, { connected: true });
    });
    new Health().check({ protocol: "tcp" }, function (err, result) {
      assert.isNull(err);
      assert.equals(result.name, "tcp");
      assert.isTrue(result.ok);
      done();
    });
  });

  it("should derive default name from request name or host when name is unspecified", function (done) {
    sinon.stub(dnsChecker, "check").callsArgWith(1, null, { count: 1 });
    sinon.stub(tcpChecker, "check").callsArgWith(1, null, {});
    const health = new Health();
    health.check(
      { protocol: "dns", request: { name: "somehost" } },
      function (err, dnsResult) {
        assert.equals(dnsResult.name, "dns somehost");
        health.check(
          { protocol: "tcp", request: { host: "somehost" } },
          function (err, tcpResult) {
            assert.equals(tcpResult.name, "tcp somehost:");
            done();
          },
        );
      },
    );
  });
});

describe("health - checkFile", function () {
  beforeEach(function () {
    sinon.stub(httpChecker, "check").callsArgWith(1, null, { status: 200 });
    sinon.stub(dnsChecker, "check").callsArgWith(1, null, { count: 1 });
  });

  afterEach(function () {
    sinon.restore();
  });

  function stubFile(content) {
    sinon.stub(fs, "readFile").callsFake(function (file, encoding, cb) {
      assert.equals(file, "some.yaml");
      assert.equals(encoding, "utf8");
      cb(null, content);
    });
  }

  it("should run single check when file has one document", function (done) {
    stubFile(
      "protocol: http\nrequest: { url: http://somehost }\nexpect: { status: 200 }\n",
    );
    new Health().checkFile("some.yaml", function (err, results) {
      assert.isNull(err);
      assert.equals(results.length, 1);
      assert.isTrue(results[0].ok);
      done();
    });
  });

  it("should run every check when file has a checks array", function (done) {
    stubFile(
      [
        "checks:",
        "  - { protocol: http, request: { url: http://a }, expect: { status: 200 } }",
        "  - { protocol: dns, request: { name: b }, expect: { count: 2 } }",
      ].join("\n"),
    );
    new Health().checkFile("some.yaml", function (err, results) {
      assert.isNull(err);
      assert.equals(
        results.map((r) => [r.name, r.ok]),
        [
          ["http http://a", true],
          ["dns b", false],
        ],
      );
      done();
    });
  });

  it("should run every document and skip empty ones when file has multiple documents", function (done) {
    stubFile(
      "---\nprotocol: http\nrequest: { url: http://a }\n---\n---\nprotocol: dns\nrequest: { name: b }\n",
    );
    new Health().checkFile("some.yaml", function (err, results) {
      assert.isNull(err);
      assert.equals(results.length, 2);
      done();
    });
  });

  it("should pass error to callback when file cannot be read", function (done) {
    sinon.stub(fs, "readFile").callsArgWith(2, new Error("ENOENT"));
    new Health().checkFile("missing.yaml", function (err) {
      assert.equals(err.message, "ENOENT");
      done();
    });
  });

  it("should pass error to callback when file is invalid YAML", function (done) {
    stubFile("protocol: [http\n");
    new Health().checkFile("some.yaml", function (err, results) {
      assert.isString(err.message);
      assert.isUndefined(results);
      done();
    });
  });

  it("should pass error to callback when a check has unknown protocol", function (done) {
    stubFile("protocol: gopher\n");
    new Health().checkFile("some.yaml", function (err) {
      assert.isTrue(/Unknown protocol "gopher"/.test(err.message));
      done();
    });
  });
});

describe("health - checkFiles", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should record results and errors per file when files are checked", function (done) {
    const checkFile = sinon.stub(Health.prototype, "checkFile");
    checkFile.withArgs("ok.yaml").callsArgWith(1, null, [{ ok: true }]);
    checkFile.withArgs("bad.yaml").callsArgWith(1, new Error("ENOENT"));
    new Health().checkFiles(["ok.yaml", "bad.yaml"], function (err, reports) {
      assert.isNull(err);
      assert.equals(reports.length, 2);
      assert.equals(reports[0], {
        file: "ok.yaml",
        error: null,
        results: [{ ok: true }],
      });
      assert.equals(reports[1].file, "bad.yaml");
      assert.equals(reports[1].error.message, "ENOENT");
      assert.equals(reports[1].results, []);
      done();
    });
  });
});
