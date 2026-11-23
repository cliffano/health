"use strict";
import EventEmitter from "events";

import referee from "@sinonjs/referee";
import sinon from "sinon";

import checker from "../../lib/checkers/websocket.js";
const assert = referee.assert;

class FakeWebSocket extends EventEmitter {
  constructor(url, subprotocols) {
    super();
    this.url = url;
    this.subprotocols = subprotocols;
    this.protocol = "";
    this.extensions = "";
    this.send = sinon.spy();
    this.close = sinon.spy();
    FakeWebSocket.instance = this;
  }

  addEventListener(type, listener) {
    this.on(type, listener);
  }
}

describe("websocket - check", function () {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers();
    this.webSocket = sinon.stub(globalThis, "WebSocket").value(FakeWebSocket);
  });

  afterEach(function () {
    this.clock.restore();
    sinon.restore();
    FakeWebSocket.instance = undefined;
  });

  it("should pass error to callback when url is unspecified", function (done) {
    checker.check({}, function (err) {
      assert.equals(err.message, 'websocket check requires "url"');
      done();
    });
  });

  it("should pass error to callback when global WebSocket is unavailable", function (done) {
    this.webSocket.value(undefined);
    checker.check({ url: "ws://somehost" }, function (err) {
      assert.equals(
        err.message,
        "global WebSocket is unavailable, Node.js >= 22 required",
      );
      done();
    });
  });

  it("should pass error to callback when url is rejected by the client", function (done) {
    this.webSocket.value(function () {
      throw new SyntaxError("Invalid URL");
    });
    checker.check({ url: "nope" }, function (err) {
      assert.equals(err.message, "Invalid URL");
      done();
    });
  });

  it("should capture first message and negotiated protocol when connected", function (done) {
    checker.check(
      { url: "wss://somehost/feed", subprotocols: ["chat"], send: "ping" },
      function (err, result) {
        assert.isNull(err);
        const ws = FakeWebSocket.instance;
        assert.equals(ws.url, "wss://somehost/feed");
        assert.equals(ws.subprotocols, ["chat"]);
        assert.isTrue(ws.send.calledWithExactly("ping"));
        assert.isTrue(ws.close.called);
        assert.equals(result, {
          connected: true,
          connectTime: 0,
          protocol: "chat",
          extensions: "permessage-deflate",
          messageReceived: true,
          message: "pong",
          responseTime: 0,
        });
        done();
      },
    );
    const ws = FakeWebSocket.instance;
    ws.protocol = "chat";
    ws.extensions = "permessage-deflate";
    ws.emit("open");
    ws.emit("message", { data: "pong" });
  });

  it("should report no message when messageTimeout elapses", function (done) {
    checker.check(
      { url: "ws://somehost", messageTimeout: 500 },
      function (err, result) {
        assert.isNull(err);
        assert.isFalse(FakeWebSocket.instance.send.called);
        assert.isTrue(result.connected);
        assert.isFalse(result.messageReceived);
        assert.equals(result.message, "");
        assert.isUndefined(result.protocol);
        assert.isUndefined(result.extensions);
        assert.equals(result.responseTime, 500);
        done();
      },
    );
    FakeWebSocket.instance.emit("open");
    this.clock.tick(500);
  });

  it("should pass error to callback when connect times out", function (done) {
    checker.check({ url: "ws://somehost", timeout: 100 }, function (err) {
      assert.equals(
        err.message,
        "websocket connect timeout after 100ms (ws://somehost)",
      );
      assert.isTrue(FakeWebSocket.instance.close.called);
      done();
    });
    this.clock.tick(100);
  });

  it("should pass error to callback when connection fails", function (done) {
    checker.check({ url: "ws://somehost" }, function (err) {
      assert.equals(err.message, "websocket connection failed (ws://somehost)");
      done();
    });
    FakeWebSocket.instance.emit("error", {});
  });
});
