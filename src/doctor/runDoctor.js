"use strict";

const net = require("net");
const { commandExists } = require("../utils/system");

function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function runDoctor(config, emulatorManager) {
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const appiumPoolAvailability = await Promise.all(
    config.ports.appiumPool.map(async (port) => ({
      port,
      available: await checkPortAvailable(port),
    }))
  );

  const adbRangeSample = [];
  for (let port = config.ports.adbRange[0]; port <= config.ports.adbRange[1] && adbRangeSample.length < 3; port += 2) {
    adbRangeSample.push({
      port,
      available: await checkPortAvailable(port),
    });
  }

  const commands = {
    adb: commandExists(config.commands.adb),
    emulator: commandExists(config.commands.emulator),
    appium: commandExists(config.commands.appium),
  };

  let avdNames = [];
  let avdLookupError = null;
  if (commands.emulator) {
    try {
      avdNames = emulatorManager.listAvds();
    } catch (error) {
      avdLookupError = error.message;
    }
  }

  return {
    ok:
      nodeMajor >= 18 &&
      commands.adb &&
      commands.emulator &&
      commands.appium &&
      appiumPoolAvailability.every((item) => item.available),
    summary: {
      nodeVersion: process.versions.node,
      nodeSupported: nodeMajor >= 18,
      commands,
      androidHome: process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || null,
      appiumPoolAvailability,
      adbRangeSample,
      avdCount: avdNames.length,
    },
    avdNames,
    avdLookupError,
  };
}

function formatDoctorReport(report) {
  const lines = [];
  lines.push("DAPTOR doctor report");
  lines.push(`- Node.js: ${report.summary.nodeVersion} (${report.summary.nodeSupported ? "supported" : "unsupported"})`);
  lines.push(`- adb command available: ${report.summary.commands.adb ? "yes" : "no"}`);
  lines.push(`- emulator command available: ${report.summary.commands.emulator ? "yes" : "no"}`);
  lines.push(`- appium command available: ${report.summary.commands.appium ? "yes" : "no"}`);
  lines.push(`- ANDROID_HOME / ANDROID_SDK_ROOT: ${report.summary.androidHome || "not set"}`);
  lines.push(`- AVDs detected: ${report.summary.avdCount}`);

  if (report.avdLookupError) {
    lines.push(`- AVD lookup error: ${report.avdLookupError}`);
  }

  lines.push("- Appium pool ports:");
  for (const item of report.summary.appiumPoolAvailability) {
    lines.push(`  - ${item.port}: ${item.available ? "available" : "busy"}`);
  }

  lines.push("- ADB sample ports:");
  for (const item of report.summary.adbRangeSample) {
    lines.push(`  - ${item.port}: ${item.available ? "available" : "busy"}`);
  }

  if (report.avdNames.length > 0) {
    lines.push("- Available AVDs:");
    for (const avd of report.avdNames) {
      lines.push(`  - ${avd}`);
    }
  }

  lines.push(`- Overall status: ${report.ok ? "READY" : "ACTION REQUIRED"}`);
  return lines.join("\n");
}

module.exports = {
  runDoctor,
  formatDoctorReport,
};
