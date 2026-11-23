"use strict";
import EventEmitter from "events";
import net from "net";

import referee from "@sinonjs/referee";
import sinon from "sinon";

import checker from "../../lib/checkers/tcp.js";
const assert = referee.assert;

function fakeSocket() {
  const socket = new EventEmitter();
  socket.write = sinon.spy();
  socket.destroy = sinon.spy();
  socket.remoteAddress = "127.0.0.1";
  socket.remoteFamily = "IPv4";
  return socket;
}

describe("tcp - check", function () {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers();
    this.socket = fakeSocket();
    this.connect = sinon.stub(net, "connect").returns(this.socket);
  });

  afterEach(function () {
    this.clock.restore();
    sinon.restore();
  });

  it("should pass error to callback when host or port is unspecified", function (done) {
    checker.check({ host: "somehost" }, function (err) {
      assert.equals(err.message, 'tcp check requires "host" and "port"');
      done();
    });
  });

  it("should capture data when server sends a banner and closes", function (done) {
    const socket = this.socket;
    const connect = this.connect;
    checker.check({ host: "somehost", port: 22 }, function (err, result) {
      assert.isNull(err);
      assert.equals(connect.firstCall.args[0], {
        host: "somehost",
        port: 22,
        timeout: 5000,
      });
      assert.isTrue(result.connected);
      assert.isNumber(result.connectTime);
      assert.equals(result.remoteAddress, "127.0.0.1");
      assert.equals(result.remoteFamily, "IPv4");
      assert.equals(result.data, "SSH-2.0-OpenSSH\r\n");
      assert.equals(
        result.dataHex,
        Buffer.from("SSH-2.0-OpenSSH\r\n").toString("hex"),
      );
      assert.equals(result.bytesReceived, 17);
      assert.isFalse(socket.write.called);
      assert.isTrue(socket.destroy.called);
      done();
    });
    socket.emit("connect");
    socket.emit("data", Buffer.from("SSH-2.0-"));
    socket.emit("data", Buffer.from("OpenSSH\r\n"));
    socket.emit("end");
  });

  it("should send payload and finish after readTimeout when server keeps connection open", function (done) {
    const socket = this.socket;
    checker.check(
      { host: "somehost", port: 25, send: "EHLO x\r\n", readTimeout: 300 },
      function (err, result) {
        assert.isNull(err);
        assert.equals(socket.write.firstCall.args[0].toString(), "EHLO x\r\n");
        assert.equals(result.data, "220 ok");
        done();
      },
    );
    socket.emit("connect");
    socket.emit("data", Buffer.from("220 ok"));
    this.clock.tick(300);
  });

  it("should send hex payload and use encoding when specified", function (done) {
    const socket = this.socket;
    checker.check(
      { host: "somehost", port: 7, sendHex: "0102", encoding: "base64" },
      function (err, result) {
        assert.isNull(err);
        assert.equals(socket.write.firstCall.args[0], Buffer.from([1, 2]));
        assert.equals(result.data, "AQI=");
        done();
      },
    );
    socket.emit("connect");
    socket.emit("data", Buffer.from([1, 2]));
    this.clock.tick(2000);
  });

  it("should pass error to callback when connect times out", function (done) {
    const socket = this.socket;
    checker.check(
      { host: "somehost", port: 1, timeout: 100 },
      function (err, result) {
        assert.equals(
          err.message,
          "tcp connect timeout after 100ms (somehost:1)",
        );
        assert.isUndefined(result);
        assert.isTrue(socket.destroy.called);
        done();
      },
    );
    socket.emit("timeout");
  });

  it("should finish with captured data when idle timeout happens after connect", function (done) {
    const socket = this.socket;
    checker.check({ host: "somehost", port: 1 }, function (err, result) {
      assert.isNull(err);
      assert.isTrue(result.connected);
      assert.equals(result.bytesReceived, 0);
      done();
    });
    socket.emit("connect");
    socket.emit("timeout");
  });

  it("should pass error to callback when connection fails", function (done) {
    const socket = this.socket;
    checker.check({ host: "somehost", port: 1 }, function (err) {
      assert.equals(err.message, "ECONNREFUSED");
      done();
    });
    socket.emit("error", new Error("ECONNREFUSED"));
  });
});
