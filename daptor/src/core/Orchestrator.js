const chalk = require('chalk');
const PortManager = require('./PortManager');
const EmulatorManager = require('./EmulatorManager');
const AppiumManager = require('./AppiumManager');
const Monitor = require('./Monitor');

class Orchestrator {
  constructor(config = {}) {
    this.portManager = new PortManager(config.ports);
    this.emulatorManager = new EmulatorManager(this.portManager);
    this.appiumManager = new AppiumManager(this.portManager);
    this.monitor = new Monitor(config.logPath);
  }

  async run(avdNames) {
    console.log(chalk.blue.bold(`\n[DAPTOR] Starting orchestration for ${avdNames.length} instances...`));

    try {
      // 1. Start Appium Pool
      await this.appiumManager.startPool();

      // 2. Start Monitor
      this.monitor.start();

      // 3. Launch Emulators
      const launchTasks = avdNames.map((name, index) => {
        return this.emulatorManager.launch(name).then(deviceId => ({
          deviceId,
          appiumPort: this.portManager.getAppiumPort(index)
        }));
      });

      const devices = await Promise.all(launchTasks);
      console.log(chalk.green.bold(`\n[DAPTOR] All emulators ready:`));
      console.table(devices);

      return devices;

    } catch (error) {
      console.error(chalk.red.bold(`\n[DAPTOR] Critical failure:`), error);
      this.shutdown();
    }
  }

  shutdown() {
    console.log(chalk.yellow(`\n[DAPTOR] Performing graceful shutdown...`));
    this.monitor.stop();
    this.emulatorManager.shutdownAll();
    this.appiumManager.stopAll();
    process.exit(0);
  }
}

module.exports = Orchestrator;
