"use strict";
import EventEmitter from "events";
import http from "http";
import https from "https";

import referee from "@sinonjs/referee";
import sinon from "sinon";

import checker from "../../lib/checkers/http.js";
const assert = referee.assert;

/**
 * Build a fake lib.request implementation that serves the given responses
 * in order, each { status, headers, chunks, socket, error }.
 */
function fakeRequest(responses, requests) {
  let index = 0;
  return function (url, opts, onResponse) {
    const spec = responses[index];
    index += 1;
    const req = new EventEmitter();
    req.write = sinon.spy();
    req.destroy = function (err) {
      req.emit("error", err);
    };
    req.end = function () {
      requests.push({ url: url.toString(), opts, req });
      if (spec.error) {
        req.emit("error", spec.error);
      } else if (spec.timeout) {
        req.emit("timeout");
      } else {
        const res = new EventEmitter();
        res.statusCode = spec.status;
        res.statusMessage = spec.statusText || "OK";
        res.httpVersion = "1.1";
        res.headers = spec.headers || {};
        res.socket = spec.socket || { remoteAddress: "127.0.0.1" };
        onResponse(res);
        if (spec.resError) {
          res.emit("error", spec.resError);
          return;
        }
        (spec.chunks || []).forEach((chunk) => res.emit("data", chunk));
        res.emit("end");
      }
    };
    return req;
  };
}

describe("http - check", function () {
  beforeEach(function () {
    this.requests = [];
  });

  afterEach(function () {
    sinon.restore();
  });

  it("should pass error to callback when url is unspecified", function (done) {
    checker.check({}, function (err) {
      assert.equals(err.message, 'http check requires "url"');
      done();
    });
  });

  it("should pass error to callback when url is invalid", function (done) {
    checker.check({ url: "not a url" }, function (err) {
      assert.equals(err.code, "ERR_INVALID_URL");
      done();
    });
  });

  it("should capture status, headers, body and json when response is plain http", function (done) {
    sinon.stub(http, "request").callsFake(
      fakeRequest(
        [
          {
            status: 200,
            headers: { "content-type": "application/json" },
            chunks: [Buffer.from('{"ok":'), Buffer.from("true}")],
          },
        ],
        this.requests,
      ),
    );
    const requests = this.requests;
    checker.check({ url: "http://somehost/json" }, function (err, result) {
      assert.isNull(err);
      assert.equals(result.url, "http://somehost/json");
      assert.equals(result.status, 200);
      assert.equals(result.statusText, "OK");
      assert.equals(result.httpVersion, "1.1");
      assert.equals(result.headers, { "content-type": "application/json" });
      assert.equals(result.body, '{"ok":true}');
      assert.equals(result.bodyLength, 11);
      assert.equals(result.json, { ok: true });
      assert.equals(result.redirects, 0);
      assert.equals(result.remoteAddress, "127.0.0.1");
      assert.isUndefined(result.tls);
      assert.isNumber(result.responseTime);
      assert.equals(requests[0].opts.method, "GET");
      assert.equals(requests[0].opts.timeout, 10000);
      assert.isTrue(requests[0].opts.rejectUnauthorized);
      done();
    });
  });

  it("should send method, headers and body when specified", function (done) {
    sinon
      .stub(http, "request")
      .callsFake(fakeRequest([{ status: 201, chunks: [] }], this.requests));
    const requests = this.requests;
    checker.check(
      {
        url: "http://somehost/items",
        method: "POST",
        headers: { "x-key": "value" },
        body: "payload",
        timeout: 100,
        rejectUnauthorized: false,
      },
      function (err, result) {
        assert.isNull(err);
        assert.equals(result.status, 201);
        assert.isUndefined(result.json);
        assert.equals(requests[0].opts.method, "POST");
        assert.equals(requests[0].opts.headers, { "x-key": "value" });
        assert.equals(requests[0].opts.timeout, 100);
        assert.isFalse(requests[0].opts.rejectUnauthorized);
        assert.isTrue(requests[0].req.write.calledWithExactly("payload"));
        done();
      },
    );
  });

  it("should capture tls details when response is https", function (done) {
    const clock = sinon.useFakeTimers(new Date("2026-01-01T00:00:00Z"));
    const socket = {
      remoteAddress: "10.0.0.1",
      authorized: true,
      getPeerCertificate: () => ({
        subject: { CN: "somehost" },
        issuer: { CN: "someca" },
        valid_from: "Jan 1 00:00:00 2025 GMT",
        valid_to: "Jan 31 00:00:00 2026 GMT",
      }),
      getCipher: () => ({ name: "TLS_AES_256_GCM_SHA384" }),
      getProtocol: () => "TLSv1.3",
    };
    sinon
      .stub(https, "request")
      .callsFake(
        fakeRequest(
          [{ status: 200, chunks: [Buffer.from("hello")], socket }],
          this.requests,
        ),
      );
    checker.check({ url: "https://somehost" }, function (err, result) {
      clock.restore();
      assert.isNull(err);
      assert.equals(result.tls, {
        protocol: "TLSv1.3",
        cipher: "TLS_AES_256_GCM_SHA384",
        authorized: true,
        certSubject: "somehost",
        certIssuer: "someca",
        certValidFrom: "Jan 1 00:00:00 2025 GMT",
        certValidTo: "Jan 31 00:00:00 2026 GMT",
        certDaysRemaining: 30,
      });
      done();
    });
  });

  it("should tolerate missing certificate and socket details when https", function (done) {
    const socket = { getPeerCertificate: () => null };
    sinon
      .stub(https, "request")
      .callsFake(fakeRequest([{ status: 200, socket }], this.requests));
    checker.check({ url: "https://somehost" }, function (err, result) {
      assert.isNull(err);
      assert.isUndefined(result.tls.protocol);
      assert.isUndefined(result.tls.cipher);
      assert.isUndefined(result.tls.certSubject);
      assert.isUndefined(result.tls.certDaysRemaining);
      done();
    });
  });

  it("should follow and count redirects when response is 3xx", function (done) {
    sinon.stub(http, "request").callsFake(
      fakeRequest(
        [
          { status: 301, headers: { location: "/next" } },
          { status: 302, headers: { location: "http://otherhost/final" } },
          { status: 200, chunks: [Buffer.from("done")] },
        ],
        this.requests,
      ),
    );
    const requests = this.requests;
    checker.check({ url: "http://somehost/start" }, function (err, result) {
      assert.isNull(err);
      assert.equals(result.status, 200);
      assert.equals(result.redirects, 2);
      assert.equals(result.url, "http://otherhost/final");
      assert.equals(requests[1].url, "http://somehost/next");
      done();
    });
  });

  it("should stop following redirects when maxRedirects is reached", function (done) {
    sinon.stub(http, "request").callsFake(
      fakeRequest(
        [
          { status: 302, headers: { location: "/a" } },
          { status: 302, headers: { location: "/b" } },
        ],
        this.requests,
      ),
    );
    checker.check(
      { url: "http://somehost/", maxRedirects: 1 },
      function (err, result) {
        assert.isNull(err);
        assert.equals(result.status, 302);
        assert.equals(result.redirects, 1);
        done();
      },
    );
  });

  it("should not follow redirects when followRedirects is false", function (done) {
    sinon
      .stub(http, "request")
      .callsFake(
        fakeRequest(
          [{ status: 302, headers: { location: "/a" } }],
          this.requests,
        ),
      );
    checker.check(
      { url: "http://somehost/", followRedirects: false },
      function (err, result) {
        assert.isNull(err);
        assert.equals(result.status, 302);
        assert.equals(result.headers.location, "/a");
        assert.equals(result.redirects, 0);
        done();
      },
    );
  });

  it("should not treat 3xx without location as a redirect", function (done) {
    sinon
      .stub(http, "request")
      .callsFake(fakeRequest([{ status: 304 }], this.requests));
    checker.check({ url: "http://somehost/" }, function (err, result) {
      assert.isNull(err);
      assert.equals(result.status, 304);
      done();
    });
  });

  it("should cap captured body when response is larger than 5MB", function (done) {
    const big = Buffer.alloc(5 * 1024 * 1024, "a");
    sinon
      .stub(http, "request")
      .callsFake(
        fakeRequest([{ status: 200, chunks: [big, big] }], this.requests),
      );
    checker.check({ url: "http://somehost/" }, function (err, result) {
      assert.isNull(err);
      assert.equals(result.bodyLength, big.length);
      done();
    });
  });

  it("should pass error to callback when request fails", function (done) {
    sinon
      .stub(http, "request")
      .callsFake(
        fakeRequest([{ error: new Error("ECONNREFUSED") }], this.requests),
      );
    checker.check({ url: "http://somehost/" }, function (err, result) {
      assert.equals(err.message, "ECONNREFUSED");
      assert.isUndefined(result);
      done();
    });
  });

  it("should pass timeout error to callback when request times out", function (done) {
    sinon
      .stub(http, "request")
      .callsFake(fakeRequest([{ timeout: true }], this.requests));
    checker.check({ url: "http://somehost/", timeout: 50 }, function (err) {
      assert.equals(err.message, "http timeout after 50ms");
      done();
    });
  });

  it("should pass error to callback when response stream fails", function (done) {
    sinon
      .stub(http, "request")
      .callsFake(
        fakeRequest(
          [{ status: 200, resError: new Error("aborted") }],
          this.requests,
        ),
      );
    checker.check({ url: "http://somehost/" }, function (err) {
      assert.equals(err.message, "aborted");
      done();
    });
  });
});
