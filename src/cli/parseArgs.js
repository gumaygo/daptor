"use strict";

const HELP_TEXT = `
Usage:
  daptor run [options] <avd1> <avd2> ...
  daptor doctor [options]
  daptor list-avds [options]
  daptor help
  daptor --version

Options:
  --config <path>                Load configuration from JSON file
  --output <path>                Write session output JSON to this path
  --log-path <path>              Write monitor JSONL logs to this path
  --adb-port-range <start-end>   Override ADB port range, e.g. 5554-5584
  --appium-ports <a,b,c>         Override Appium port pool, e.g. 4723,4724
  --boot-timeout-ms <ms>         Override emulator boot timeout
  --monitor-interval-ms <ms>     Override monitor interval
  --adb-command <cmd>            Override adb executable
  --emulator-command <cmd>       Override emulator executable
  --appium-command <cmd>         Override appium executable
  --headless                     Launch emulators with no-window
  --no-headless                  Launch emulators with UI window
  --no-monitor                   Disable monitor logging
`.trim();

const OPTION_KEYS = new Map([
  ["--config", "config"],
  ["--output", "output"],
  ["--log-path", "logPath"],
  ["--adb-port-range", "adbPortRange"],
  ["--appium-ports", "appiumPorts"],
  ["--boot-timeout-ms", "bootTimeoutMs"],
  ["--monitor-interval-ms", "monitorIntervalMs"],
  ["--adb-command", "adbCommand"],
  ["--emulator-command", "emulatorCommand"],
  ["--appium-command", "appiumCommand"],
]);

function parseArgs(argv = []) {
  const args = [...argv];
  const command = inferCommand(args);
  const options = {};
  const positionals = [];

  while (args.length > 0) {
    const token = args.shift();

    if (token === command && !token.startsWith("--")) {
      continue;
    }

    if (token === "--help" || token === "-h" || token === "help") {
      options.help = true;
      continue;
    }

    if (token === "--version" || token === "-v") {
      options.version = true;
      continue;
    }

    if (token === "--headless") {
      options.headless = true;
      continue;
    }

    if (token === "--no-headless") {
      options.headless = false;
      continue;
    }

    if (token === "--no-monitor") {
      options.monitorEnabled = false;
      continue;
    }

    if (OPTION_KEYS.has(token)) {
      const key = OPTION_KEYS.get(token);
      const value = args.shift();
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${token}`);
      }
      options[key] = value;
      continue;
    }

    if (token.startsWith("--")) {
      throw new Error(`Unknown option: ${token}`);
    }

    positionals.push(token);
  }

  return {
    command,
    options,
    avdNames: command === "run" ? positionals : [],
    helpText: HELP_TEXT,
  };
}

function inferCommand(args) {
  const first = args[0];
  if (!first) {
    return "help";
  }

  if (["run", "doctor", "list-avds", "help"].includes(first)) {
    return first;
  }

  if (first === "--help" || first === "-h") {
    return "help";
  }

  if (first === "--version" || first === "-v") {
    return "version";
  }

  return "run";
}

module.exports = {
  parseArgs,
  HELP_TEXT,
};
