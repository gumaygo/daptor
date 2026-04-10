const fs = require('fs');
const os = require('os');
const { ensureDirectoryForFile, runCommand } = require('../utils/system');

class Monitor {
  constructor(logPath = 'daptor-monitor.jsonl') {
    this.logPath = logPath;
    this.interval = null;
  }

  start(intervalMs = 5000) {
    ensureDirectoryForFile(this.logPath);
    this.interval = setInterval(() => {
      const stats = this.collectStats();
      fs.appendFileSync(this.logPath, JSON.stringify(stats) + '\n');
    }, intervalMs);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  collectStats() {
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMem = totalMem - freeMem;

    // Simplified QEMU process count (Windows-centric based on Daptor research environment)
    let qemuCount = 0;
    try {
      if (process.platform === 'win32') {
        const output = runCommand('tasklist', ['/FI', 'IMAGENAME eq qemu-system-x86_64.exe'], { allowFailure: true }).stdout;
        qemuCount = (output.match(/qemu-system-x86_64/g) || []).length;
      }
    } catch (e) {
      // Fallback for other OS or empty list
    }

    return {
      timestamp: new Date().toISOString(),
      cpuUsage: process.platform === 'win32' ? null : os.loadavg()[0],
      memory: {
        usedMb: Math.round(usedMem / 1024 / 1024),
        freeMb: Math.round(freeMem / 1024 / 1024),
        percentUsed: Number(((usedMem / totalMem) * 100).toFixed(2))
      },
      instances: qemuCount,
      platform: process.platform,
    };
  }
}

module.exports = Monitor;
