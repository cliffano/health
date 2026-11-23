"use strict";
import dgram from "dgram";
import EventEmitter from "events";

import referee from "@sinonjs/referee";
import sinon from "sinon";

import checker from "../../lib/checkers/ntp.js";
const assert = referee.assert;

const NTP_EPOCH_OFFSET = 2208988800;

function fakeSocket(sendError) {
  const socket = new EventEmitter();
  socket.close = sinon.spy();
  socket.send = sinon.spy(function (packet, port, host, cb) {
    cb(sendError);
  });
  return socket;
}

function writeTimestamp(buf, offset, ms) {
  buf.writeUInt32BE(Math.floor(ms / 1000) + NTP_EPOCH_OFFSET, offset);
  buf.writeUInt32BE(Math.round(((ms % 1000) / 1000) * 0x100000000), offset + 4);
}

function serverResponse(firstByte, stratum, serverMs) {
  const msg = Buffer.alloc(48);
  msg[0] = firstByte;
  msg[1] = stratum;
  writeTimestamp(msg, 32, serverMs);
  writeTimestamp(msg, 40, serverMs);
  return msg;
}

describe("ntp - check", function () {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(function () {
    this.clock.restore();
    sinon.restore();
  });

  it("should pass error to callback when host is unspecified", function (done) {
    checker.check({}, function (err) {
      assert.equals(err.message, 'ntp check requires "host"');
      done();
    });
  });

  it("should decode offset, delay and stratum when server replies", function (done) {
    const socket = fakeSocket();
    sinon.stub(dgram, "createSocket").returns(socket);
    const clock = this.clock;
    checker.check({ host: "pool.ntp.org" }, function (err, result) {
      assert.isNull(err);
      const packet = socket.send.firstCall.args[0];
      assert.equals(packet.length, 48);
      assert.equals(packet[0], 0x23);
      assert.equals(socket.send.firstCall.args[1], 123);
      assert.equals(result, {
        responded: true,
        valid: true,
        leapIndicator: 0,
        version: 4,
        mode: 4,
        stratum: 2,
        offset: 450,
        offsetAbs: 450,
        delay: 100,
        serverTime: "2026-01-01T00:00:00.500Z",
        bytesReceived: 48,
        responseTime: 100,
      });
      done();
    });
    // server is 450ms ahead: T1=0, T2=T3=500, T4=100
    clock.tick(100);
    socket.emit("message", serverResponse(0x24, 2, Date.now() + 400));
  });

  it("should mark response invalid when stratum is 0 or mode is not server", function (done) {
    const socket = fakeSocket();
    sinon.stub(dgram, "createSocket").returns(socket);
    checker.check({ host: "somehost", port: 1123 }, function (err, result) {
      assert.isNull(err);
      assert.equals(socket.send.firstCall.args[1], 1123);
      assert.isFalse(result.valid);
      assert.equals(result.leapIndicator, 3);
      assert.equals(result.stratum, 0);
      done();
    });
    socket.emit("message", serverResponse(0xe3, 0, Date.now()));
  });

  it("should mark response invalid when packet is too short", function (done) {
    const socket = fakeSocket();
    sinon.stub(dgram, "createSocket").returns(socket);
    checker.check({ host: "somehost" }, function (err, result) {
      assert.isNull(err);
      assert.equals(result, {
        responded: true,
        valid: false,
        bytesReceived: 10,
      });
      done();
    });
    socket.emit("message", Buffer.alloc(10));
  });

  it("should report no response when timeout elapses", function (done) {
    const socket = fakeSocket();
    sinon.stub(dgram, "createSocket").returns(socket);
    checker.check({ host: "somehost", timeout: 500 }, function (err, result) {
      assert.isNull(err);
      assert.equals(result, { responded: false, responseTime: 500 });
      assert.isTrue(socket.close.calledOnce);
      done();
    });
    this.clock.tick(500);
  });

  it("should pass error to callback when socket fails", function (done) {
    const socket = fakeSocket();
    sinon.stub(dgram, "createSocket").returns(socket);
    checker.check({ host: "somehost" }, function (err) {
      assert.equals(err.message, "EACCES");
      done();
    });
    socket.emit("error", new Error("EACCES"));
  });

  it("should pass error to callback when send fails", function (done) {
    sinon
      .stub(dgram, "createSocket")
      .returns(fakeSocket(new Error("ENOTFOUND")));
    checker.check({ host: "nohost" }, function (err) {
      assert.equals(err.message, "ENOTFOUND");
      done();
    });
  });
});
