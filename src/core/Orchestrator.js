const fs = require('fs');
const PortManager = require('./PortManager');
const EmulatorManager = require('./EmulatorManager');
const AppiumManager = require('./AppiumManager');
const Monitor = require('./Monitor');
const { ensureDirectoryForFile } = require('../utils/system');
const colors = require('../utils/colors');

class Orchestrator {
  constructor(config = {}) {
    this.config = config;
    this.portManager = new PortManager(config.ports);
    this.emulatorManager = new EmulatorManager({
      portManager: this.portManager,
      adbCommand: config.commands.adb,
      emulatorCommand: config.commands.emulator,
      bootTimeoutMs: config.emulator.bootTimeoutMs,
      bootPollIntervalMs: config.emulator.bootPollIntervalMs,
      extraArgs: config.emulator.extraArgs,
    });
    this.appiumManager = new AppiumManager({
      portManager: this.portManager,
      command: config.commands.appium,
      host: config.appium.host,
      startupTimeoutMs: config.appium.startupTimeoutMs,
      extraArgs: config.appium.extraArgs,
    });
    this.monitor = new Monitor(config.paths.monitorLogPath);
    this.lastSession = null;
    this.isShuttingDown = false;
  }

  async run(avdNames) {
    console.log(colors.blueBold(`\n[DAPTOR] Starting orchestration for ${avdNames.length} instances...`));
    const startedAt = new Date().toISOString();
    const sessionId = `daptor-${Date.now()}`;

    try {
      await this.appiumManager.startPool();
      if (this.config.monitor.enabled) {
        this.monitor.start(this.config.monitor.intervalMs);
      }

      const launchTasks = avdNames.map((name, index) => {
        return this.emulatorManager.launch(name).then(deviceId => ({
          avdName: name,
          deviceId,
          adbPort: Number(deviceId.replace('emulator-', '')),
          appiumPort: this.portManager.getAppiumPort(index)
        }));
      });

      const devices = await Promise.all(launchTasks);
      console.log(colors.greenBold(`\n[DAPTOR] All emulators ready:`));
      console.table(devices);

      const session = {
        sessionId,
        startedAt,
        completedAt: new Date().toISOString(),
        deviceCount: devices.length,
        commands: this.config.commands,
        ports: this.config.ports,
        devices,
      };

      this.writeSession(session);
      this.lastSession = session;

      return session;

    } catch (error) {
      console.error(colors.redBold(`\n[DAPTOR] Critical failure:`), error.message);
      await this.shutdown('run_failed');
      throw error;
    }
  }

  writeSession(session) {
    ensureDirectoryForFile(this.config.paths.sessionOutputPath);
    fs.writeFileSync(this.config.paths.sessionOutputPath, JSON.stringify(session, null, 2));
    console.log(colors.gray(`[DAPTOR] Session output written to ${this.config.paths.sessionOutputPath}`));
  }

  async shutdown(reason = 'manual') {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;
    console.log(colors.yellow(`\n[DAPTOR] Performing graceful shutdown...`));
    this.monitor.stop();
    await this.emulatorManager.shutdownAll();
    await this.appiumManager.stopAll();
    console.log(colors.gray(`[DAPTOR] Shutdown reason: ${reason}`));
  }
}

module.exports = Orchestrator;
