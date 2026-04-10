"use strict";

const path = require("path");

const DEFAULTS = {
  paths: {
    sessionOutputPath: path.resolve(process.cwd(), "daptor-session.json"),
    monitorLogPath: path.resolve(process.cwd(), "logs", "daptor-monitor.jsonl"),
  },
  commands: {
    adb: process.env.DAPTOR_ADB_COMMAND || "adb",
    emulator: process.env.DAPTOR_EMULATOR_COMMAND || "emulator",
    appium: process.env.DAPTOR_APPIUM_COMMAND || "appium",
  },
  ports: {
    adbRange: [5554, 5584],
    appiumPool: [4723, 4724, 4725, 4726, 4727],
  },
  emulator: {
    bootTimeoutMs: 180000,
    bootPollIntervalMs: 5000,
    headless: true,
    extraArgs: ["-no-snapshot-load", "-gpu", "swiftshader_indirect"],
  },
  appium: {
    host: "127.0.0.1",
    startupTimeoutMs: 20000,
    extraArgs: [],
  },
  monitor: {
    intervalMs: 5000,
    enabled: true,
  },
};

module.exports = { DEFAULTS };
