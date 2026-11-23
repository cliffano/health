"use strict";
import dns from "dns";

import referee from "@sinonjs/referee";
import sinon from "sinon";

import checker from "../../lib/checkers/dns.js";
const assert = referee.assert;

function stubResolver(err, records) {
  const resolver = {
    setServers: sinon.spy(),
    resolve: sinon.spy(function (name, rrtype, cb) {
      cb(err, records);
    }),
  };
  const Resolver = sinon.stub(dns, "Resolver").returns(resolver);
  return { resolver, Resolver };
}

describe("dns - check", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should pass error to callback when name is unspecified", function (done) {
    checker.check({}, function (err) {
      assert.equals(err.message, 'dns check requires "name"');
      done();
    });
  });

  it("should resolve A records with defaults when only name is specified", function (done) {
    const stubs = stubResolver(null, ["1.2.3.4", "5.6.7.8"]);
    checker.check({ name: "somehost" }, function (err, result) {
      assert.isNull(err);
      assert.equals(stubs.Resolver.firstCall.args[0], { timeout: 5000 });
      assert.isFalse(stubs.resolver.setServers.called);
      assert.equals(stubs.resolver.resolve.firstCall.args[1], "A");
      assert.equals(result.name, "somehost");
      assert.equals(result.rrtype, "A");
      assert.equals(result.records, ["1.2.3.4", "5.6.7.8"]);
      assert.equals(result.count, 2);
      assert.isNumber(result.responseTime);
      done();
    });
  });

  it("should join TXT record chunks when rrtype is txt", function (done) {
    stubResolver(null, [["v=spf1 ", "-all"], ["other"]]);
    checker.check({ name: "somehost", rrtype: "txt" }, function (err, result) {
      assert.isNull(err);
      assert.equals(result.rrtype, "TXT");
      assert.equals(result.records, ["v=spf1 -all", "other"]);
      done();
    });
  });

  it("should count a single record when result is not an array", function (done) {
    stubResolver(null, { nsname: "ns1", hostmaster: "admin" });
    checker.check({ name: "somehost", rrtype: "SOA" }, function (err, result) {
      assert.isNull(err);
      assert.equals(result.count, 1);
      done();
    });
  });

  it("should use custom server and timeout when specified", function (done) {
    const stubs = stubResolver(null, []);
    checker.check(
      { name: "somehost", server: "8.8.8.8", timeout: 100 },
      function (err) {
        assert.isNull(err);
        assert.equals(stubs.Resolver.firstCall.args[0], { timeout: 100 });
        assert.equals(stubs.resolver.setServers.firstCall.args[0], ["8.8.8.8"]);
        done();
      },
    );
  });

  it("should use custom server list when server is an array", function (done) {
    const stubs = stubResolver(null, []);
    checker.check(
      { name: "somehost", server: ["1.1.1.1", "8.8.8.8"] },
      function (err) {
        assert.isNull(err);
        assert.equals(stubs.resolver.setServers.firstCall.args[0], [
          "1.1.1.1",
          "8.8.8.8",
        ]);
        done();
      },
    );
  });

  it("should pass error to callback when server is invalid", function (done) {
    const resolver = {
      setServers: sinon.stub().throws(new Error("Invalid IP address")),
    };
    sinon.stub(dns, "Resolver").returns(resolver);
    checker.check({ name: "somehost", server: "bad" }, function (err) {
      assert.equals(err.message, "Invalid IP address");
      done();
    });
  });

  it("should pass error to callback when resolution fails", function (done) {
    stubResolver(new Error("ENOTFOUND"));
    checker.check({ name: "nohost" }, function (err, result) {
      assert.equals(err.message, "ENOTFOUND");
      assert.isUndefined(result);
      done();
    });
  });
});
