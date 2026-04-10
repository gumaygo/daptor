"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { loadConfig } = require("../src/config/loadConfig");

test("loadConfig applies CLI overrides and normalizes paths", () => {
  const config = loadConfig({
    cwd: path.resolve(__dirname, ".."),
    overrides: {
      output: "./artifacts/session.json",
      logPath: "./artifacts/monitor.jsonl",
      appiumPorts: "4723,4724",
      adbPortRange: "5554-5558",
      headless: false,
    },
  });

  assert.deepEqual(config.ports.appiumPool, [4723, 4724]);
  assert.deepEqual(config.ports.adbRange, [5554, 5558]);
  assert.equal(config.emulator.headless, false);
  assert.ok(!config.emulator.extraArgs.includes("-no-window"));
  assert.ok(config.paths.sessionOutputPath.endsWith(path.join("artifacts", "session.json")));
});

test("loadConfig injects no-window when headless is enabled", () => {
  const config = loadConfig({
    cwd: path.resolve(__dirname, ".."),
    overrides: {
      headless: true,
    },
  });

  assert.equal(config.emulator.extraArgs[0], "-no-window");
});
