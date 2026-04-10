const fs = require('fs');
const path = require('path');
const { remote } = require('webdriverio');

/**
 * Example: Running a simple test on a DAPTOR-managed instance.
 * By default this reads the JSON session output created by DAPTOR v1.1.
 */
async function runTest(deviceId, appiumPort) {
  const opts = {
    path: '/',
    port: appiumPort,
    capabilities: {
      platformName: "Android",
      "appium:deviceName": deviceId,
      "appium:automationName": "UiAutomator2",
      "appium:app": "/path/to/your/app.apk", // Replace with real APK
      "appium:ensureWebviewsHavePages": true,
      "appium:nativeWebScreenshot": true,
      "appium:newCommandTimeout": 3600,
      "appium:connectHardwareKeyboard": true
    }
  };

  const driver = await remote(opts);
  
  try {
    console.log(`[Test] Started on ${deviceId}`);
    // Your test logic here...
    // await driver.$('~login').click();
    
  } finally {
    await driver.deleteSession();
    console.log(`[Test] Finished on ${deviceId}`);
  }
}

function loadSession(sessionPath = path.resolve(process.cwd(), 'daptor-session.json')) {
  const raw = fs.readFileSync(sessionPath, 'utf8');
  return JSON.parse(raw);
}

async function runAllFromSession(sessionPath) {
  const session = loadSession(sessionPath);
  for (const device of session.devices || []) {
    await runTest(device.deviceId, device.appiumPort);
  }
}

module.exports = {
  runTest,
  loadSession,
  runAllFromSession,
};
