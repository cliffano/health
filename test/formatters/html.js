"use strict";
import fs from "fs";
import referee from "@sinonjs/referee";
import sinon from "sinon";
import html from "../../lib/formatters/html.js";
const assert = referee.assert;

describe("html - format", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should format text properly when desc exists", function () {
    sinon.stub(fs, "readFileSync").returns(Buffer.from("sometemplate"));
    const result = html.format([
      { uri: "http://somehost", status: "ok", desc: "somedesc", duration: 20 },
    ]);
    assert.equals(result, "sometemplate");
  });
});
