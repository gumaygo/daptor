# DAPTOR

DAPTOR is a CLI orchestrator for parallel Android testing. It prepares multiple emulators, assigns ADB and Appium ports predictably, runs environment checks, and writes a machine-readable session file for downstream automation.

## v1.1 Goals

- Make the tool usable on a fresh machine with explicit configuration
- Add a `doctor` command before real execution
- Produce session output JSON that can be consumed by test runners
- Keep the workflow simple enough for QA engineers to adopt quickly

## What DAPTOR Does

- launches multiple Android emulators in parallel
- allocates even ADB ports without collisions
- starts an Appium server pool
- disables animation scale on ready devices
- writes monitor logs in JSONL format
- writes session metadata in JSON format

## Requirements

- Node.js 18 or newer
- Android SDK with `adb` and `emulator`
- Appium available on the machine
- pre-created Android Virtual Devices

## Install

```bash
git clone https://github.com/gumaygo/daptor.git
cd daptor
npm install
```

## Quick Start

1. Copy the example config:

```bash
cp daptor.config.example.json daptor.config.json
```

On Windows PowerShell you can use:

```powershell
Copy-Item daptor.config.example.json daptor.config.json
```

2. Verify the machine is ready:

```bash
npm run doctor
```

3. List available AVDs:

```bash
node ./bin/daptor.js list-avds
```

4. Run DAPTOR:

```bash
node ./bin/daptor.js run --config daptor.config.json Pixel_5_API_33 Pixel_6_API_34
```

5. Consume the generated session file from your automation framework.

## Commands

```bash
daptor run [options] <avd1> <avd2> ...
daptor doctor [options]
daptor list-avds [options]
```

Important options:

- `--config <path>`
- `--output <path>`
- `--log-path <path>`
- `--adb-port-range 5554-5584`
- `--appium-ports 4723,4724,4725`
- `--headless`
- `--no-headless`
- `--no-monitor`

## Session Output

DAPTOR writes a JSON file after successful orchestration. Example:

```json
{
  "sessionId": "daptor-1712774837000",
  "deviceCount": 2,
  "devices": [
    {
      "avdName": "Pixel_5_API_33",
      "deviceId": "emulator-5554",
      "adbPort": 5554,
      "appiumPort": 4723
    },
    {
      "avdName": "Pixel_6_API_34",
      "deviceId": "emulator-5556",
      "adbPort": 5556,
      "appiumPort": 4724
    }
  ]
}
```

## Example Integration

See [examples/basic-test.js](./examples/basic-test.js) for a minimal WebdriverIO integration example.

## Troubleshooting

- If `doctor` reports missing commands, make sure `adb`, `emulator`, and `appium` are available in `PATH`.
- If an emulator boot times out, increase `bootTimeoutMs` in your config.
- If Appium pool ports are busy, change `appiumPool` in config or stop previous processes.
- If the machine runs out of resources, reduce the emulator count or disable heavy background apps.

## Project Files

- [daptor.config.example.json](./daptor.config.example.json)
- [bin/daptor.js](./bin/daptor.js)
- [src/core/Orchestrator.js](./src/core/Orchestrator.js)
- [src/doctor/runDoctor.js](./src/doctor/runDoctor.js)

## License

MIT
