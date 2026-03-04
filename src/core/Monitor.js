const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

class Monitor {
  constructor(logPath = 'daptor-monitor.jsonl') {
    this.logPath = logPath;
    this.interval = null;
  }

  start(intervalMs = 5000) {
    this.interval = setInterval(() => {
      const stats = this.collectStats();
      fs.appendFileSync(this.logPath, JSON.stringify(stats) + '\n');
    }, intervalMs);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  collectStats() {
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMem = totalMem - freeMem;

    // Simplified QEMU process count (Windows-centric based on Daptor research environment)
    let qemuCount = 0;
    try {
      const output = execSync('tasklist /FI "IMAGENAME eq qemu-system-x86_64.exe"', { encoding: 'utf8' });
      qemuCount = (output.match(/qemu-system-x86_64/g) || []).length;
    } catch (e) {
      // Fallback for other OS or empty list
    }

    return {
      timestamp: new Date().toISOString(),
      cpuUsage: os.loadavg()[0], // Last 1 min avg
      memory: {
        used: (usedMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        free: (freeMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        percent: ((usedMem / totalMem) * 100).toFixed(2) + '%'
      },
      instances: qemuCount
    };
  }
}

module.exports = Monitor;
