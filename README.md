# DAPTOR (Dynamic Android Parallel Testing Orchestrator)

Running multiple Android emulators for parallel testing is usually a headache due to port conflicts and heavy resource management. DAPTOR is a CLI tool that automates this process by dynamically assigning ADB and Appium ports, allowing you to run 10+ emulators simultaneously without manual configuration.

## The Algorithms

DAPTOR uses deterministic algorithms to ensure stability in high-concurrency environments.

### 1. Dynamic ADB Port Assignment
To prevent **TOCTOU** (Time-of-Check-Time-of-Use) race conditions, DAPTOR implements an atomic *first-available scan*. 
Let $P_{ADB} = \{5554, 5556, \dots, p_{max}\}$ be the set of candidate even ports. The assignment for emulator $e_i$ is defined as:

$$Port_{ADB}(e_i) = \min \{ p \in P_{ADB} \mid p \notin UsedPorts \}$$

### 2. Cyclic Appium Distribution
To maximize resource utilization across $k$ Appium server instances, we use a cyclic distribution for $n$ emulators:

$$Port_{Appium}(e_i) = Q[(i - 1) \bmod |Q|]$$

Where $Q$ is the pool of pre-allocated Appium ports (e.g., `[4723, 4724, 4725, 4726, 4727]`).

---

## Prerequisites
Before running DAPTOR, make sure you have:
- **Android SDK** installed (with `emulator` and `adb` in your system PATH).
- **Node.js** (v18 or newer).
- **Appium** installed globally (`npm install -g appium`).
- **AVDs** (Android Virtual Devices) already created in your Android Studio.

## Installation
```bash
git clone https://github.com/gumaygo/daptor.git
cd daptor
npm install
```

## Usage

### 1. Check your available AVDs
List your emulator names first:
```bash
emulator -list-avds
```

### 2. Start the Orchestrator
Run DAPTOR and pass the AVD names you want to launch as arguments.
```bash
# Example: Launching 3 emulators in parallel
node bin/daptor.js Pixel_5_API_33 Pixel_6_Pro_API_34 My_Tablet_AVD
```

### 3. Run your tests
Once the CLI shows the emulators are "Ready", you will see a table with their **Device ID** and **Appium Port**. Point your test scripts (WebDriverIO/Cypress/Appium) to these specific ports.

Check `examples/basic-test.js` to see how to connect your test scripts.

### 4. Stopping
Simply press `Ctrl + C`. DAPTOR will perform a clean shutdown, killing all emulator processes and Appium servers automatically.

## Performance Notes
Based on my tests (Xeon Gold, 128GB RAM):
- **5 Emulators**: Avg boot time ~53s.
- **10 Emulators**: Avg boot time ~96s.
- **Success Rate**: 100% (Zero port conflicts across 12+ test sessions).

See [BENCHMARKS.md](./docs/BENCHMARKS.md) for detailed stats and charts.

## Project Structure
- `src/core/`: The core logic for port management, emulator lifecycle, and resource monitoring.
- `bin/`: CLI entry point.
- `docs/`: Technical benchmarks and system architecture diagrams.
- `examples/`: Boilerplate code for connecting tests.

## License
MIT
