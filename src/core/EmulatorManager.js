const { spawn, execSync } = require('child_process');
const path = require('path');

class EmulatorManager {
  constructor(portManager) {
    this.portManager = portManager;
    this.instances = new Map();
  }

  async launch(avdName) {
    const port = await this.portManager.getNextAdbPort();
    console.log(`[Emulator] Launching ${avdName} on port ${port}...`);

    const process = spawn('emulator', [
      '-avd', avdName,
      '-port', port.toString(),
      '-no-snapshot-load',
      '-gpu', 'swiftshader_indirect'
    ], { stdio: 'ignore', detached: true });

    process.unref();

    const deviceId = `emulator-${port}`;
    this.instances.set(deviceId, { process, port, avdName });

    await this.waitForBoot(deviceId);
    await this.optimize(deviceId);

    return deviceId;
  }

  async waitForBoot(deviceId) {
    const timeout = 120000; // 2 minutes
    const start = Date.now();

    while (Date.now() - start < timeout) {
      try {
        const status = execSync(`adb -s ${deviceId} shell getprop sys.boot_completed`, { encoding: 'utf8' }).trim();
        if (status === '1') return true;
      } catch (e) {
        // ADB might not be ready yet
      }
      await new Promise(r => setTimeout(r, 5000));
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
      execSync(`adb -s ${deviceId} shell ${cmd}`);
    }
  }

  shutdownAll() {
    for (const [deviceId, instance] of this.instances) {
      console.log(`[Emulator] Stopping ${deviceId}...`);
      try {
        execSync(`adb -s ${deviceId} emu kill`);
      } catch (e) {
        // Fallback to process kill if adb emu kill fails
        instance.process.kill();
      }
    }
  }
}

module.exports = EmulatorManager;
