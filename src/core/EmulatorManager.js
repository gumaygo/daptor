const { spawnCommand, runCommand, sleep } = require('../utils/system');

class EmulatorManager {
  constructor(options = {}) {
    this.portManager = options.portManager;
    this.adbCommand = options.adbCommand || 'adb';
    this.emulatorCommand = options.emulatorCommand || 'emulator';
    this.bootTimeoutMs = options.bootTimeoutMs || 120000;
    this.bootPollIntervalMs = options.bootPollIntervalMs || 5000;
    this.extraArgs = options.extraArgs || ['-no-snapshot-load', '-gpu', 'swiftshader_indirect'];
    this.instances = new Map();
  }

  async launch(avdName) {
    const port = await this.portManager.getNextAdbPort();
    console.log(`[Emulator] Launching ${avdName} on port ${port}...`);

    const process = spawnCommand(this.emulatorCommand, [
      '-avd', avdName,
      '-port', port.toString(),
      ...this.extraArgs,
    ], {
      stdio: 'ignore',
      detached: true,
    });

    process.unref();

    const deviceId = `emulator-${port}`;
    this.instances.set(deviceId, { process, port, avdName });

    try {
      await this.waitForBoot(deviceId);
      await this.optimize(deviceId);
    } catch (error) {
      await this.shutdownInstance(deviceId);
      throw error;
    }

    return deviceId;
  }

  async waitForBoot(deviceId) {
    const start = Date.now();

    while (Date.now() - start < this.bootTimeoutMs) {
      try {
        const status = runCommand(this.adbCommand, ['-s', deviceId, 'shell', 'getprop', 'sys.boot_completed'], {
          allowFailure: true,
        }).stdout.trim();
        if (status === '1') return true;
      } catch (e) {
        // ADB might not be ready yet
      }
      await sleep(this.bootPollIntervalMs);
    }
    throw new Error(`Timeout: ${deviceId} failed to boot`);
  }

  async optimize(deviceId) {
    const commands = [
      'settings put global window_animation_scale 0',
      'settings put global transition_animation_scale 0',
      'settings put global animator_duration_scale 0'
    ];

    for (const cmd of commands) {
      runCommand(this.adbCommand, ['-s', deviceId, 'shell', ...cmd.split(' ')]);
    }
  }

  listAvds() {
    const result = runCommand(this.emulatorCommand, ['-list-avds'], { allowFailure: false });
    return result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  async shutdownInstance(deviceId) {
    const instance = this.instances.get(deviceId);
    if (!instance) return;

    console.log(`[Emulator] Stopping ${deviceId}...`);
    try {
      runCommand(this.adbCommand, ['-s', deviceId, 'emu', 'kill'], { allowFailure: true });
    } catch (e) {
      // Best effort fallback below.
    }
    try {
      instance.process.kill();
    } catch (e) {
      // Ignore already-closed process.
    }
    this.portManager.releasePort(instance.port);
    this.instances.delete(deviceId);
  }

  async shutdownAll() {
    const deviceIds = [...this.instances.keys()];
    for (const deviceId of deviceIds) {
      await this.shutdownInstance(deviceId);
    }
    this.portManager.releaseAll();
  }
}

module.exports = EmulatorManager;
