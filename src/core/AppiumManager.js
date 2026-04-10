const { spawnCommand, sleep } = require('../utils/system');

class AppiumManager {
  constructor(options = {}) {
    this.portManager = options.portManager;
    this.command = options.command || 'appium';
    this.host = options.host || '127.0.0.1';
    this.startupTimeoutMs = options.startupTimeoutMs || 20000;
    this.extraArgs = options.extraArgs || [];
    this.servers = new Map();
  }

  async startPool() {
    const ports = this.portManager.appiumPool;
    const startups = ports.map(port => this.startServer(port));
    return Promise.all(startups);
  }

  startServer(port) {
    return new Promise((resolve, reject) => {
      console.log(`[Appium] Starting server on port ${port}...`);

      const server = spawnCommand(this.command, [
        '--address', this.host,
        '-p', port.toString(),
        ...this.extraArgs,
      ], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        server.kill();
        reject(new Error(`Appium server on port ${port} did not become ready within ${this.startupTimeoutMs}ms`));
      }, this.startupTimeoutMs);

      const onReady = (chunk) => {
        const text = chunk.toString();
        if (text.includes('Appium REST http interface listener started') || text.includes('listener started')) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          this.servers.set(port, server);
          resolve(port);
        }
      };

      server.stdout.on('data', onReady);
      server.stderr.on('data', onReady);
      server.on('error', (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      });
      server.on('close', (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Appium server on port ${port} exited early with code ${code}`));
      });
    });
  }

  async stopAll() {
    for (const [port, server] of this.servers) {
      console.log(`[Appium] Stopping server on port ${port}...`);
      server.kill();
      await sleep(100);
    }
    this.servers.clear();
  }
}

module.exports = AppiumManager;
