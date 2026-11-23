"use strict";
import EventEmitter from "events";
import tls from "tls";

import referee from "@sinonjs/referee";
import sinon from "sinon";

import checker from "../../lib/checkers/tls.js";
const assert = referee.assert;

function fakeSocket(cert) {
  const socket = new EventEmitter();
  socket.end = sinon.spy();
  socket.destroy = sinon.spy();
  socket.authorized = false;
  socket.authorizationError = new Error("DEPTH_ZERO_SELF_SIGNED_CERT");
  socket.alpnProtocol = "h2";
  socket.getCipher = () => ({
    name: "TLS_AES_128_GCM_SHA256",
    version: "TLSv1.3",
  });
  socket.getProtocol = () => "TLSv1.3";
  socket.getPeerCertificate = () => cert;
  return socket;
}

describe("tls - check", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should pass error to callback when host is unspecified", function (done) {
    checker.check({}, function (err) {
      assert.equals(err.message, 'tls check requires "host"');
      done();
    });
  });

  it("should capture handshake and certificate details when connected", function (done) {
    const clock = sinon.useFakeTimers(new Date("2026-01-01T00:00:00Z"));
    const socket = fakeSocket({
      subject: { CN: "somehost" },
      issuer: { CN: "someca" },
      subjectaltname: "DNS:somehost",
      valid_from: "Jan 1 00:00:00 2025 GMT",
      valid_to: "Jan 11 00:00:00 2026 GMT",
      serialNumber: "01",
      fingerprint256: "AA:BB",
    });
    const connect = sinon.stub(tls, "connect").returns(socket);
    checker.check({ host: "somehost" }, function (err, result) {
      clock.restore();
      assert.isNull(err);
      assert.equals(connect.firstCall.args[0], {
        host: "somehost",
        port: 443,
        servername: "somehost",
        ALPNProtocols: undefined,
        rejectUnauthorized: false,
        timeout: 5000,
      });
      assert.equals(result, {
        connected: true,
        authorized: false,
        authorizationError: "Error: DEPTH_ZERO_SELF_SIGNED_CERT",
        protocol: "TLSv1.3",
        cipher: "TLS_AES_128_GCM_SHA256",
        cipherVersion: "TLSv1.3",
        alpnProtocol: "h2",
        servername: "somehost",
        responseTime: 0,
        cert: {
          subject: "somehost",
          issuer: "someca",
          subjectAltName: "DNS:somehost",
          validFrom: "Jan 1 00:00:00 2025 GMT",
          validTo: "Jan 11 00:00:00 2026 GMT",
          daysRemaining: 10,
          serialNumber: "01",
          fingerprint256: "AA:BB",
        },
      });
      assert.isTrue(socket.end.called);
      done();
    });
    socket.emit("secureConnect");
  });

  it("should pass options and omit certificate when none is presented", function (done) {
    const socket = fakeSocket({});
    socket.authorized = true;
    socket.authorizationError = null;
    socket.alpnProtocol = false;
    socket.getCipher = () => undefined;
    const connect = sinon.stub(tls, "connect").returns(socket);
    checker.check(
      {
        host: "10.0.0.1",
        port: 465,
        servername: "smtp.somehost",
        alpnProtocols: ["h2"],
        timeout: 100,
        rejectUnauthorized: true,
      },
      function (err, result) {
        assert.isNull(err);
        assert.equals(connect.firstCall.args[0].port, 465);
        assert.equals(connect.firstCall.args[0].servername, "smtp.somehost");
        assert.equals(connect.firstCall.args[0].ALPNProtocols, ["h2"]);
        assert.isTrue(connect.firstCall.args[0].rejectUnauthorized);
        assert.isTrue(result.authorized);
        assert.isUndefined(result.authorizationError);
        assert.isUndefined(result.alpnProtocol);
        assert.isUndefined(result.cipher);
        assert.isUndefined(result.cert);
        done();
      },
    );
    socket.emit("secureConnect");
  });

  it("should leave certificate fields undefined when they are absent", function (done) {
    const socket = fakeSocket({ serialNumber: "02" });
    sinon.stub(tls, "connect").returns(socket);
    checker.check({ host: "somehost" }, function (err, result) {
      assert.isNull(err);
      assert.isUndefined(result.cert.subject);
      assert.isUndefined(result.cert.issuer);
      assert.isUndefined(result.cert.daysRemaining);
      assert.equals(result.cert.serialNumber, "02");
      done();
    });
    socket.emit("secureConnect");
  });

  it("should pass error to callback when connect times out", function (done) {
    const socket = fakeSocket({});
    sinon.stub(tls, "connect").returns(socket);
    checker.check({ host: "somehost", timeout: 100 }, function (err) {
      assert.equals(
        err.message,
        "tls connect timeout after 100ms (somehost:443)",
      );
      assert.isTrue(socket.destroy.called);
      done();
    });
    socket.emit("timeout");
  });

  it("should pass error to callback when connection fails", function (done) {
    const socket = fakeSocket({});
    sinon.stub(tls, "connect").returns(socket);
    checker.check({ host: "somehost" }, function (err) {
      assert.equals(err.message, "ECONNREFUSED");
      done();
    });
    socket.emit("error", new Error("ECONNREFUSED"));
  });
});
