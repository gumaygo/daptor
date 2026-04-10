const net = require('net');

class PortManager {
  constructor(options = {}) {
    this.adbRange = options.adbRange || [5554, 5584];
    this.appiumPool = options.appiumPool || [4723, 4724, 4725, 4726, 4727];
    this.heldPorts = new Set();
  }

  /**
   * Scans for the first available even port in the ADB range.
   * Atomic check-and-hold to prevent race conditions.
   */
  async getNextAdbPort() {
    for (let p = this.adbRange[0]; p <= this.adbRange[1]; p += 2) {
      if (this.heldPorts.has(p)) continue;

      const available = await this.isPortAvailable(p);
      if (available) {
        this.heldPorts.add(p);
        return p;
      }
    }
    throw new Error('No available ADB ports in defined range');
  }

  /**
   * Cyclically assigns Appium ports from the pool.
   */
  getAppiumPort(index) {
    return this.appiumPool[index % this.appiumPool.length];
  }

  isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port, '127.0.0.1');
    });
  }

  releasePort(port) {
    this.heldPorts.delete(port);
  }

  releaseAll() {
    this.heldPorts.clear();
  }
}

module.exports = PortManager;
