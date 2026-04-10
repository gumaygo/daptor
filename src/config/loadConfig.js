"use strict";

const fs = require("fs");
const path = require("path");
const { DEFAULTS } = require("./defaults");

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base, patch) {
  if (!isPlainObject(patch)) {
    return patch === undefined ? base : patch;
  }

  const output = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (isPlainObject(value) && isPlainObject(base[key])) {
      output[key] = deepMerge(base[key], value);
      continue;
    }

    output[key] = value;
  }

  return output;
}

function parseNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${label}: ${value}`);
  }
  return parsed;
}

function parseAdbRange(value) {
  if (Array.isArray(value)) {
    return value.map((item, index) => parseNumber(item, `ports.adbRange[${index}]`));
  }

  if (typeof value === "string") {
    const parts = value.split("-").map((item) => item.trim());
    if (parts.length !== 2) {
      throw new Error(`Invalid adb port range format: ${value}`);
    }
    return parts.map((item, index) => parseNumber(item, `ports.adbRange[${index}]`));
  }

  return value;
}

function parseAppiumPool(value) {
  if (Array.isArray(value)) {
    return value.map((item, index) => parseNumber(item, `ports.appiumPool[${index}]`));
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item, index) => parseNumber(item, `ports.appiumPool[${index}]`));
  }

  return value;
}

function normalizePaths(config, cwd) {
  return {
    ...config,
    paths: {
      sessionOutputPath: path.resolve(cwd, config.paths.sessionOutputPath),
      monitorLogPath: path.resolve(cwd, config.paths.monitorLogPath),
    },
  };
}

function applyDerivedConfig(config) {
  const extraArgs = [...config.emulator.extraArgs];
  const withoutNoWindow = extraArgs.filter((arg) => arg !== "-no-window");

  return {
    ...config,
    emulator: {
      ...config.emulator,
      extraArgs: config.emulator.headless
        ? ["-no-window", ...withoutNoWindow]
        : withoutNoWindow,
    },
  };
}

function validateConfig(config) {
  const adbRange = config.ports.adbRange;
  if (!Array.isArray(adbRange) || adbRange.length !== 2) {
    throw new Error("ports.adbRange must contain exactly two numbers");
  }

  const [adbStart, adbEnd] = adbRange;
  if (adbStart >= adbEnd) {
    throw new Error("ports.adbRange start must be lower than end");
  }
  if (adbStart % 2 !== 0 || adbEnd % 2 !== 0) {
    throw new Error("ports.adbRange must use even ports to match Android emulator conventions");
  }

  const appiumPool = config.ports.appiumPool;
  if (!Array.isArray(appiumPool) || appiumPool.length === 0) {
    throw new Error("ports.appiumPool must contain at least one port");
  }

  const uniqueAppiumPorts = new Set(appiumPool);
  if (uniqueAppiumPorts.size !== appiumPool.length) {
    throw new Error("ports.appiumPool cannot contain duplicate ports");
  }

  if (config.emulator.bootTimeoutMs < 1000) {
    throw new Error("emulator.bootTimeoutMs must be at least 1000");
  }

  if (config.monitor.intervalMs < 1000) {
    throw new Error("monitor.intervalMs must be at least 1000");
  }

  return config;
}

function readConfigFile(configPath, cwd) {
  if (!configPath) {
    return {};
  }

  const absolutePath = path.resolve(cwd, configPath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const parsed = JSON.parse(raw);
  return deepMerge(parsed, {
    __meta: {
      configPath: absolutePath,
    },
  });
}

function createOverrides(cliOptions = {}) {
  const overrides = {};

  if (cliOptions.output) {
    overrides.paths = { ...(overrides.paths || {}), sessionOutputPath: cliOptions.output };
  }

  if (cliOptions.logPath) {
    overrides.paths = { ...(overrides.paths || {}), monitorLogPath: cliOptions.logPath };
  }

  if (cliOptions.adbPortRange) {
    overrides.ports = { ...(overrides.ports || {}), adbRange: parseAdbRange(cliOptions.adbPortRange) };
  }

  if (cliOptions.appiumPorts) {
    overrides.ports = { ...(overrides.ports || {}), appiumPool: parseAppiumPool(cliOptions.appiumPorts) };
  }

  if (cliOptions.bootTimeoutMs) {
    overrides.emulator = {
      ...(overrides.emulator || {}),
      bootTimeoutMs: parseNumber(cliOptions.bootTimeoutMs, "bootTimeoutMs"),
    };
  }

  if (cliOptions.monitorIntervalMs) {
    overrides.monitor = {
      ...(overrides.monitor || {}),
      intervalMs: parseNumber(cliOptions.monitorIntervalMs, "monitorIntervalMs"),
    };
  }

  if (cliOptions.appiumCommand || cliOptions.adbCommand || cliOptions.emulatorCommand) {
    overrides.commands = {
      ...(overrides.commands || {}),
      ...(cliOptions.appiumCommand ? { appium: cliOptions.appiumCommand } : {}),
      ...(cliOptions.adbCommand ? { adb: cliOptions.adbCommand } : {}),
      ...(cliOptions.emulatorCommand ? { emulator: cliOptions.emulatorCommand } : {}),
    };
  }

  if (typeof cliOptions.headless === "boolean") {
    overrides.emulator = { ...(overrides.emulator || {}), headless: cliOptions.headless };
  }

  if (typeof cliOptions.monitorEnabled === "boolean") {
    overrides.monitor = { ...(overrides.monitor || {}), enabled: cliOptions.monitorEnabled };
  }

  return overrides;
}

function loadConfig(options = {}) {
  const cwd = options.cwd || process.cwd();
  const fileConfig = readConfigFile(options.configPath, cwd);
  const overrides = createOverrides(options.overrides);

  let merged = deepMerge(DEFAULTS, fileConfig);
  merged = deepMerge(merged, overrides);

  merged.ports.adbRange = parseAdbRange(merged.ports.adbRange);
  merged.ports.appiumPool = parseAppiumPool(merged.ports.appiumPool);
  merged = normalizePaths(merged, cwd);
  merged = applyDerivedConfig(merged);

  return validateConfig(merged);
}

module.exports = {
  loadConfig,
  deepMerge,
  parseAdbRange,
  parseAppiumPool,
  validateConfig,
};
