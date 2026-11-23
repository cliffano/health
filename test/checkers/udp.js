"use strict";
import dgram from "dgram";
import EventEmitter from "events";

import referee from "@sinonjs/referee";
import sinon from "sinon";

import checker from "../../lib/checkers/udp.js";
const assert = referee.assert;

function fakeSocket(sendError) {
  const socket = new EventEmitter();
  socket.close = sinon.spy();
  socket.send = sinon.spy(function (payload, port, host, cb) {
    cb(sendError);
  });
  return socket;
}

describe("udp - check", function () {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers();
  });

  afterEach(function () {
    this.clock.restore();
    sinon.restore();
  });

  it("should pass error to callback when host or port is unspecified", function (done) {
    checker.check({ port: 53 }, function (err) {
      assert.equals(err.message, 'udp check requires "host" and "port"');
      done();
    });
  });

  it("should capture response when server replies", function (done) {
    const socket = fakeSocket();
    const createSocket = sinon.stub(dgram, "createSocket").returns(socket);
    checker.check(
      { host: "somehost", port: 9999, send: "ping" },
      function (err, result) {
        assert.isNull(err);
        assert.equals(createSocket.firstCall.args[0], "udp4");
        assert.equals(socket.send.firstCall.args[0].toString(), "ping");
        assert.equals(socket.send.firstCall.args[1], 9999);
        assert.equals(socket.send.firstCall.args[2], "somehost");
        assert.isTrue(result.responded);
        assert.equals(result.data, "pong");
        assert.equals(result.dataHex, "706f6e67");
        assert.equals(result.bytesReceived, 4);
        assert.equals(result.remoteAddress, "10.0.0.1");
        assert.equals(result.remotePort, 9999);
        assert.isNumber(result.responseTime);
        assert.isTrue(socket.close.calledOnce);
        done();
      },
    );
    socket.emit("message", Buffer.from("pong"), {
      address: "10.0.0.1",
      port: 9999,
    });
  });

  it("should send hex payload, use socket type and encoding when specified", function (done) {
    const socket = fakeSocket();
    const createSocket = sinon.stub(dgram, "createSocket").returns(socket);
    checker.check(
      {
        host: "::1",
        port: 53,
        sendHex: "abcd",
        type: "udp6",
        encoding: "hex",
      },
      function (err, result) {
        assert.isNull(err);
        assert.equals(createSocket.firstCall.args[0], "udp6");
        assert.equals(socket.send.firstCall.args[0], Buffer.from([0xab, 0xcd]));
        assert.equals(result.data, "abcd");
        done();
      },
    );
    socket.emit("message", Buffer.from([0xab, 0xcd]), {
      address: "::1",
      port: 53,
    });
  });

  it("should report no response when timeout elapses", function (done) {
    const socket = fakeSocket();
    sinon.stub(dgram, "createSocket").returns(socket);
    checker.check(
      { host: "somehost", port: 8125, timeout: 300 },
      function (err, result) {
        assert.isNull(err);
        assert.equals(socket.send.firstCall.args[0].length, 0);
        assert.equals(result, {
          responded: false,
          responseTime: 300,
          data: "",
          dataHex: "",
          bytesReceived: 0,
        });
        done();
      },
    );
    this.clock.tick(300);
  });

  it("should pass error to callback when socket fails", function (done) {
    const socket = fakeSocket();
    sinon.stub(dgram, "createSocket").returns(socket);
    checker.check({ host: "somehost", port: 1 }, function (err) {
      assert.equals(err.message, "EHOSTUNREACH");
      assert.isTrue(socket.close.calledOnce);
      done();
    });
    socket.emit("error", new Error("EHOSTUNREACH"));
  });

  it("should pass error to callback when send fails", function (done) {
    sinon
      .stub(dgram, "createSocket")
      .returns(fakeSocket(new Error("ENOTFOUND")));
    checker.check({ host: "nohost", port: 1 }, function (err) {
      assert.equals(err.message, "ENOTFOUND");
      done();
    });
  });
});
