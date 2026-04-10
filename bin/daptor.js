#!/usr/bin/env node

const { Orchestrator, loadConfig } = require('../index');
const { parseArgs } = require('../src/cli/parseArgs');
const { runDoctor, formatDoctorReport } = require('../src/doctor/runDoctor');
const pkg = require('../package.json');

async function main() {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.options.version || parsed.command === 'version') {
    console.log(pkg.version);
    process.exit(0);
  }

  if (parsed.options.help || parsed.command === 'help') {
    console.log(parsed.helpText);
    process.exit(0);
  }

  const config = loadConfig({
    cwd: process.cwd(),
    configPath: parsed.options.config,
    overrides: parsed.options,
  });

  const orchestrator = new Orchestrator(config);

  process.on('SIGINT', async () => {
    await orchestrator.shutdown('SIGINT');
    process.exit(130);
  });

  process.on('SIGTERM', async () => {
    await orchestrator.shutdown('SIGTERM');
    process.exit(143);
  });

  if (parsed.command === 'doctor') {
    const report = await runDoctor(config, orchestrator.emulatorManager);
    console.log(formatDoctorReport(report));
    process.exit(report.ok ? 0 : 1);
  }

  if (parsed.command === 'list-avds') {
    const avds = orchestrator.emulatorManager.listAvds();
    if (avds.length === 0) {
      console.log('No AVDs detected.');
      process.exit(1);
    }
    for (const avd of avds) {
      console.log(avd);
    }
    process.exit(0);
  }

  if (parsed.avdNames.length === 0) {
    console.error('Usage: daptor run <avd1> <avd2> ...');
    process.exit(1);
  }

  try {
    const session = await orchestrator.run(parsed.avdNames);
    console.log(`[DAPTOR] Session ${session.sessionId} is ready.`);
    console.log('[DAPTOR] Press Ctrl+C to stop all instances.');
  } catch (error) {
    console.error('[DAPTOR] Execution failed:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[DAPTOR] Fatal CLI error:', error.message);
  process.exit(1);
});
