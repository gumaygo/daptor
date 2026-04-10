"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseArgs } = require("../src/cli/parseArgs");

test("parseArgs supports default run command", () => {
  const parsed = parseArgs(["Pixel_5_API_33", "--output", "session.json"]);
  assert.equal(parsed.command, "run");
  assert.deepEqual(parsed.avdNames, ["Pixel_5_API_33"]);
  assert.equal(parsed.options.output, "session.json");
});

test("parseArgs supports doctor command", () => {
  const parsed = parseArgs(["doctor", "--config", "daptor.config.json"]);
  assert.equal(parsed.command, "doctor");
  assert.equal(parsed.options.config, "daptor.config.json");
});

test("parseArgs throws on unknown options", () => {
  assert.throws(() => parseArgs(["run", "--unknown"]), /Unknown option/);
});
