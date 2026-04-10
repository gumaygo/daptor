"use strict";

const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDirectoryForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function runCommand(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: false,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !options.allowFailure) {
    const stderr = (result.stderr || "").trim();
    throw new Error(stderr || `Command failed: ${command} ${args.join(" ")}`);
  }

  return result;
}

function spawnCommand(command, args = [], options = {}) {
  return spawn(command, args, {
    shell: false,
    windowsHide: true,
    ...options,
  });
}

function commandExists(command) {
  if (!command) {
    return false;
  }

  if (command.includes(path.sep) || command.includes("/")) {
    return fs.existsSync(command);
  }

  const whichCommand = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(whichCommand, [command], {
    encoding: "utf8",
    shell: false,
  });

  return result.status === 0;
}

module.exports = {
  sleep,
  ensureDirectoryForFile,
  runCommand,
  spawnCommand,
  commandExists,
};
