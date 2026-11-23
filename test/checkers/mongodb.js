"use strict";
import esmock from "esmock";
import referee from "@sinonjs/referee";
const assert = referee.assert;

describe("mongodb - check", function () {
  it("should have success status when connect resolves", function (done) {
    const mockClient = { close: function () {} };
    const checker = {}; // populated below via esmock
    esmock("../../lib/checkers/mongodb.js", {
      mongodb: {
        MongoClient: {
          connect: function (uri, opts) {
            assert.equals(uri, "mongodb://somehost");
            assert.equals(opts.connectTimeoutMS, 2000);
            return Promise.resolve(mockClient);
          },
        },
      },
    }).then(function (mod) {
      Object.assign(checker, mod.default);
      checker.check({ uri: "mongodb://somehost" }, function (err, result) {
        assert.isNull(err);
        assert.isTrue(result.isSuccess());
        done();
      });
    });
  });

  it("should have error status when connect rejects", function (done) {
    esmock("../../lib/checkers/mongodb.js", {
      mongodb: {
        MongoClient: {
          connect: function () {
            return Promise.reject(new Error("some error"));
          },
        },
      },
    }).then(function (mod) {
      mod.default.check(
        { uri: "mongodb://somehost", timeout: 500 },
        function (err, result) {
          assert.isNull(err);
          assert.isTrue(result.isError());
          assert.equals(result.getErrors(), ["some error"]);
          done();
        },
      );
    });
  });
});
