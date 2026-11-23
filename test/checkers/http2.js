"use strict";
import EventEmitter from "events";
import http2 from "http2";

import referee from "@sinonjs/referee";
import sinon from "sinon";

import checker from "../../lib/checkers/http2.js";
const assert = referee.assert;

/**
 * Build a fake http2 client whose request stream behaves per spec:
 * { headers, chunks, streamError, clientError, hang, alpnProtocol }.
 */
function fakeClient(spec) {
  const client = new EventEmitter();
  client.close = sinon.spy();
  client.socket = spec.alpnProtocol ? { alpnProtocol: spec.alpnProtocol } : {};
  client.request = function (headers) {
    client.requestHeaders = headers;
    const stream = new EventEmitter();
    stream.write = sinon.spy();
    stream.end = function () {
      if (spec.hang) {
        return;
      }
      if (spec.clientError) {
        client.emit("error", spec.clientError);
        return;
      }
      if (spec.streamError) {
        stream.emit("error", spec.streamError);
        return;
      }
      stream.emit("response", spec.headers);
      (spec.chunks || []).forEach((chunk) => stream.emit("data", chunk));
      stream.emit("end");
    };
    client.stream = stream;
    return stream;
  };
  return client;
}

describe("http2 - check", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should pass error to callback when url is unspecified", function (done) {
    checker.check({}, function (err) {
      assert.equals(err.message, 'http2 check requires "url"');
      done();
    });
  });

  it("should pass error to callback when url is invalid", function (done) {
    checker.check({ url: "::nope" }, function (err) {
      assert.equals(err.code, "ERR_INVALID_URL");
      done();
    });
  });

  it("should capture status, headers, alpn and json when request succeeds", function (done) {
    const client = fakeClient({
      headers: { ":status": 200, "content-type": "application/json" },
      chunks: [Buffer.from('{"h2":true}')],
      alpnProtocol: "h2",
    });
    const connect = sinon.stub(http2, "connect").returns(client);
    checker.check(
      { url: "https://somehost/health?x=1" },
      function (err, result) {
        assert.isNull(err);
        assert.equals(connect.firstCall.args[0], "https://somehost");
        assert.isTrue(connect.firstCall.args[1].rejectUnauthorized);
        assert.equals(client.requestHeaders[":method"], "GET");
        assert.equals(client.requestHeaders[":path"], "/health?x=1");
        assert.equals(result.url, "https://somehost/health?x=1");
        assert.equals(result.status, 200);
        assert.equals(result.httpVersion, "2.0");
        assert.equals(result.alpnProtocol, "h2");
        assert.equals(result.headers, { "content-type": "application/json" });
        assert.equals(result.body, '{"h2":true}');
        assert.equals(result.bodyLength, 11);
        assert.equals(result.json, { h2: true });
        assert.isNumber(result.responseTime);
        assert.isTrue(client.close.called);
        done();
      },
    );
  });

  it("should send method, headers and body when specified", function (done) {
    const client = fakeClient({ headers: { ":status": 204 } });
    const connect = sinon.stub(http2, "connect").returns(client);
    checker.check(
      {
        url: "http://somehost/",
        method: "PUT",
        headers: { "x-key": "value" },
        body: "payload",
        rejectUnauthorized: false,
      },
      function (err, result) {
        assert.isNull(err);
        assert.isFalse(connect.firstCall.args[1].rejectUnauthorized);
        assert.equals(client.requestHeaders[":method"], "PUT");
        assert.equals(client.requestHeaders["x-key"], "value");
        assert.isTrue(client.stream.write.calledWithExactly("payload"));
        assert.equals(result.status, 204);
        assert.isUndefined(result.alpnProtocol);
        assert.isUndefined(result.json);
        done();
      },
    );
  });

  it("should cap captured body when response is larger than 5MB", function (done) {
    const big = Buffer.alloc(5 * 1024 * 1024, "a");
    sinon
      .stub(http2, "connect")
      .returns(fakeClient({ headers: { ":status": 200 }, chunks: [big, big] }));
    checker.check({ url: "http://somehost/" }, function (err, result) {
      assert.isNull(err);
      assert.equals(result.bodyLength, big.length);
      done();
    });
  });

  it("should pass error to callback when client fails", function (done) {
    const client = fakeClient({ clientError: new Error("ECONNREFUSED") });
    sinon.stub(http2, "connect").returns(client);
    checker.check({ url: "http://somehost/" }, function (err) {
      assert.equals(err.message, "ECONNREFUSED");
      assert.isTrue(client.close.called);
      done();
    });
  });

  it("should pass error to callback when stream fails", function (done) {
    sinon
      .stub(http2, "connect")
      .returns(fakeClient({ streamError: new Error("RST_STREAM") }));
    checker.check({ url: "http://somehost/" }, function (err) {
      assert.equals(err.message, "RST_STREAM");
      done();
    });
  });

  it("should pass timeout error to callback when no response arrives in time", function (done) {
    const clock = sinon.useFakeTimers();
    sinon.stub(http2, "connect").returns(fakeClient({ hang: true }));
    checker.check({ url: "http://somehost/", timeout: 100 }, function (err) {
      assert.equals(err.message, "http2 timeout after 100ms");
      clock.restore();
      done();
    });
    clock.tick(100);
  });
});
