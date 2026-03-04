#!/usr/bin/env node

const { Orchestrator } = require('../index');

const avdNames = process.argv.slice(2);

if (avdNames.length === 0) {
  console.log('Usage: daptor <avd1> <avd2> ...');
  process.exit(1);
}

const orchestrator = new Orchestrator();

// Handle graceful shutdown
process.on('SIGINT', () => orchestrator.shutdown());
process.on('SIGTERM', () => orchestrator.shutdown());

orchestrator.run(avdNames).then(() => {
  console.log('[DAPTOR] Press Ctrl+C to stop all instances.');
}).catch(err => {
  console.error('[DAPTOR] Execution failed:', err);
  orchestrator.shutdown();
});
