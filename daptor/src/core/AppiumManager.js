const { spawn } = require('child_process');

class AppiumManager {
  constructor(portManager) {
    this.portManager = portManager;
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
      
      const server = spawn('appium', ['-p', port.toString()], { shell: true });
      
      server.stdout.on('data', (data) => {
        if (data.toString().includes('Appium REST http interface listener started')) {
          this.servers.set(port, server);
          resolve(port);
        }
      });

      server.on('error', reject);
    });
  }

  stopAll() {
    for (const [port, server] of this.servers) {
      console.log(`[Appium] Stopping server on port ${port}...`);
      server.kill();
    }
  }
}

module.exports = AppiumManager;
